'use strict';
/* ============================ GAME LOGIC ================================== */
/* ---- the interactive tutorial: each step must be done before the way opens ---- */
const TUT_STEPS = [
  { id: 'move', key: 'move', text: 'Walk to the right', check: G => G.player.x / T > 9 },
  { id: 'jump', key: 'jump', text: 'JUMP over the gap', check: G => G.player.x / T > 28 && G.player.onGround },
  { id: 'smash', key: 'jump', text: 'Land ON the pottery to smash it', check: G => G.smashes >= 1 },
  { id: 'sword', key: 'arrow', text: 'Grab the SWORD!', check: G => G.sword },
  { id: 'slash', key: 'X', text: 'SLASH the curtain', check: G => G.cuts >= 1 },
  { id: 'fight', key: 'X', text: 'Beat the blob — stomp it or slash it', check: G => G.kills >= 1 },
  { id: 'door', key: 'arrow', text: 'Now head for the door!', check: () => false },
];
const DEATH_T = .78, FREEZE_T = .14;
const ov = (a, b) => a.x1 > b.x0 && a.x0 < b.x1 && a.y1 > b.y0 && a.y0 < b.y1;
const hbox = p => ({ x0: p.x + 4, x1: p.x + p.w - 4, y0: p.y + 6, y1: p.y + p.h });
const circleRect = (cx, cy, r, b) => { const x = clamp(cx, b.x0, b.x1), y = clamp(cy, b.y0, b.y1); const dx = cx - x, dy = cy - y; return dx * dx + dy * dy < r * r; };

function sawPos(s, clock) {
  if (!s.a) return [s.c * T + 32, s.r * T + 32];
  const t = ((clock / s.period + (s.phase || 0)) % 1), u = .5 - .5 * Math.cos(t * 6.2832);
  return [lerp(s.a[0], s.b[0], u) * T + 32, lerp(s.a[1], s.b[1], u) * T + 32];
}
const SAW_R = 23;

Object.assign(G, {
  toastShow(s, t = 1.8) { this.toast = { s, t, max: t }; },

  // Ink is earned by the existing combo loop; a full meter turns a normal slash into a short power fantasy.
  startInkRush(p) {
    if (this.ink < 100 || this.inkRush > 0) return false;
    this.ink = 0; this.inkRush = 3.2; this.questFlash = Math.max(this.questFlash, .35);
    const x = p.x + p.w / 2, y = p.y + p.h / 2;
    this.toastShow('INK RUSH!  CHAIN YOUR HITS!', 1.35);
    FX.ring(x, y, 112, COLORS.red, .42); FX.shock(x, y, 86); FX.burst(x, y, 20, 54, COLORS.red, .42);
    for (let i = 0; i < 12; i++) FX.conf(x + rnd(-24, 24), y + rnd(-28, 28));
    Sound.play('complete'); this.impact(.09, .025, 3);
    return true;
  },

  questStep(kind, amount = 1) {
    const q = this.quest;
    if (!q || q.done || q.type !== kind) return;
    q.progress = Math.min(q.target, q.progress + amount);
    if (q.progress < q.target) {
      if (q.progress === q.target - 1) this.toastShow('ONE MORE: ' + q.label.toUpperCase(), .95);
      return;
    }
    q.done = true; this.bonusScore += 350; this.ink = Math.min(100, this.ink + 35); this.questFlash = 1;
    const p = this.player, x = p.x + p.w / 2, y = p.y + p.h / 2;
    this.toastShow('PAGE QUEST COMPLETE!  +350', 2.0);
    FX.ring(x, y, 100, COLORS.green, .55); FX.shock(x, y, 74); FX.sparkle(x, y, 14);
    for (let i = 0; i < 22; i++) FX.conf(x + rnd(-48, 48), y + rnd(-30, 30));
    Sound.play('complete'); this.impact(.08, .022, 2.5);
  },

  /* ---- damage: shield absorbs once, otherwise a life is lost exactly once ---- */
  hurt(cause, src, force) {
    if (this.state !== 'play') return false;
    const p = this.player;
    if (!force && p.inv > 0) return false;
    if (!force && p.shield) {
      p.shield = false; p.inv = 1.3; p.vy = -430; p.vx = -p.facing * 160; p.scx = .85; p.scy = 1.15;
      Sound.play('shieldBreak'); this.impact(.09, .02, 4); this.flash = .35;
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2, sx = cx + p.facing * 20;
      FX.sprite('item_shield:b', sx, cy, -p.facing * 180, -520, 46, 1.1); FX.shards(sx, cy, 12, '#8ec6f4'); FX.shock(sx, cy, 70); FX.burst(sx, cy, 10, 30, '#5aa0e0', .35); FX.text(cx, cy - 30, 'CLANG!', '#3b6fb0', 28, .8);
      this.toastShow('SHIELD SHATTERED', 1.2);
      return true;
    }
    this.die(cause, src); return true;
  },
  die(cause, src) {
    const p = this.player;
    this.state = 'dying'; this.deathT = 0; if (!this.tutorial) this.lives = Math.max(0, this.lives - 1); this.lifeShake = 1;
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    this.death = { cause, x: cx, y: cy, src: src || null }; Portal.track('death', { level: this.level.id, cause, col: Math.round(cx / T), lives: this.lives });
    p.shield = false; Cam.shake = 7; this.flash = 1; this.combo = 0; this.comboT = 0;
    if (cause === 'cactus') { FX.burst(cx, cy, 10, 30, COLORS.ink); FX.puff(cx, cy, 3, 34); Sound.play('hurt'); }
    else if (cause === 'saw') { FX.burst(cx, cy, 14, 40, COLORS.ink, .32); FX.sparkle(cx, cy, 6); Sound.play('hurt'); }
    else if (cause === 'bullet') { FX.puff(cx, cy, 6, 60, 120); FX.ring(cx, cy, 70, COLORS.ink, .4); FX.burst(cx, cy, 8, 30); Sound.play('hurt'); }
    else if (cause === 'eraser') { FX.puff(cx, cy, 7, 70, 160); FX.burst(cx, cy, 10, 34, COLORS.margin, .4); Sound.play('hurt'); }
    else if (cause === 'enemy') { FX.burst(cx, cy, 10, 30); FX.puff(cx, cy, 3, 34); Sound.play('hurt'); }
    else { FX.puff(cx, this.world.py - 10, 4, 40); Sound.play('death'); Cam.shake = 3; }
    if (cause !== 'pit') setTimeout(() => Sound.play('death'), 90);
    p.vx = 0; p.vy = 0;
  },
  respawn() {
    const cp = this.cp, def = this.level;
    const x = cp ? cp.x : this.spawn.x, b = cp ? cp.y : this.spawn.y;
    this.resetDynamic(false);
    this.spawnPlayer(x, b);
    const p = this.player; p.inv = 1.6; p.popIn = .3; p.scx = .6; p.scy = 1.4;
    FX.puff(x, b - 24, 4, 40); FX.sparkle(x, b - 26, 5);
    Cam.snap(this); this.state = 'play';
  },

  /* ------------------------------ per-frame ----------------------------- */
  /* chain counter: every smash / stomp / slash / star within 1.3 s of the last one extends the chain */
  bump(x, y, word) {
    this.combo++; this.comboT = 1.3; if (this.sword && this.inkRush <= 0) this.ink = Math.min(100, this.ink + 7 + Math.min(this.combo, 8)); if (this.inkRush > 0) this.bonusScore += 20; if (this.combo > this.bestCombo) this.bestCombo = this.combo; if (this.combo === 5) Ach.unlock('combo5'); if (this.combo === 10) Ach.unlock('combo10');
    if (this.combo >= 2) { Sound.play('combo', Math.min(this.combo, 10)); FX.text(x, y - 34, 'x' + this.combo, this.combo >= 5 ? COLORS.red : COLORS.ink, 22 + Math.min(this.combo, 8) * 2, .8); }
    if (word) FX.text(x + rnd(-14, 14), y - 8, word, COLORS.margin, 26, .75);
    if (this.combo === 3 || this.combo === 6 || this.combo === 10) {
      const reward = this.combo === 3 ? 50 : this.combo === 6 ? 100 : 250;
      const callout = this.combo === 3 ? 'NICE!' : this.combo === 6 ? 'GREAT!' : 'SCRIBBLE STORM!';
      this.bonusScore += reward; this.toastShow(callout + '  +' + reward, 1.1);
      FX.ring(x, y, 42 + this.combo * 4, this.combo >= 10 ? COLORS.red : COLORS.yellow, .32);
      if (this.combo >= 6) FX.burst(x, y, this.combo >= 10 ? 18 : 10, 30, this.combo >= 10 ? COLORS.red : COLORS.yellow, .3);
      Cam.kick = Math.max(Cam.kick, .02); Sound.play('complete');
    }
  },
  impact(stop = .05, kick = .012, shake = 0) { this.hitstop = Math.max(this.hitstop, stop); Cam.kick = Math.max(Cam.kick, kick); Cam.shake = Math.max(Cam.shake, shake); },

  update(dt) {
    const st = this.state;
    if (st === 'play' && this.hitstop > 0) { this.hitstop -= dt; Cam.shake = Math.max(0, Cam.shake - dt * 14); Cam.sx = Cam.shake ? rnd(-1, 1) * Cam.shake : 0; Cam.sy = Cam.shake ? rnd(-1, 1) * Cam.shake : 0; return; }
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
    this.flash = Math.max(0, this.flash - dt * 2.2); this.inkRush = Math.max(0, this.inkRush - dt); this.questFlash = Math.max(0, this.questFlash - dt);
    for (let i = this.fly.length - 1; i >= 0; i--) { const f = this.fly[i]; f.t += dt; if (f.t >= f.dur) { this.hudStarFlash = 1; this.fly.splice(i, 1); } }
    if (st === 'complete') { FX.update(dt); if (Math.random() < dt * 40) FX.conf(Cam.x + rnd(0, VW), Cam.y - 10); }
    if (st === 'play') this.stepPlay(dt);
    else if (st === 'dying') {
      this.deathT += dt;
      if (this.deathT >= DEATH_T) { if (this.lives > 0) this.respawn(); else { this.state = 'gameover'; UI.showGameOver(); } }
    } else if (st === 'win') this.stepWin(dt);
    if (st === 'play' || st === 'dying' || st === 'win' || st === 'intro') {
      if (!(st === 'dying' && this.deathT < FREEZE_T)) FX.update(dt);
      if (st !== 'dying') Cam.update(this, dt); else { Cam.shake = Math.max(0, Cam.shake - dt * 28); Cam.sx = Cam.shake ? rnd(-1, 1) * Cam.shake : 0; Cam.sy = Cam.shake ? rnd(-1, 1) * Cam.shake : 0; }
    }
    if (this.toast) { this.toast.t -= dt; if (this.toast.t <= 0) this.toast = null; }
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    this.lifeShake = Math.max(0, this.lifeShake - dt * 2.4); this.hudStarFlash = Math.max(0, this.hudStarFlash - dt * 3);
    for (const s of this.stars) if (s.pop > 0) s.pop = Math.max(0, s.pop - dt);
  },

  stepPlay(dt) {
    this.clock += dt; this.time += dt;
    const p = this.player, W = this.world;
    p.prevBottom = p.y + p.h; if (p.onGround) p.hopped = false;
    for (const s of this.saws) { const q = sawPos(s, this.clock); s.x = q[0]; s.y = q[1]; s.rot += dt * 7; }
    this.stepArenas(dt); this.stepEnemies(dt); this.stepCannons(dt);

    for (const m of this.movers) this.placeMover(m, this.clock);
    if (p.onGround) for (const m of this.movers) if (Math.abs(p.y + p.h - m.box.y0) < 6 + Math.abs(m.dy) && p.x + p.w > m.box.x0 + 3 && p.x < m.box.x1 - 3) { p.x += m.dx; p.y += m.dy; break; }
    for (const [k, t] of this.pads) { if (t - dt <= 0) this.pads.delete(k); else this.pads.set(k, t - dt); }
    this.stepRain(dt);
    playerUpdate(p, dt);                                  // 1-2. player + world collision
    if (this.state !== 'play') return;
    this.trailT -= dt; this.stepT -= dt;
    const sp = Math.hypot(p.vx, p.vy * .6);
    if (this.trailT <= 0) { this.trailT = .035; this.trail.push({ x: p.x + p.w / 2, y: p.y + p.h, a: Math.min(1, sp / 380), sx: p.scx, sy: p.scy }); if (this.trail.length > 7) this.trail.shift(); }
    if (p.onGround && Math.abs(p.vx) > 140 && this.stepT <= 0) { this.stepT = .14; FX.dust(p.x + p.w / 2 - Math.sign(p.vx) * 8, p.y + p.h, Math.sign(p.vx), 2); }
    const hb = hbox(p);
    const W2 = this.world;
    this.stepProgress(p, dt);
    // ---- contextual teaching prompts: the game tells you what to press, when it matters ----
    { let hint = null; const cxp = p.x + p.w / 2; if (this.swordT > 0) this.swordT -= dt;
      if (this.sword) {
        let best = null; for (const d of this.drapes) if (d.alive && !d.lock) { const dx = Math.abs(d.c * T + 32 - cxp); if (dx < 320 && Math.abs((d.r + d.h) * T - (p.y + p.h)) < 260 && (!best || dx < best.dx)) best = { d, dx }; }
        if (best) { this.nearT = best.dx < 200 ? this.nearT + dt : 0; const urgent = this.nearT > 2.2; hint = { k: 'curtain', wx: best.d.c * T + 32, wy: best.d.r * T - 30, near: best.dx < 160, urgent };
          if (urgent) { this.pingT -= dt; if (this.pingT <= 0) { this.pingT = 3.2; Sound.play('warn'); if (!this.curtainToast) { this.curtainToast = true; this.toastShow('Press X to slash the curtain!', 2.4); } } } }
        else this.nearT = 0;
        if (!hint) for (const e of this.enemies) if (e.alive && e.k === 'green' && e.stun > 0 && Math.abs(e.x - cxp) < 240) { hint = { k: 'guard', wx: e.x, wy: e.base - e.h - 36, near: true, urgent: false }; break; }
        if (!hint && this.swordT > 0 && !this.swungRun) hint = { k: 'sword' };
      }
      this.hint = hint;
      for (const e of this.enemies) if (e.alive && !this.seenKind[e.k] && (e.k === 'yellow' || e.k === 'flyer') && e.x > Cam.x && e.x < Cam.x + VW - 40 && !e.spawnT) { this.seenKind[e.k] = true; this.toastShow(e.k === 'yellow' ? 'CHARGER! it dashes at you — jump over it or stomp it' : 'FLYER! stomp it, or jump and slash (X)', 3); break; }
    }
    if (p.onGround) for (const fx of [p.x + 4, p.x + p.w - 4]) { const cc = Math.floor(fx / T), rr = Math.floor((p.y + p.h + 2) / T), t = W2.at(cc, rr); if (t && TILES[t].crumble) { const k = rr * W2.w + cc; if (!this.crumble.has(k)) { this.crumble.set(k, .5); FX.dust(cc * T + 32, rr * T + 2, 0, 3); Sound.play('land'); } } }
    for (const [k, t] of this.crumble) { if (t - dt <= 0) { const cc = k % W2.w, rr = Math.floor(k / W2.w); W2.grid[k] = ''; this.crumble.delete(k); FX.sprite('bridge_arch:x', cc * T + 32, rr * T + 32, rnd(-30, 30), 40, 64, 1.1); FX.puff(cc * T + 32, rr * T + 10, 2, 36); } else this.crumble.set(k, t - dt); }
    const ch = this.chase;
    if (!ch.active) { for (const [c1, c2, sp] of (this.level.chase || [])) if (!ch.done.has(c1) && p.x / T >= c1 && p.x / T < c2) { ch.active = true; ch.done.add(c1); ch.c2 = c2; ch.sp = sp; ch.x = p.x - 520; Sound.play('fire'); Cam.shake = 5; this.toastShow('THE ERASER! keep running!', 2); } }
    else { ch.x += ch.sp * dt; if (Math.random() < dt * 30) FX.dust(ch.x - rnd(0, 120), rnd(Cam.y, Cam.y + VH), 1, 1); if (p.x / T >= ch.c2) { ch.active = false; FX.puff(ch.x, p.y, 6, 80, 140); this.toastShow('safe!', 1); } else if (p.x + 10 < ch.x) { if (this.hurt('eraser', { x: ch.x - 30, y: p.y + 26, r: 90 })) return; } }
    if (this.endless) {
      this.dist = Math.max(this.dist, Math.floor((p.x - this.spawn.x) / T));
      const ta = this.level.themeAt; let k = 0; for (let i = 0; i < ta.length; i++) if (p.x / T >= ta[i][0]) k = i;
      if (k !== this.themeIdx) { this.themeIdx = k; this.theme = ta[k][1]; Sound.play('page'); this.flash = .0; Cam.kick = .04; for (let i = 0; i < 30; i++) FX.conf(Cam.x + rnd(0, VW), Cam.y - rnd(0, 60)); this.toastShow('NEW PAGE · ' + this.theme.toUpperCase(), 1.8); Sound.music(1 + (k % 4)); }
    }
    // 3. hazards
    for (const c of this.cacti) if (ov(hb, c.box)) { if (this.hurt('cactus', { x: c.c * T + 32, y: c.r * T + 40, r: 40 })) return; }
    for (const s of this.saws) if (circleRect(s.x, s.y, SAW_R, hb)) { if (this.hurt('saw', { x: s.x, y: s.y, r: 38 })) return; }
    // 4. enemies
    if (this.enemyContacts(p, hb)) return;
    if (this.state !== 'play') return;
    // sword
    if (p.atk > 0) this.swordHits(p);
    // 5. projectiles
    for (const b of this.bullets) if (b.friendly) { for (const e of this.enemies) if (e.alive && circleRect(b.x, b.y, b.r + 4, this.enemyBox(e))) { b.dead = true; this.damageEnemy(e, 'sword'); } } else if (circleRect(b.x, b.y, b.r, hb)) { b.dead = true; FX.puff(b.x, b.y, 3, 40); if (this.hurt('bullet', { x: b.x, y: b.y, r: 32 })) return; }
    this.bullets = this.bullets.filter(b => !b.dead);
    // 6. pickups
    this.pickups(p, hb);
    // 7. checkpoints
    for (const cp of this.cps) {
      cp.t += dt;
      if (!cp.on && Math.abs(p.x + p.w / 2 - cp.x) < 38 && Math.abs(p.y + p.h - cp.y) < 70) {
        cp.on = true; this.cp = cp; Sound.play('check'); FX.ring(cp.x, cp.y - 30, 54, COLORS.yellow, .5); FX.sparkle(cp.x, cp.y - 34, 8); this.toastShow('CHECKPOINT', 1.3);
      }
    }
    // 8. exit
    const d = this.door, dx = d.c * T + 32, dy = d.y + T;
    const locked = this.enemies.some(e => e.boss && e.alive);
    if (locked && Math.abs(p.x + p.w / 2 - dx) < 260 && !this.bossHint) { this.bossHint = true; this.toastShow('the door is sealed — defeat the boss!', 2.2); }
    if (!locked && !d.opened && Math.abs(p.x + p.w / 2 - dx) < 190 && Math.abs(p.y + p.h - dy) < 260) { d.opened = true; Sound.play('door'); FX.puff(dx, dy - 30, 3, 36); }
    if (d.opened) d.open = Math.min(1, d.open + dt * 4);
    if (d.open > .6 && ov(hb, { x0: d.c * T + 18, x1: d.c * T + 46, y0: d.y + 10, y1: d.y + T })) this.beginWin();
  },

  stepEnemies(dt) {
    for (const e of this.enemies) {
      if (!e.alive) { e.dead += dt; continue; }
      e.sq = Math.max(0, e.sq - dt * 4); e.flash = Math.max(0, e.flash - dt * 3);
      if (e.spawnT > 0) { e.spawnT -= dt; if (e.spawnT <= 0) { if (e.k === 'flyer') { e.hopY = 88; FX.puff(e.x, e.base - 90, 3, 40, 90); Sound.play('whoosh'); } else { e.dropping = true; e.dropV = 0; e.hopY = e.dropY || 320; Sound.play('whoosh'); } } continue; }
      if (e.dropping) { e.dropV += 2300 * dt; e.hopY -= e.dropV * dt; if (e.hopY <= 0) { e.hopY = 0; e.dropping = false; FX.puff(e.x, e.base - 8, 4, 46, 110); FX.shock(e.x, e.base, 70); Sound.play('land'); Cam.shake = Math.max(Cam.shake, 3); } continue; }
      if (e.boss) { this.stepBoss(e, dt); continue; }
      if (e.stun > 0) { e.stun -= dt; continue; }
      if (e.chase) e.dir = (this.player.x + 19 > e.x) ? 1 : -1;
      if (e.k === 'flyer') { e.t = (e.t || 0) + dt; e.hopY = 88 + Math.sin(e.t * 2.4 + e.c) * 14; e.x += e.dir * (e.chase ? 95 : 78) * dt; e.walk += dt * 10; if (e.x < e.minX) { e.x = e.minX; e.dir = 1; } else if (e.x > e.maxX) { e.x = e.maxX; e.dir = -1; } continue; }
      let sp = e.spd;
      if (e.k === 'yellow') {         // charger: patrols, winds up with a "!", then dashes at you
        e.cs = e.cs || 'patrol'; e.ct = (e.ct || 0) - dt; const dx = this.player.x + 19 - e.x, same = Math.abs((this.player.y + this.player.h) - e.base) < 90;
        if (e.cs === 'patrol') { sp = e.spd * .6; if (e.ct <= 0 && same && Math.abs(dx) < 7 * T && Math.sign(dx) === e.dir) { e.cs = 'wind'; e.ct = .55; Sound.play('warn'); } }
        else if (e.cs === 'wind') { sp = 0; e.sq = Math.max(e.sq, .7); if (e.ct <= 0) { e.cs = 'dash'; e.ct = .8; Sound.play('whoosh'); } }
        else if (e.cs === 'dash') { sp = 330; if (Math.random() < dt * 40) FX.dust(e.x, e.base, -e.dir, 1); if (e.ct <= 0) { e.cs = 'rest'; e.ct = 1; } }
        else { sp = 20; if (e.ct <= 0) { e.cs = 'patrol'; e.ct = 1.2; } }
      }
      if (e.hop) { e.hopT += dt; const t = e.hopT % 1.5; if (t < .55) { e.hopY = Math.sin(t / .55 * Math.PI) * 54; sp = e.spd * 1.5; } else { e.hopY = 0; sp = 0; } }
      e.x += e.dir * sp * dt; e.walk += sp * dt * .06;
      if (e.x < e.minX) { e.x = e.minX; e.dir = 1; } else if (e.x > e.maxX) { e.x = e.maxX; e.dir = -1; }
    }
  },
  stepBoss(e, dt) {
    if (e.stun > 0) { e.stun -= dt; return; }
    if (e.slam > 0) {
      e.slam -= dt; const u = 1 - e.slam / .75; e.hopY = Math.sin(Math.min(1, u) * Math.PI) * 110;
      if (e.slam <= 0) { e.hopY = 0; Cam.shake = 6; Sound.play('fire'); FX.shock(e.x, e.base, 120); FX.puff(e.x, e.base - 10, 5, 60, 140);
        for (const d of [-1, 1]) this.bullets.push({ x: e.x + d * 56, y: e.base - 14, vx: d * 230, r: 12, dir: d, dist: 0, dead: false, wave: true, maxDist: 8 * T }); }
      return;
    }
    e.slamT -= dt; e.x += e.dir * e.spd * (e.boss === 'head' ? 1.1 : 1) * dt; e.walk += e.spd * dt * .05;
    if (e.x < e.minX) { e.x = e.minX; e.dir = 1; } else if (e.x > e.maxX) { e.x = e.maxX; e.dir = -1; }
    if (e.slamT <= 0) { e.slam = .75; e.slamT = e.boss === 'head' ? 3 : 3.6; Sound.play('whoosh'); }
  },
  enemyBox(e) { return { x0: e.x - e.w / 2, x1: e.x + e.w / 2, y0: e.base - e.hopY - e.h, y1: e.base - e.hopY }; },
  enemyContacts(p, hb) {
    for (const e of this.enemies) {
      if (!e.alive || e.spawnT > 0 || e.dropping) continue;
      const b = this.enemyBox(e);
      if (!ov(hb, b)) continue;
      const depth = (p.y + p.h) - b.y0;
      if (e.boss && p.vy > 0 && depth < 34) { p.vy = -PH.BOUNCE_HI; p.jumping = true; p.cut = false; p.y = b.y0 - p.h - 1; p.onGround = false; p.scx = .8; p.scy = 1.2; p.inv = Math.max(p.inv, .15); Sound.play('hit'); FX.text(e.x, b.y0 - 8, 'BOING!', COLORS.ink, 24, .6); continue; }
      if (p.vy > 0 && depth < 28) {        // stomp (forgiving)
        p.vy = -(Input.jump ? PH.BOUNCE_HI : PH.BOUNCE); p.jumping = true; p.cut = !Input.jump; p.y = b.y0 - p.h - 1; p.onGround = false; p.scx = .8; p.scy = 1.2;
        p.inv = Math.max(p.inv, .08);
        if (e.k === 'green') { e.stun = 1.1; e.sq = 1; Sound.play('hit'); this.impact(.05, .01, 2); FX.shock(e.x, b.y0, 56); FX.text(e.x, b.y0 - 6, 'CLANG!', COLORS.ink, 24, .7); if (!this.warnedGuard) { this.warnedGuard = true; this.toastShow('ARMOR! stomps only stun — slash with X', 2.6); } continue; }
        this.damageEnemy(e, 'stomp'); continue;
      }
      if (e.stun > 0 && !e.boss) continue;
      if (e.boss && e.stun > 0) continue;
      if (this.hurt('enemy', { x: e.x, y: (b.y0 + b.y1) / 2, r: 44 })) return true;
    }
    return false;
  },
  damageEnemy(e, how) {
    if (e.boss && e.stun > 0) return;
    const b = this.enemyBox(e), cx = e.x, cy = (b.y0 + b.y1) / 2;
    e.hp--; e.flash = 1; this.bump(cx, cy - 10, how === 'stomp' ? ['BONK!', 'POP!', 'SPLAT!'][Math.floor(rnd(0, 3))] : ['SLASH!', 'ZAP!', 'SNIP!'][Math.floor(rnd(0, 3))]);
    this.impact(e.hp <= 0 ? .075 : .05, e.hp <= 0 ? .02 : .012, e.k === 'green' ? 3.5 : 2); FX.shock(cx, cy, 60);
    if (e.hp <= 0 && e.boss) { this.bossDown(e, cx, cy); return; }
    if (e.boss) { e.stun = 1.0; e.flash = 1; this.impact(.12, .03, 6); FX.puff(cx, cy, 4, 70, 120); FX.burst(cx, cy, 12, 40, COLORS.margin, .4); this.toastShow(e.hp + ' more hit' + (e.hp > 1 ? 's' : '') + '!', 1); return; }
    if (e.hp <= 0) {
      this.kills++; this.questStep('kills'); if (this.inkRush > 0) this.inkRush = Math.min(4.2, this.inkRush + .35); e.alive = false; e.dead = 0; e.dvx = (how === 'sword' ? this.player.facing : (cx > this.player.x ? 1 : -1)) * rnd(90, 160); Sound.play(how === 'stomp' ? 'stomp' : 'hit'); Sound.play('defeat');
      FX.puff(cx, cy, 4, e.k === 'green' ? 54 : 42); FX.sparkle(cx, cy, 4); FX.burst(cx, cy, 6, 20, COLORS.ink, .22);
      if (e.k === 'green') { this.killedGuards++; Cam.shake = 3; Ach.unlock('guard'); }
    } else {
      e.stun = .75; e.sq = 1; Sound.play('hit'); FX.burst(cx, cy, 8, 24, COLORS.ink, .25); FX.puff(cx, b.y1, 2, 30); Cam.shake = 3;
      e.x += this.player.facing * 10; e.x = clamp(e.x, e.minX, e.maxX);
    }
  },
  bossDown(e, cx, cy) {
    e.alive = false; e.dead = 0; e.dvx = 60; Sound.play('complete'); Sound.play('fire'); this.impact(.22, .05, 9); this.flash = .5;
    FX.puff(cx, cy, 10, 90, 220); FX.shock(cx, cy, 160); FX.burst(cx, cy, 16, 60, COLORS.ink, .5); FX.sparkle(cx, cy, 16); for (let i = 0; i < 40; i++) FX.conf(cx + rnd(-120, 120), cy - rnd(0, 120));
    this.bump(cx, cy, 'BOSS DOWN!'); this.toastShow('BOSS DEFEATED!  the door is open', 2.4); this.bullets = this.bullets.filter(b => !b.wave); Ach.unlock('boss');
  },
  swordHits(p) {
    const f = p.facing, reach = this.inkRush > 0 ? 128 : 74, r = f > 0 ? { x0: p.x + p.w - 6, x1: p.x + p.w + reach } : { x0: p.x - reach, x1: p.x + 6 };
    r.y0 = p.y - (this.inkRush > 0 ? 26 : 8); r.y1 = p.y + p.h + (this.inkRush > 0 ? 26 : 8);
    for (const e of this.enemies) { if (!e.alive || p.atkHit.has(e)) continue; if (ov(r, this.enemyBox(e))) { p.atkHit.add(e); if (e.boss === 'blob') { Sound.play('hit'); FX.text(e.x, e.base - e.h - 10, 'needs a cannonball!', COLORS.margin, 22, .9); this.swordHop(p); continue; } this.damageEnemy(e, 'sword'); this.swordHop(p); } }
    for (const b of this.bullets) if (!b.dead && !b.friendly && ov(r, { x0: b.x - b.r, x1: b.x + b.r, y0: b.y - b.r, y1: b.y + b.r })) {
      Ach.unlock('deflect'); b.friendly = true; b.vx = -b.vx * 1.35; b.vy = -(b.vy || 0) * 1.35; b.dir = -b.dir; b.dist = 0; FX.burst(b.x, b.y, 8, 24, COLORS.yellow, .3); FX.shock(b.x, b.y, 44); Sound.play('hit'); this.impact(.06, .015, 2); this.bump(b.x, b.y, 'DEFLECT!');
    }
    for (const q of this.pottery) if (q.alive && !p.atkHit.has(q) && ov(r, q.box)) { p.atkHit.add(q); potteryBreak(q, false); this.swordHop(p); }
    for (const d of this.drapes) if (d.alive && !d.lock && !p.atkHit.has(d) && ov(r, d.box)) { p.atkHit.add(d); this.cutDrape(d); this.swordHop(p); }
  },

  calcScore() { return this.bonusScore + this.starCount * 100 + this.kills * 60 + this.smashes * 15 + this.cuts * 50 + this.bestCombo * 40 + (this.bag && this.bag.taken ? 300 : 0); },
  rankOf(score) { const m = this.rankMax; return score >= m * .62 ? 'S' : score >= m * .45 ? 'A' : score >= m * .3 ? 'B' : 'C'; },
  swordHop(p) { if (!p.onGround && !p.hopped) { p.hopped = true; p.vy = Math.min(p.vy, -430); p.jumping = true; p.cut = true; p.scx = .85; p.scy = 1.15; } },
  cutDrape(d) {
    d.alive = false; d.cut = 0; this.cuts++; this.questStep('cuts'); if (this.inkRush > 0) this.inkRush = Math.min(4.2, this.inkRush + .18); this.cutGates.add(d.i); Sound.play('swing'); Sound.play('hit'); Ach.unlock('curtain');
    const x = d.c * T + 32, y = (d.r + d.h / 2) * T;
    FX.shards(x, y, 14, '#e9a3a6'); FX.puff(x, y, 3, 50, 80); FX.shock(x, y, 80); FX.text(x, y - 20, 'RIIIP!', COLORS.margin, 30, .8); this.impact(.07, .018, 3);
    this.bump(x, y, null); this.toastShow('a hidden way opens…', 1.4);
  },
  /* ---------------- arena fights: gates lock, enemies drop in wave by wave ---------------- */
  /* pot party: shadows appear, then pottery rains down — smash them all for a bonus */
  stepRain(dt) {
    const p = this.player, px = p.x / T;
    for (const r of this.rains) {
      if (r.done) continue;
      if (r.state === 0) { if (px >= r.c1 + 2 && px < r.c2 - 2) { r.state = 1; r.t = 0; const span = r.c2 - r.c1 - 6;
          for (let i = 0; i < r.n; i++) { let col = r.c1 + 3 + span * (i + .5) / r.n; if (Math.abs(col - px) < 2.5) col += col > px ? 3 : -3; r.pots.push({ c: Math.round(col), t: .7 + i * .34, y: 0, vy: 0, st: 'shadow', rot: rnd(0, 6), q: null }); }
          Sound.play('warn'); this.toastShow('POT PARTY!  smash them all', 2); } continue; }
      let live = 0;
      for (const o of r.pots) {
        if (o.st === 'shadow') { o.t -= dt; if (o.t <= 0) { o.st = 'fall'; o.y = (r.r - 7) * T; o.vy = 0; Sound.play('whoosh'); } live++; }
        else if (o.st === 'fall') { o.vy += 2000 * dt; o.y += o.vy * dt; o.rot += dt * 6; live++; const fy = this.world.floorY(o.c, r.r) - 56;
          if (o.y >= fy) { o.st = 'land'; o.y = fy; FX.puff(o.c * T + 32, fy + 50, 3, 40, 80); FX.shock(o.c * T + 32, fy + 56, 50); Sound.play('land'); Cam.shake = Math.max(Cam.shake, 1.5); } }
        else if (o.st === 'land') { live++; const bx = { x0: o.c * T + 12, x1: o.c * T + 52, y0: r.r * T + 8, y1: (r.r + 1) * T }; if (!ov(hbox(p), bx)) { const q = { c: o.c, r: r.r, tall: false, alive: true, sq: 0, starRef: null, box: { ...bx }, bounce: PH.BOUNCE }; q.box.pot = q; this.pottery.push(q); this.dyn = this.pottery.concat(this.drapes, this.movers); o.st = 'pot'; o.q = q; } }
        else if (o.st === 'pot') { if (!o.q.alive) o.st = 'gone'; else live++; }
      }
      if (!live && r.pots.length) { r.done = true; this.rainDone.add(r.i); this.bonusScore += 150; this.bump(p.x, p.y, null); this.toastShow('POT PARTY CLEARED! +150', 2); Sound.play('complete'); for (let i = 0; i < 24; i++) FX.conf(p.x + rnd(-200, 200), p.y - rnd(40, 160)); }
    }
  },
  /* tutorial steps, section banners, milestones, flawless bonuses, music intensity */
  stepProgress(p, dt) {
    const px = p.x / T, lv = this.level;
    if (this.tut) {
      const st = TUT_STEPS[this.tut.i]; this.tut.flash = Math.max(0, this.tut.flash - dt * 2);
      if (st && st.check(this)) {
        this.tut.done.push(st.id); this.tut.i++; this.tut.flash = 1; Sound.play('star', 4); Sound.play('combo', 3); this.impact(.05, .01, 0);
        for (let i = 0; i < 18; i++) FX.conf(p.x + rnd(-120, 120), p.y - rnd(20, 120)); FX.text(p.x + 19, p.y - 36, ['NICE!', 'YES!', 'GREAT!', 'COOL!'][this.tut.i % 4], COLORS.green, 30, .9);
        for (const d of this.drapes) if (d.tut === st.id && d.alive) { d.alive = false; FX.shards(d.c * T + 32, 5.5 * T, 12, '#d9363e'); FX.puff(d.c * T + 32, 5.5 * T, 3, 50, 90); }
      }
    }
    for (const s of (lv.sections || [])) {
      if (px >= s[0] && px < s[1]) {
        if (this.sec !== s) {
          if (this.sec && px >= this.sec[1] && this.secLives === this.lives && !this.secBonus.has(this.sec)) { this.secBonus.add(this.sec); this.bonusScore += 50; FX.text(p.x + 19, p.y - 40, 'FLAWLESS +50', COLORS.green, 24, 1); Sound.play('star', 6); }
          this.sec = s; this.secLives = this.lives;
          if (!this.secSeen.has(s)) { this.secSeen.add(s); this.banner = { name: s[2], sub: s[3] || '', t: 2.6 }; Sound.play('combo', 8); Cam.kick = Math.max(Cam.kick, .01); }
        }
        break;
      }
      if (this.sec === s && px >= s[1]) { if (this.secLives === this.lives && !this.secBonus.has(s)) { this.secBonus.add(s); this.bonusScore += 50; FX.text(p.x + 19, p.y - 40, 'FLAWLESS +50', COLORS.green, 24, 1); Sound.play('star', 6); } this.sec = null; }
    }
    if (!this.tutorial) { const prog = lv.exit ? px / lv.exit[0] : 0; for (const m of [.25, .5, .75]) if (prog >= m && !this.mile.has(m)) { this.mile.add(m); this.bonusScore += 100; this.toastShow((m === .5 ? 'HALFWAY!' : m === .25 ? 'QUARTER DONE!' : 'ALMOST THERE!') + '  +100', 2); Sound.play('complete'); for (let i = 0; i < 20; i++) FX.conf(p.x + rnd(-200, 200), p.y - rnd(40, 160)); } }
    const hot = this.chase.active || this.arenas.some(a => a.state === 1 && !a.done) || this.enemies.some(e => e.boss && e.alive && Math.abs(e.x - p.x) < 900);
    const inten = hot ? 2 : 1; if (inten !== this.inten) { this.inten = inten; Sound.intensity(inten); }
  },
  stepArenas(dt) {
    const p = this.player, px = p.x / T;
    for (const a of this.arenas) {
      if (a.done) continue;
      if (a.state === 0) { if (px >= a.c1 + 4 && px < a.c2 - 3) { a.state = 1; a.wave = 0; a.t = .7; a.spawned = false; this.lockArena(a, true); Sound.play('fire'); Cam.shake = 5; this.impact(.06, .02, 4); this.toastShow('FIGHT!', 1.3); } continue; }
      a.t -= dt;
      if (!a.spawned) { if (a.t <= 0) { this.spawnWave(a); a.spawned = true; } }
      else if (a.list.every(e => !e.alive && e.dead > .4)) { a.wave++; if (a.wave >= a.waves.length) this.clearArena(a); else { a.spawned = false; a.t = .9; this.toastShow('WAVE ' + (a.wave + 1) + ' / ' + a.waves.length, 1.1); } }
    }
  },
  lockArena(a, on) {
    if (on) { for (const col of [a.c1, a.c2]) { const d = { c: col, r: a.r - 2, h: 3, i: -1, lock: true, alive: true, sway: rnd(0, 6), cut: 0, box: { x0: col * T + 10, x1: col * T + 54, y0: (a.r - 2) * T, y1: (a.r + 1) * T } }; this.drapes.push(d); a.gates.push(d); FX.shock(col * T + 32, a.r * T, 80); } this.dyn = this.pottery.concat(this.drapes); }
    else { for (const d of a.gates) { d.alive = false; FX.shards(d.c * T + 32, (d.r + 1.5) * T, 12, '#d9363e'); FX.puff(d.c * T + 32, (d.r + 1.5) * T, 3, 50, 90); } a.gates = []; }
  },
  spawnWave(a) {
    const defs = a.waves[a.wave], span = a.c2 - a.c1 - 8, px = this.player.x / T;
    defs.forEach((d, i) => {
      let col = a.c1 + 4 + (span * (i + .5)) / defs.length; if (Math.abs(col - px) < 3.5) col += (col > px ? 4 : -4); col = clamp(col, a.c1 + 3, a.c2 - 3);
      const e = this.buildEnemy({ k: d.k, hop: d.hop, c: Math.round(col), r: a.r, min: a.c1 + 1, max: a.c2 - 1, chase: true, hp: d.hp });
      e.x = col * T + 32; e.spawnT = .9 + i * .25; e.dropY = 330; this.enemies.push(e); a.list.push(e);
    });
    Sound.play('warn');
  },
  clearArena(a) {
    a.done = true; this.arenaDone.add(a.i); this.lockArena(a, false); Sound.play('complete'); this.impact(.1, .03, 4); this.flash = .2;
    const cx = ((a.c1 + a.c2) / 2) * T; for (let i = 0; i < 30; i++) FX.conf(cx + rnd(-260, 260), (a.r - 3) * T - rnd(0, 80));
    this.items.push({ k: 'heart', c: Math.round((a.c1 + a.c2) / 2), r: a.r, x: cx + 32, y: (a.r) * T + 32, taken: false, ph: 0 }); this.bump(cx, a.r * T, 'CLEARED!'); this.toastShow('ARENA CLEARED!', 1.8);
  },

  /* ---------------- cannons: telegraphed, optionally aimed (tracks you, then locks) and bursting ---------------- */
  aimCannon(c, p) {
    const px = p.x + p.w / 2, py = p.y + p.h * .55; let dx = px - c.mx, dy = py - c.my; if (dx * c.dir < 0) { dx = c.dir * 200; dy = 0; }
    const base = c.dir < 0 ? Math.PI : 0, a = Math.atan2(dy, dx); let rel = Math.atan2(Math.sin(a - base), Math.cos(a - base)); rel = clamp(rel, -.85, .85); c.ang = base + rel;
  },
  fireShot(c) {
    const sp = c.speed || 300, ca = Math.cos(c.ang), sa = Math.sin(c.ang);
    this.bullets.push({ x: c.mx + ca * 18, y: c.my + sa * 18, vx: ca * sp, vy: sa * sp, r: 13, dir: ca < 0 ? -1 : 1, dist: 0, dead: false, maxDist: (c.range || 12) * T });
    Sound.play('fire'); FX.puff(c.mx + ca * 16, c.my + sa * 16, 3, 34, 70); c.flash = 1;
  },
  stepCannons(dt) {
    const camR = { x0: Cam.x, x1: Cam.x + VW, y0: Cam.y, y1: Cam.y + VH };
    const p = this.player;
    for (const c of this.cannons) {
      const vis = ov(camR, { x0: c.x, x1: c.x + T, y0: c.y, y1: c.y + (c.size === 'small' ? T : 2 * T) });
      c.flash = Math.max(0, c.flash - dt * 5);
      if (!vis) { c.t = c.phase || 0; c.warned = false; c.burstLeft = 0; continue; }
      if (c.burstLeft > 0) { c.burstT -= dt; if (c.burstT <= 0) { this.fireShot(c); c.burstLeft--; c.burstT = .15; } }
      c.t += dt;
      const w0 = c.interval - c.warn, lock = c.interval - .3;
      if (c.aim && c.t >= w0 && c.t < lock) this.aimCannon(c, p); else if (!c.aim) c.ang = c.dir < 0 ? Math.PI : 0;
      if (c.t >= w0 && !c.warned) { c.warned = true; Sound.play('warn'); }
      if (c.t >= c.interval) {
        const sx = c.mx + Math.cos(c.ang) * 18, sy = c.my + Math.sin(c.ang) * 18;
        if (circleRect(sx, sy, 16, hbox(p))) { c.t = c.interval; continue; }      // never spawn a bullet inside the player: wait until clear
        this.fireShot(c); c.burstLeft = (c.burst || 1) - 1; c.burstT = .15; c.t = 0; c.warned = false;
      }
    }
    const W = this.world;
    for (const b of this.bullets) {
      for (const q of this.pottery) if (q.alive && circleRect(b.x, b.y, b.r, q.box)) { b.dead = true; potteryBreak(q, false); FX.puff(b.x, b.y, 2, 36); }
      for (const d of this.drapes) if (d.alive && circleRect(b.x, b.y, b.r, d.box)) { b.dead = true; FX.puff(b.x, b.y, 2, 36); }
      const vy = b.vy || 0, sp = Math.hypot(b.vx, vy) || 1; b.x += b.vx * dt; b.y += vy * dt; b.dist += sp * dt;
      const ax = b.x + b.vx / sp * b.r, ay = b.y + vy / sp * b.r;
      if (W.solidAt(ax, ay) || b.dist > (b.maxDist || 12 * T) || b.x < Cam.x - 220 || b.x > Cam.x + VW + 220 || b.y > W.py + 80 || b.y < -200) {
        b.dead = true; FX.puff(b.x, b.y, 3, 36);
        if (W.solidAt(ax, ay) && b.x > Cam.x && b.x < Cam.x + VW) { Sound.play('hit'); Cam.shake = Math.max(Cam.shake, 2.5); }
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);
  },

  pickups(p, hb) {
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    const pull = (o, range, speed) => { const dx = cx - o.x, dy = cy - o.y, d = Math.hypot(dx, dy); if (d < range && d > 1) { const m = Math.min(d, speed * DT); o.x += dx / d * m; o.y += dy / d * m; } };
    for (const s of this.stars) if (!s.taken && !s.hidden) pull(s, 90, 420);
    for (const it of this.items) if (!it.taken) pull(it, 170, 460);
    for (const s of this.stars) {
      if (s.taken || s.hidden) continue;
      if (Math.abs(s.x - cx) < 34 && Math.abs(s.y - cy) < 40) {
        s.taken = true; this.starCount++; this.questStep('stars'); Sound.play('star', Math.min(this.combo, 9)); FX.sparkle(s.x, s.y, 7); FX.ring(s.x, s.y, 36, COLORS.yellow, .3); s.pop = .3;
        this.fly.push({ x: s.x - Cam.x, y: s.y - Cam.y, t: 0, dur: .55 }); this.bump(s.x, s.y);
      }
    }
    const b = this.bag;
    if (b && !b.taken && Math.abs(b.x - cx) < 38 && Math.abs(b.y - cy) < 44) {
      b.taken = true; Ach.unlock('bag'); Sound.play('bag'); FX.sparkle(b.x, b.y, 12); FX.ring(b.x, b.y, 60, COLORS.yellow, .5); this.toastShow('BAG FOUND!', 1.6); this.hudStarFlash = 1;
    }
    for (const it of this.items) {
      if (it.taken) continue;
      if (Math.abs(it.x - cx) < 38 && Math.abs(it.y - cy) < 44) {
        it.taken = true; FX.sparkle(it.x, it.y, 10); FX.ring(it.x, it.y, 60, it.k === 'shield' ? '#5aa0e0' : COLORS.ink, .45);
        if (it.k === 'heart') { if (this.lives < 3) { this.lives++; this.toastShow('EXTRA LIFE!', 1.6); Sound.play('shield'); FX.text(it.x, it.y - 30, '+1 ♥', COLORS.red, 28, .9); } else { this.bump(it.x, it.y, null); Sound.play('star', 3); } }
        else if (it.k === 'shield') { p.shield = true; Sound.play('shield'); this.toastShow('SHIELD  ·  blocks one hit', 2); }
        else { this.sword = true; p.sword = true; Save.data.sword = true; Save.write(); this.swordT = 7; Ach.unlock('sword'); Sound.play('swordGet'); this.impact(.12, .03, 3); FX.shock(it.x, it.y, 90); FX.burst(it.x, it.y, 12, 36, COLORS.yellow, .45); }
      }
    }
  },

  beginWin() {
    if (this.state !== 'play') return;
    this.state = 'win'; this.winT = 0; this.player.win = true; this.player.vx = 0; this.player.vy = 0;
    Sound.play('complete'); Cam.shake = 3; FX.sparkle(this.door.c * T + 32, this.door.y + 30, 14); for (let i = 0; i < 40; i++) FX.conf(this.door.c * T + 32 + rnd(-200, 200), this.door.y - rnd(0, 140));
    const d = this.door; this.winFrom = this.player.x + this.player.w / 2; this.winTo = d.c * T + 32;
  },
  stepWin(dt) {
    this.winT += dt; const p = this.player, u = clamp(this.winT / .7, 0, 1);
    p.x = lerp(this.winFrom, this.winTo, ease.out(u)) - p.w / 2; p.y = Math.min(p.y, this.door.y + T - p.h);
    if (!this.winDone && this.winT > 1.05) { this.winDone = true; this.finishLevel(); }
  },
  finishLevel() {
    if (this.tutorial) { Save.data.tut = true; Save.write(); Sound.play('complete'); startLevel(0, true); return; }
    const total = this.stars.length, got = this.starCount;
    if (this.endless) { Save.data.edist = Math.max(Save.data.edist || 0, this.dist); Save.write(); this.result = { endless: true, got, total, combo: this.bestCombo, time: this.time, dist: this.dist, stars: [true, got >= total, this.bestCombo >= 10], best: Save.data.edist }; this.state = 'complete'; UI.showComplete(); return; }
    const stars = [true, got >= total, !!(this.bag && this.bag.taken)];
    const score = this.calcScore() + this.lives * 200 + Math.max(0, Math.round(((this.level.par || 150) - this.time) * 4)), rank = this.rankOf(score);
    const rec = Save.record(this.level.id, stars, this.time);
    { const L = Save.data.levels[this.level.id]; const rk = { S: 4, A: 3, B: 2, C: 1 }; if (!L.score || score > L.score) L.score = score; if (!L.rank || rk[rank] > rk[L.rank]) L.rank = rank; Save.write(); this.result = { score, rank, bestScore: L.score, bestRank: L.rank }; }
    Ach.unlock('p' + this.level.id); if (this.lives === 3) Ach.unlock('clean'); if (stars[1]) Ach.unlock('allstars');
    this.result = { ...this.result, stars, got, total, combo: this.bestCombo, time: this.time, best: Save.level(this.level.id).best, newBest: rec.newBest, bag: !!(this.bag && this.bag.taken) };
    Portal.track('level_complete', { level: this.level.id, time: Math.round(this.time), stars: stars.filter(Boolean).length, lives: this.lives, combo: this.bestCombo });
    this.state = 'complete'; UI.showComplete();
  },
});

function potteryBreak(q, byStomp) {
  if (!q.alive) return;
  q.alive = false; const cx = q.c * T + 32, cy = q.r * T + 36;
  G.smashes++; G.questStep('smash'); if (G.inkRush > 0) G.inkRush = Math.min(4.2, G.inkRush + .12); Ach.unlock('smash'); Sound.play('pot'); FX.shards(cx, cy, 12); FX.puff(cx, cy + 10, 3, 38); FX.shock(cx, cy, 50);
  G.impact(.04, .008, 1.5); G.bump(cx, cy - 10, ['CRACK!', 'SMASH!', 'CRASH!'][Math.floor(rnd(0, 3))]);
  if (q.starRef && !q.starRef.taken) { q.starRef.hidden = false; q.starRef.pop = .3; FX.sparkle(cx, cy, 5); }
}
