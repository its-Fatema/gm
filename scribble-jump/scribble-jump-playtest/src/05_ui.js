'use strict';
/* =========================== UI / STATE / LOOP ============================ */
const Trans = { active: false, t: 0, dur: .8 };
let vclock = 0, lastRestart = 0;
const SCREENS = ['title', 'select', 'pause', 'over', 'done', 'final', 'credits', 'skins', 'badges'];

const UI = {
  show(id) { if (id) $('stage').classList.remove('ingame'); for (const s of SCREENS) $(s).classList.toggle('on', s === id); if (id) { const b = $(id).querySelector('.btn.primary,.pg:not(.lock)'); if (b) setTimeout(() => b.focus({ preventScroll: true }), 30); } },
  hideAll() { for (const s of SCREENS) $(s).classList.remove('on'); },
  hud(on) { if (!on) $('b-skip').style.display = 'none'; $('hudbtns').classList.toggle('on', on); $('stage').classList.toggle('ingame', on); },
  syncToggles() {
    $('b-snd').classList.toggle('off', !(Sound.sfx || Sound.mus));
    $('p-snd').classList.toggle('off', !Sound.sfx); $('p-mus').classList.toggle('off', !Sound.mus);
    $('p-snd').textContent = 'SOUND ' + (Sound.sfx ? 'ON' : 'OFF'); $('p-mus').textContent = 'MUSIC ' + (Sound.mus ? 'ON' : 'OFF');
  },
  starImg(on) { return ico(on ? 'star:gold' : 'star', 34, on ? '' : 'off'); },

  showSkins() {
    const tot = Save.totalStars(); $('sk-sub').textContent = 'collect stars to unlock · ' + tot + ' ★ so far';
    $('sk-list').innerHTML = SKINS.map(([id, img, need]) => '<button class="sk' + (id === Save.data.skin ? ' sel' : '') + (tot < need ? ' lock' : '') + '" data-id="' + id + '">' + ico(img, 64) + '<span>' + id.toUpperCase() + '</span><small>' + (tot < need ? need + ' ★ to unlock' : id === Save.data.skin ? 'wearing' : 'tap to wear') + '</small></button>').join('');
    hydrate($('sk-list'));
    $('sk-list').querySelectorAll('.sk').forEach(b => b.onclick = () => { const k = SKINS.find(x => x[0] === b.dataset.id); if (Save.totalStars() < k[2]) return; Save.data.skin = k[0]; Save.write(); Sound.play('click'); UI.showSkins(); });
    this.show('skins');
  },
  showBadges() {
    const got = BADGES.filter(b => Save.data.ach[b[0]]).length; $('bd-sub').textContent = got + ' / ' + BADGES.length + ' collected';
    $('bd-list').innerHTML = BADGES.map(b => '<div class="bd ' + (Save.data.ach[b[0]] ? '' : 'off') + '"><span class="ck">' + (Save.data.ach[b[0]] ? '✓' : '') + '</span><div><b>' + b[1] + '</b><small>' + b[2] + '</small></div></div>').join('');
    this.show('badges');
  },
  showTitle() { G.state = 'title'; Trans.active = false; this.hud(false); this.show('title'); Sound.music(0); },
  showSelect() {
    G.state = 'select'; Trans.active = false; this.hud(false); Sound.music(0);
    const box = $('pages'); box.innerHTML = '';
    LEVELS.forEach((l, i) => {
      const locked = l.id > Save.data.unlocked, rec = Save.level(l.id), st = rec ? rec.stars : [false, false, false];
      const b = document.createElement('button'); b.className = 'pg' + (locked ? ' lock' : '');
      const thumbs = [['doorway_open:w', 'star:gold'], ['cannon_small:s', 'character_round_purple'], ['bridge_arch:s', 'sawblade:s'], ['tower:s', 'character_rectangle_green']][i];
      b.innerHTML = '<div class="num">PAGE ' + l.id + '</div><div class="nm">' + l.name + '</div><div class="th">' + thumbs.map(n => ico(n, 72)).join('') + '</div>' +
        '<div class="st">' + st.map(v => this.starImg(v)).join('') + '</div><div class="bt">' + (rec ? 'best ' + fmtTime(rec.best) + (rec.rank ? ' · ' + rec.rank : '') : locked ? 'locked' : 'not played') + '</div>' + (locked ? ico('lock', 52, 'lk') : '');
      hydrate(b);
      if (!locked) b.onclick = () => { Sound.play('click'); startLevel(i, true); };
      box.appendChild(b);
    });
    this.show('select');
  },
  showPause() { $('p-sub').textContent = 'PAGE ' + G.level.id + ' · ' + G.level.name; this.syncToggles(); this.show('pause'); },
  showGameOver() {
    Portal.gameplayStop(); Portal.gameOver(G.level.id);
    const l = G.level, rec = Save.level(l.id), bs = rec ? rec.stars.filter(Boolean).length : 0;
    $('o-endless').style.display = G.endless ? 'none' : '';
    if (G.endless) { Save.data.edist = Math.max(Save.data.edist || 0, G.dist); Save.write(); $('o-page').textContent = 'DOODLE DASH · ' + G.dist + ' m'; $('o-meta').innerHTML = '<span>★ ' + G.starCount + ' stars</span><span>best ' + Save.data.edist + ' m</span>'; $('o-revive').style.display = Portal.hasRewarded ? '' : 'none'; this.show('over'); return; }
    $('o-meta').innerHTML = '<span>★ ' + G.starCount + '/' + G.stars.length + ' this try</span><span>' + (rec ? 'best ' + bs + '/3 · ' + fmtTime(rec.best) : 'no best yet') + '</span>';
    $('o-revive').style.display = Portal.hasRewarded ? '' : 'none';
    this.show('over');
  },
  showComplete() {
    Portal.gameplayStop(); Portal.levelComplete(G.level.id, G.result.stars, G.result.time);
    const r = G.result, l = G.level, last = G.index === LEVELS.length - 1;
    $('d-replay').style.display = G.endless ? 'none' : ''; $('d-endless').style.display = G.endless ? 'none' : '';
    if (G.endless) { $('d-title').textContent = 'Dash complete!'; $('d-sub').textContent = r.dist + ' m · best ' + r.best + ' m'; $('d-stars').innerHTML = [['Reached the end', true], ['All stars  ' + r.got + '/' + r.total, r.stars[1]], ['Combo x10', r.stars[2]]].map((x, i) => '<div class="sr ' + (x[1] ? '' : 'off') + '" style="--d:' + (.25 + i * .35) + 's">' + ico(x[1] ? 'star:gold' : 'star', 38) + '<span>' + x[0] + '</span></div>').join(''); hydrate($('d-stars')); $('d-meta').innerHTML = '<span>⏱ ' + fmtTime(r.time) + '</span>' + (r.combo >= 3 ? '<span>combo x' + r.combo + '</span>' : ''); $('d-next').textContent = 'RUN AGAIN'; this.show('done'); setTimeout(() => Sound.play('star'), 250); return; }
    $('d-title').textContent = 'Page ' + l.id + ' complete!'; $('d-sub').textContent = l.name;
    const rows = [['Reached the exit', r.stars[0]], ['All stars  ' + r.got + '/' + r.total, r.stars[1]], [l.challenge, r.stars[2]]];
    $('d-stars').innerHTML = rows.map((x, i) => '<div class="sr ' + (x[1] ? '' : 'off') + '" style="--d:' + (.25 + i * .35) + 's">' + ico(x[1] ? 'star:gold' : 'star', 38) + '<span>' + x[0] + '</span></div>').join('');
    hydrate($('d-stars'));
    $('d-meta').innerHTML = '<span>⏱ ' + fmtTime(r.time) + '</span><span>best ' + fmtTime(r.best) + '</span>' + (r.combo >= 3 ? '<span>combo x' + r.combo + '</span>' : '') + (r.newBest ? '<span class="nb">new best!</span>' : '');
    $('d-next').textContent = last ? 'FINISH' : 'NEXT PAGE';
    { const rk = $('d-rank'); rk.textContent = r.rank; rk.className = 'stamp r' + r.rank; const need = Math.max(0, Math.ceil(G.rankMax * .62 - r.score));
      $('d-meta').innerHTML += '<span>score ' + r.score + '</span>'; const nx = SKINS.find(s => Save.totalStars() < s[2]);
      $('d-teaser').innerHTML = (r.rank !== 'S' ? 'S rank needs ~' + need + ' more points. ' : 'S RANK! ') + (nx ? '<br>' + (nx[2] - Save.totalStars()) + ' ★ to unlock the ' + nx[0].toUpperCase() + ' skin. ' : '') + (l.teaser && !last ? '<br><b>Next:</b> ' + l.teaser : ''); }
    this.show('done'); setTimeout(() => Sound.play('star'), 250);
  },
  showFinal() {
    G.state = 'final'; this.hud(false);
    const tot = Save.totalStars(), max = LEVELS.length * 3, ratio = tot / max;
    $('f-grade').textContent = ratio >= 1 ? 'A+' : ratio >= .75 ? 'A' : ratio >= .5 ? 'B' : 'C';
    $('f-sub').textContent = tot + ' / ' + max + ' stars · ' + LEVELS.filter(l => Save.level(l.id)).length + ' / ' + LEVELS.length + ' pages completed';
    $('f-rows').innerHTML = LEVELS.map(l => { const r = Save.level(l.id), st = r ? r.stars : [0, 0, 0]; return '<div class="row2"><span class="n">' + l.id + '. ' + l.name + '</span>' + st.map(v => ico(v ? 'star:gold' : 'star', 28, v ? '' : 'off')).join('') + '<span style="width:64px;text-align:right">' + (r ? fmtTime(r.best) : '--:--') + '</span></div>'; }).join('');
    hydrate($('f-rows')); this.show('final'); Sound.play('complete');
  },
};
/* UI icons are drawn onto small canvases (never converted to URLs), so they work from file://, http, and inlined builds alike */
const ico = (n, size, cls = '') => '<i class="ic ' + cls + '" data-n="' + n + '" data-s="' + size + '"></i>';
function hydrate(root) {
  root.querySelectorAll('.ic').forEach(el => {
    const n = el.dataset.n, s = +el.dataset.s, im = IM[n]; if (!im) { console.error('[Scribble Jump] missing UI icon: ' + n); return; }
    const cv = document.createElement('canvas'); cv.width = cv.height = s * 2; cv.style.width = cv.style.height = s + 'px'; cv.className = el.className;
    cv.getContext('2d').drawImage(im, 0, 0, s * 2, s * 2); el.replaceWith(cv);
  });
}

/* ------------------------------ flow control ----------------------------- */
function startEndless(flip) { startLevel(4, flip, buildEndless((Math.random() * 1e9) | 0)); }
function startLevel(i, flip, def) {
  Sound.resume();
  if (flip) { const s = R_.snap; s.width = R_.canvas.width; s.height = R_.canvas.height; s.getContext('2d').drawImage(R_.canvas, 0, 0); Trans.active = true; Trans.t = 0; Sound.play('page'); }
  UI.hideAll(); UI.hud(true); Portal.track('level_start', { level: (def || LEVELS[i]).id });
  G.load(i, def); G.state = 'intro'; G.introT = 0; G.winDone = false; G.reveal = 0; Input.reset(); Portal.gameplayStart();
  Sound.music(G.endless ? 1 : G.level.id); $('b-skip').style.display = G.tutorial ? '' : 'none';
}
function startTutorial(flip) { startLevel(99, flip, TUTORIAL); }
function restartLevel() {
  const now = performance.now(); if (now - lastRestart < 180) return; lastRestart = now;
  if (!G.level || ['title', 'select', 'loading', 'final', 'intro'].includes(G.state)) return;
  UI.hideAll(); UI.hud(true); Trans.active = false; Input.reset(); G.winDone = false; G.load(G.index, G.tutorial ? TUTORIAL : G.endless ? buildEndless((Math.random() * 1e9) | 0) : undefined); G.state = 'play'; G.reveal = 1; Portal.gameplayStart();
}
function pauseGame() { if (G.state !== 'play') return; G.prev = G.state; G.state = 'paused'; Input.reset(); Portal.gameplayStop(); UI.showPause(); }
function resumeGame() { if (G.state !== 'paused') return; UI.hideAll(); UI.hud(true); G.state = G.prev || 'play'; Input.reset(); Portal.gameplayStart(); }
const canFS = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
function toggleFS() {
  const d = document, el = d.documentElement;
  try {
    if (!d.fullscreenElement && !d.webkitFullscreenElement) { const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { }); }
    else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  } catch (e) { }
}
function setAudio(sfx, mus) { Sound.sfx = sfx; Sound.mus = mus; Save.data.sound = sfx; Save.data.music = mus; Save.write(); UI.syncToggles(); }

/* ------------------------------- title scene ----------------------------- */
function drawTitleScene(t) {
  const c = R_.ctx; c.setTransform(R_.scale, 0, 0, R_.scale, 0, 0);
  drawPaper('class', t * 25, 0, t); drawDoodles('class', t * 25, 0, t);
  c.strokeStyle = 'rgba(201,84,79,.55)'; inkLine(c, 70, 0, 70, VH, 2.2); inkLine(c, 77, 0, 77, VH, 1.6);
  c.fillStyle = 'rgba(60,50,40,.18)'; for (let y = 90; y < VH; y += 192) { c.beginPath(); c.arc(40, y, 10, 0, 6.3); c.fill(); }
  // ground row
  const gy = 404; c.fillStyle = 'rgba(70,50,30,.17)'; c.fillRect(6, gy + 7, VW, 64);
  for (let x = 0; x < VW; x += T) { IMG('block', x, gy); IMG('block:in', x, gy + 64); IMG('block:in', x, gy + 128); }
  c.fillStyle = R_.hatch; c.fillRect(0, gy + 68, VW, 190);
  // props
  IMG('cactus:g', 760, gy - 63); drawShadowBlob(792, gy - 1, 24, .2);
  IMG('pottery:t', 640, gy - 63); drawShadowBlob(672, gy - 1, 22, .18);
  IMG('doorway_open:w', 880, gy - 63); glow(912, gy - 30, 90, 'rgba(255,214,110,A)', .5);
  IMG('pottery_tall:t', 150, gy - 63); drawShadowBlob(182, gy - 1, 22, .18);
  IMG('plank:w', 330, gy - 170); IMG('plank:w', 394, gy - 170);
  for (const [sx, sy] of [[362, gy - 215], [520, gy - 125], [820, gy - 150]]) { const b = Math.sin(t * 3 + sx) * 4; glow(sx, sy + b, 40, 'rgba(255,200,60,A)', .35); IMG('star:gold', sx - 25, sy - 25 + b, 50); }
  // hopping hero
  const cyc = (t % 2.6) / 2.6, hop = cyc < .3 ? Math.sin(cyc / .3 * Math.PI) * 90 : 0, hx = 250 + (cyc < .3 ? (cyc / .3) * 70 : 70) + Math.floor(t / 2.6) % 2 * 0;
  const sq = cyc < .3 ? 1.12 : 1 + Math.sin(t * 3) * .02, sy2 = cyc < .3 ? .92 : 1 - Math.sin(t * 3) * .02;
  drawShadowBlob(hx, gy - 1, 24 - hop * .1, .22);
  c.save(); c.translate(hx, gy - hop + 2); c.scale(sy2, sq); IMG('character_round_red', -32, -64, 64); c.restore();
  const eh = 650 + Math.sin(t * 1.2) * 40; c.save(); c.translate(eh + 130, gy + 2); IMG('character_round_purple', -29, -58, 58); c.restore();
  // logo
  const word = 'Scribble Jump', cols = [COLORS.red, COLORS.yellow, COLORS.green, COLORS.purple]; let x = 512; c.font = '700 96px ' + FONT;
  const widths = [...word].map(ch => c.measureText(ch).width + 2), tw = widths.reduce((a, b) => a + b, 0); x = 512 - tw / 2;
  [...word].forEach((ch, i) => {
    const w = widths[i], by = Math.sin(t * 2.4 + i * .6) * 4, rot = Math.sin(i * 1.7) * .07;
    if (ch !== ' ') { c.save(); c.translate(x + w / 2, 168 + by); c.rotate(rot); c.font = '700 96px ' + FONT; c.textAlign = 'center'; c.lineJoin = 'round'; c.lineWidth = 16; c.strokeStyle = COLORS.ink; c.strokeText(ch, 4, 5); c.lineWidth = 12; c.strokeStyle = '#fffdf4'; c.strokeText(ch, 0, 0); c.fillStyle = cols[i % 4]; c.fillText(ch, 0, 0); c.restore(); }
    x += w;
  });
}

/* ---------------------------- level intro + page turn --------------------- */
function drawIntro() {
  const c = R_.ctx, t = G.introT - .5; if (t < 0) return;
  const a = clamp(Math.min(t / .25, (1.55 - t) / .3), 0, 1); if (a <= 0) return;
  c.globalAlpha = a; c.setTransform(R_.scale, 0, 0, R_.scale, 0, 0);
  const y = 190 + (1 - ease.out(clamp(t / .3, 0, 1))) * 14;
  c.fillStyle = 'rgba(255,196,46,.55)'; c.save(); c.translate(512, y - 6); c.rotate(-.012); c.fillRect(-330, -34, 660, 108); c.restore();
  txt('PAGE ' + G.level.id, 512, y - 6, 26, { align: 'center', color: COLORS.margin, ow: 0, out: false });
  txt(G.level.name, 512, y + 44, G.level.name.length > 20 ? 46 : 58, { align: 'center', ow: 0, out: false });
  const u = ease.out(clamp(t / .5, 0, 1)); c.strokeStyle = COLORS.margin; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(512 - 270, y + 62); c.quadraticCurveTo(512, y + 70, 512 - 270 + 540 * u, y + 58); c.stroke();
  c.globalAlpha = 1;
}
function drawPageTurn() {
  const c = R_.ctx, u = ease.inOut(clamp(Trans.t / Trans.dur, 0, 1)); c.setTransform(R_.scale, 0, 0, R_.scale, 0, 0);
  const w = VW * (1 - u);
  // shadow cast on the page underneath
  const sh = c.createLinearGradient(w, 0, w + 90, 0); sh.addColorStop(0, 'rgba(40,30,20,' + (.35 * Math.sin(u * Math.PI)) + ')'); sh.addColorStop(1, 'rgba(40,30,20,0)'); c.fillStyle = sh; c.fillRect(w, 0, 90, VH);
  if (w > 1) {
    c.drawImage(R_.snap, 0, 0, R_.snap.width, R_.snap.height, 0, 0, w, VH);
    const g = c.createLinearGradient(Math.max(0, w - 120), 0, w, 0); g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(1, 'rgba(60,40,20,' + (.3 * u + .12) + ')'); c.fillStyle = g; c.fillRect(Math.max(0, w - 120), 0, Math.min(120, w), VH);
    c.fillStyle = 'rgba(43,43,51,.8)'; c.fillRect(w - 2, 0, 2, VH);
  }
}

/* --------------------------------- input -------------------------------- */
function setupInput() {
  const gameKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyX', 'KeyJ', 'KeyK']);
  window.addEventListener('keydown', e => {
    Sound.resume();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const code = e.code, st = G.state;
    if (code === 'Escape' || code === 'KeyP') { if (st === 'play') pauseGame(); else if (st === 'paused') resumeGame(); e.preventDefault(); return; }
    if (code === 'KeyM' && !e.repeat) { const on = !(Sound.sfx || Sound.mus); setAudio(on, on); return; }
    if (code === 'KeyF' && !e.repeat && st !== 'loading') { toggleFS(); return; }
    if (code === 'KeyR') { if (['play', 'dying', 'paused', 'gameover'].includes(st)) { e.preventDefault(); if (!e.repeat) restartLevel(); } return; }
    if (st === 'intro' && !e.repeat && G.introT > .3 && (gameKeys.has(code) || code === 'Enter')) { G.state = 'play'; Trans.active = false; }
    if (['play', 'dying', 'intro', 'win'].includes(st) && gameKeys.has(code)) {
      e.preventDefault();
      if (!Input.keys.has(code)) { if (['ArrowUp', 'KeyW', 'Space'].includes(code)) Input.jumpEdge = true; if (['KeyX', 'KeyJ', 'KeyK'].includes(code)) Input.attackEdge = true; }
      Input.keys.add(code);
    }
  });
  window.addEventListener('keyup', e => { Input.keys.delete(e.code); });
  window.addEventListener('blur', () => { Input.reset(); if (G.state === 'play') pauseGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { Input.reset(); if (G.state === 'play') pauseGame(); } });
  $('stage').addEventListener('pointerdown', () => { Sound.resume(); if (G.state === 'intro' && G.introT > .3) { G.state = 'play'; Trans.active = false; } });
  // touch controls: one sliding d-pad (left/right halves) + jump + slash
  const pad = $('tpad'), setPad = (x, on) => { const r = pad.getBoundingClientRect(), u = (x - r.left) / r.width; Input.tLeft = on && u < .5; Input.tRight = on && u >= .5; pad.classList.toggle('l', Input.tLeft); pad.classList.toggle('r', Input.tRight); };
  pad.addEventListener('pointerdown', e => { e.preventDefault(); pad.setPointerCapture(e.pointerId); Sound.resume(); setPad(e.clientX, true); if (G.state === 'intro' && G.introT > .3) { G.state = 'play'; Trans.active = false; } });
  pad.addEventListener('pointermove', e => { if (e.buttons || e.pressure) setPad(e.clientX, true); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => pad.addEventListener(n, () => setPad(0, false)));
  const hold = (id, key) => { const el = $(id);
    const on = e => { e.preventDefault(); Input[key] = true; el.classList.add('d'); if (key === 'tJump') Input.jumpEdge = true; if (key === 'tAttack') Input.attackEdge = true; Sound.resume(); if (G.state === 'intro' && G.introT > .3) { G.state = 'play'; Trans.active = false; } };
    const off = e => { e.preventDefault(); Input[key] = false; el.classList.remove('d'); };
    el.addEventListener('pointerdown', on); ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => el.addEventListener(n, off)); };
  hold('tj', 'tJump'); hold('ta', 'tAttack');
  const addTouch = () => { $('stage').classList.add('touch'); R_.touch = true; };
  window.addEventListener('touchstart', addTouch, { once: true, passive: true });
  window.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') addTouch(); }, { passive: true });
  if (DEVICE.touch) addTouch();
  const orient = () => { const portrait = (DEVICE.phone || (IS_COARSE && DEVICE.smin <= 600)) && window.innerHeight > window.innerWidth * 1.05; document.body.classList.toggle('portrait', portrait); if (portrait && G.state === 'play') pauseGame(); };
  window.addEventListener('resize', orient); orient();
  document.addEventListener('contextmenu', e => e.preventDefault());
}

function setupButtons() {
  const clickSfx = () => { Sound.resume(); Sound.play('click'); };
  document.querySelectorAll('.btn,.ib').forEach(b => b.addEventListener('click', clickSfx));
  $('t-how').onclick = () => startTutorial(true);
  $('b-skip').onclick = () => { Save.data.tut = true; Save.write(); startLevel(0, true); };
  $('t-play').onclick = () => { let i = 0; for (const l of LEVELS) if (l.id <= Save.data.unlocked && !Save.level(l.id)) { i = l.id - 1; break; } startLevel(i, true); };
  $('t-pages').onclick = () => UI.showSelect(); $('t-endless').onclick = () => startEndless(true); $('d-endless').onclick = () => startEndless(true);
  $('t-fs').onclick = toggleFS; $('b-fs').onclick = toggleFS;
  $('t-credits').onclick = () => UI.show('credits'); $('c-back').onclick = () => UI.show('title');
  $('t-skins').onclick = () => UI.showSkins(); $('t-badges').onclick = () => UI.showBadges(); $('sk-back').onclick = () => UI.show('title'); $('bd-back').onclick = () => UI.show('title');
  $('o-revive').onclick = () => Portal.rewarded(ok => { if (ok) { UI.hideAll(); UI.hud(true); G.lives = 1; G.respawn(); Portal.gameplayStart(); } });
  $('s-back').onclick = () => UI.showTitle();
  $('b-pause').onclick = () => { if (G.state === 'play') pauseGame(); else if (G.state === 'paused') resumeGame(); };
  $('b-snd').onclick = () => { const on = !(Sound.sfx || Sound.mus); setAudio(on, on); };
  $('p-resume').onclick = resumeGame; $('p-restart').onclick = () => { restartLevel(); };
  $('p-quit').onclick = () => UI.showSelect();
  $('p-snd').onclick = () => setAudio(!Sound.sfx, Sound.mus); $('p-mus').onclick = () => setAudio(Sound.sfx, !Sound.mus);
  $('o-endless').onclick = () => startEndless(true);
  $('o-retry').onclick = () => { lastRestart = 0; restartLevel(); };
  $('o-pages').onclick = () => UI.showSelect();
  $('d-replay').onclick = () => startLevel(G.index, true);
  $('d-pages').onclick = () => UI.showSelect();
  $('d-next').onclick = () => { if (G.endless) return startEndless(true); if (G.index >= LEVELS.length - 1) UI.showFinal(); else startLevel(G.index + 1, true); };
  $('f-again').onclick = () => startLevel(0, true);
  $('f-pages').onclick = () => UI.showSelect();
}

/* ---------------------------------- loop -------------------------------- */
let acc = 0, lastT = 0, swordShown = false, hintShown = false;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - lastT) / 1000; lastT = now; if (!(dt > 0)) dt = 0; dt = Math.min(dt, .1);
  vclock += dt; Input.sync(); if (['play', 'dying', 'intro'].includes(G.state)) Quality.sample(dt);
  const st = G.state;
  if (['play', 'dying', 'win', 'intro'].includes(st)) {
    if (st === 'intro') { G.introT += dt; G.reveal = clamp((G.introT - .35) / .85, 0, 1); if (Trans.active) { Trans.t += dt; if (Trans.t >= Trans.dur) Trans.active = false; } if (G.introT > 1.75) { G.state = 'play'; Trans.active = false; G.reveal = 1; } }
    acc += dt; let n = 0;
    try { while (acc >= DT && n < 14) { G.update(DT); acc -= DT; n++; } } catch (e) { logErr(e); acc = 0; }
    if (n >= 14) acc = 0;
  } else acc = 0;
  { const want = !!(G.hint && G.sword); if (want !== hintShown) { hintShown = want; $('ta').classList.toggle('hint', want); } }
  if (G.sword !== swordShown) { swordShown = G.sword && !!G.level; $('ta').classList.toggle('on', swordShown); }
  try { render(vclock); } catch (e) { logErr(e); }
}
let lastErr = 0;
function logErr(e) { const t = performance.now(); if (t - lastErr > 2000) { lastErr = t; console.error('[Scribble Jump] runtime error:', e); } }
function render(t) {
  const st = G.state;
  if (st === 'title') drawTitleScene(t);
  else if (st === 'select' || st === 'final') { const c = R_.ctx; c.setTransform(R_.scale, 0, 0, R_.scale, 0, 0); drawPaper('class', t * 18, 0, t); drawDoodles('class', t * 18, 0, t); drawMargin(-30, 0); drawPaperFinish('class'); }
  else if (G.world && st !== 'loading') {
    drawScene(G.clock + vclock * 0);
    if (st === 'intro') drawIntro();
    if (Trans.active) drawPageTurn();
  }
}

/* ---------------------------------- boot -------------------------------- */
function boot() {
  Portal.init(); Portal.loadingStart(); Save.load(); Sound.sfx = Save.data.sound !== false; Sound.mus = Save.data.music !== false;
  initRender(); window.addEventListener('resize', resize); document.addEventListener('fullscreenchange', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  let loaded = 0; const total = ASSET_NAMES.length;
  loadAssets(() => { loaded++; $('lbar').style.width = Math.round(loaded / total * 100) + '%'; }).then(() => {
    setupInput(); setupButtons(); UI.syncToggles();
    if (!canFS) { $('b-fs').style.display = 'none'; $('t-fs').style.display = 'none'; }
    if (DEVICE.touch) document.querySelectorAll('.desk').forEach(e => e.style.display = 'none');
    $('loading').style.display = 'none'; Portal.loadingDone();
    UI.showTitle();
  });
  requestAnimationFrame(t => { lastT = t; frame(t); });
}
window.addEventListener('DOMContentLoaded', boot);
/*DEV*/
window.__SJ = { Quality, G, Cam, Input, startLevel, LEVELS, FX, Sound, Save, UI, TILES };
window.TILES = TILES; window.Quality = Quality; window.BADGES = BADGES;
/*ENDDEV*/
