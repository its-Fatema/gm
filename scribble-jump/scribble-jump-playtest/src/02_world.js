'use strict';
/* ============================ WORLD + PHYSICS ============================= */
const TILES = {
  '#': { img: 'block', solid: 1 },
  '=': { img: 'plank:w', one: 1, top: 16, th: 14 },
  '~': { img: 'bridge_walkway:s', one: 1, top: 1, th: 14 },
  'A': { img: 'bridge_arch:s', one: 1, top: 1, th: 14 },
  'P': { img: 'bridge_arch_large:s', deco: 1 },
  'I': { img: 'bridge_column:s', deco: 1 },
  'C': { img: 'castle:s', solid: 1, top: 0 },
  'c': { img: 'castle_top:s', solid: 1, top: 34 },
  'w': { img: 'window:s', solid: 1 },
  'x': { img: 'window_decorative:s', solid: 1 },
  'U': { img: 'tower:s', solid: 1, ix: 10 },
  'B': { img: 'tower_base:s', solid: 1 },
  'O': { img: 'tower_overhang:s', solid: 1, top: 29 },
  'G': { img: 'block_glass:t', solid: 1, bounce: 1 },
  'X': { img: 'bridge_arch:x', one: 1, top: 1, th: 14, crumble: 1 },
  'n': { img: 'window:bg', deco: 1 }, 'm': { img: 'window_decorative:bg', deco: 1 }, 'b': { img: 'block:bg', deco: 1 },
};
/* ----- player physics constants (levels are designed around these) ----- */
const PH = {
  W: 38, H: 52, MAXV: 262, ACC_G: 2300, ACC_A: 1500, FRIC_G: 2600, FRIC_A: 520, TURN: 1.7,
  G_UP: 2100, G_DOWN: 2650, VMAX: 1050, JV: 790, COYOTE: .1, BUF: .13, STEP: 14,
  BOUNCE: 560, BOUNCE_HI: 800, BOUNCE_TALL: 960,
};
const DT = 1 / 120;

class World {
  constructor(def) {
    this.def = def; this.w = def.w; this.h = def.h; this.px = def.w * T; this.py = def.h * T;
    this.grid = new Array(this.w * this.h).fill('');
    for (const [t, c, r, w, h] of def.terrain) for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) {
      if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.grid[y * this.w + x] = t;
    }
    this.orig = this.grid.slice();
    this.extra = [];            // static boxes (cannons)
    this.killY = this.py + 220;
  }
  at(c, r) { return (c < 0 || c >= this.w || r < 0 || r >= this.h) ? '' : this.grid[r * this.w + c]; }
  box(c, r, t) {
    const d = TILES[t]; const ix = d.ix || 0, top = d.top || 0;
    return { x0: c * T + ix, x1: (c + 1) * T - ix, y0: r * T + top, y1: d.one ? r * T + top + d.th : (r + 1) * T, one: !!d.one, bounce: !!d.bounce, c, r };
  }
  /* collect solid boxes overlapping a rect */
  query(x0, y0, x1, y1, out, dyn) {
    out.length = 0;
    const c0 = Math.floor(x0 / T), c1 = Math.floor(x1 / T), r0 = Math.floor(y0 / T), r1 = Math.floor(y1 / T);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const t = this.at(c, r); if (!t) continue; const d = TILES[t]; if (d.deco) continue;
      out.push(this.box(c, r, t));
    }
    for (const b of this.extra) if (b.x1 > x0 && b.x0 < x1 && b.y1 > y0 && b.y0 < y1) out.push(b);
    if (dyn) for (const p of dyn) if (p.alive && p.box.x1 > x0 && p.box.x0 < x1 && p.box.y1 > y0 && p.box.y0 < y1) out.push(p.box);
    return out;
  }
  floorY(c, r) { const t = this.at(c, r + 1); return (r + 1) * T + ((t && TILES[t].top) || 0); }
  solidAt(x, y) { const t = this.at(Math.floor(x / T), Math.floor(y / T)); if (!t || TILES[t].deco) return false; const b = this.box(Math.floor(x / T), Math.floor(y / T), t); return !b.one && x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1; }
}

/* ---------------------------- particles / fx ----------------------------- */
const FX = {
  list: [], max: 170,
  add(o) { if (this.list.length >= this.max) this.list.shift(); this.list.push(o); return o; },
  clear() { this.list.length = 0; },
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i]; p.age += dt;
      if (p.age >= p.life) { L.splice(i, 1); continue; }
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt;
      if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
    }
  },
  puff(x, y, n = 3, size = 40, spread = 60) {
    for (let i = 0; i < n; i++) this.add({ t: 'puff', x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: rnd(-spread, spread), vy: rnd(-spread, spread * .3) - 20, size: size * rnd(.7, 1.1), age: 0, life: rnd(.35, .55), rot: rnd(0, 6), vr: rnd(-2, 2), drag: 3 });
  },
  dust(x, y, dir = 0, n = 5) {
    for (let i = 0; i < n; i++) this.add({ t: 'dust', x: x + rnd(-10, 10), y, vx: (dir ? -dir * rnd(20, 90) : rnd(-90, 90)), vy: rnd(-70, -15), g: 160, size: rnd(3, 6), age: 0, life: rnd(.25, .42), rot: 0 });
  },
  sparkle(x, y, n = 6) {
    for (let i = 0; i < n; i++) { const a = rnd(0, 6.28), s = rnd(80, 190); this.add({ t: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, g: 260, size: rnd(14, 22), age: 0, life: rnd(.35, .6), rot: rnd(0, 6), vr: rnd(-8, 8), drag: 2 }); }
  },
  shards(x, y, n = 9, col = '#f2b697') {
    for (let i = 0; i < n; i++) this.add({ t: 'shard', x: x + rnd(-14, 14), y: y + rnd(-18, 10), vx: rnd(-170, 170), vy: rnd(-380, -90), g: 1300, size: rnd(7, 13), age: 0, life: rnd(.55, .85), rot: rnd(0, 6), vr: rnd(-12, 12), col });
  },
  burst(x, y, n = 9, len = 26, col = COLORS.ink, life = .3) {
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rnd(-.2, .2); this.add({ t: 'line', x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, a, size: len * rnd(.7, 1.2), age: 0, life, rot: 0, col }); }
  },
  ring(x, y, r = 50, col = COLORS.ink, life = .35) { this.add({ t: 'ring', x, y, size: r, age: 0, life, vx: 0, vy: 0, rot: 0, col }); },
  text(x, y, s, col = COLORS.ink, size = 20, life = .9) { this.add({ t: 'text', x, y, vx: rnd(-14, 14), vy: -60, s, age: 0, life, size, rot: rnd(-.18, .18), col }); },
  conf(x, y) { this.add({ t: 'conf', x, y, vx: rnd(-60, 60), vy: rnd(40, 120), g: 40, size: rnd(6, 11), age: 0, life: rnd(1.6, 2.6), rot: rnd(0, 6), vr: rnd(-6, 6), col: [COLORS.red, COLORS.yellow, COLORS.green, COLORS.purple][Math.floor(rnd(0, 4))] }); },
  sprite(img, x, y, vx, vy, size, life = .9) { this.add({ t: 'sprite', img, x, y, vx, vy, g: 1500, size, age: 0, life, rot: 0, vr: rnd(-9, 9) }); },
  shock(x, y, r = 60) { this.add({ t: 'shock', x, y, size: r, age: 0, life: .28, vx: 0, vy: 0, rot: 0 }); },
};

/* ------------------------------ camera ----------------------------------- */
const Cam = {
  x: 0, y: 0, shake: 0, sx: 0, sy: 0, kick: 0,
  snap(G) { const t = this.target(G); this.x = t.x; this.y = t.y; },
  target(G) {
    const p = G.player, w = G.world;
    let la = p.facing * 150, dy = 0;
    for (const z of (w.def.cam || [])) if (p.x / T >= z[0] && p.x / T <= z[1]) { la = z[2]; dy = z[3] || 0; }
    const lookDown = p.vy > 450 ? Math.min(140, (p.vy - 450) * .35) : 0;
    let tx = p.x + p.w / 2 + la - VW / 2;
    let ty = p.y + p.h - VH * .66 + dy + lookDown;
    return { x: clamp(tx, 0, Math.max(0, w.px - VW)), y: clamp(ty, 0, Math.max(0, w.py - VH)) };
  },
  update(G, dt) {
    const t = this.target(G), k = 1 - Math.pow(.0009, dt);
    this.x += (t.x - this.x) * k * .9; this.y += (t.y - this.y) * (1 - Math.pow(.004, dt));
    this.x = clamp(this.x, 0, Math.max(0, G.world.px - VW)); this.y = clamp(this.y, 0, Math.max(0, G.world.py - VH));
    this.shake = Math.max(0, this.shake - dt * 28); this.kick = Math.max(0, this.kick - dt * .22);
    this.sx = this.shake ? rnd(-1, 1) * this.shake : 0; this.sy = this.shake ? rnd(-1, 1) * this.shake : 0;
  },
};

/* ------------------------------- GAME ------------------------------------ */
const G = {
  state: 'loading', prev: null, level: null, world: null, player: null,
  lives: 3, time: 0, sword: false, stars: [], bag: null, starCount: 0, pulse: 0, lifeShake: 0,
  pottery: [], cacti: [], saws: [], cannons: [], bullets: [], enemies: [], items: [], cps: [], door: null,
  cp: null, clock: 0, deathT: 0, death: null, introT: 0, winT: 0, killedGuards: 0, toast: null,
  hudStarFlash: 0, hitstop: 0, ink: 0, inkRush: 0, quest: null, questFlash: 0, banner: null, sec: null, secLives: 3, secSeen: new Set(), secBonus: new Set(), mile: new Set(), tut: null, tutorial: false, inten: 1, pads: new Map(), movers: [], rains: [], rainDone: new Set(), potsSmashed: 0, bonusScore: 0, hint: null, nearT: 0, swordT: 0, swungRun: false, seenKind: {}, pingT: 0, arenas: [], arenaDone: new Set(), kills: 0, smashes: 0, cuts: 0, endless: false, theme: null, dist: 0, crumble: new Map(), chase: { active: false, x: 0, done: new Set() }, dyn: [], drapes: [], cutGates: new Set(), combo: 0, comboT: 0, bestCombo: 0, fly: [], flash: 0, reveal: 1, trail: [], trailT: 0, stepT: 0, intro1: false,

  /* ------- (re)build everything for a level ------- */
  load(index, override) {
    const def = override || LEVELS[index]; this.index = index; this.level = def; this.world = new World(def); this.endless = !!def.endless; this.tutorial = !!def.tutorial; this.tut = this.tutorial ? { i: 0, done: [], flash: 0 } : null; this.banner = null; this.sec = null; this.secLives = 3; this.secSeen = new Set(); this.secBonus = new Set(); this.mile = new Set(); this.inten = 1; Sound.intensity && Sound.intensity(1); this.pads = new Map(); this.rainDone = new Set(); this.bonusScore = 0; this.swungRun = false; this.swordT = 0; this.nearT = 0; this.hint = null; this.seenKind = {}; this.theme = def.theme; this.themeIdx = 0; this.dist = 0; this.crumble = new Map(); this.chase = { active: false, x: 0, done: new Set() }; this.bossHint = false;
    this.lives = 3; this.time = 0; if (def.id > 1 && !Save.data.sword) { Save.data.sword = true; Save.write(); }
    this.sword = !!Save.data.sword && !def.tutorial; this.ink = 0; this.inkRush = 0; this.questFlash = 0; this.quest = null; this.cp = null; this.combo = 0; this.comboT = 0; this.bestCombo = 0; this.fly = []; this.hitstop = 0; this.flash = 0; this.trail = []; this.clock = 0; this.killedGuards = 0;
    this.stars = def.stars.map(([c, r]) => ({ c, r, x: c * T + 32, y: r * T + 32, taken: false, hidden: false, ph: Math.random() * 6, pop: 0 }));
    this.bag = def.bags.length ? { c: def.bags[0][0], r: def.bags[0][1], x: def.bags[0][0] * T + 32, y: def.bags[0][1] * T + 32, taken: false, ph: 1 } : null;
    this.potStars = {};
    def.pottery.forEach(([c, r, f], i) => { if ((f || '').includes('s')) { const st = { c, r, x: c * T + 32, y: r * T + 30, taken: false, hidden: true, ph: 0, pop: 0 }; this.stars.push(st); this.potStars[i] = st; } });
    // One optional page objective gives the player a concrete reason to explore and engage.
    if (!this.endless && !def.tutorial) {
      const candidates = [];
      if (this.stars.length >= 3) candidates.push({ type: 'stars', label: 'Collect stars', target: Math.min(5, this.stars.length) });
      if (def.pottery.length >= 4) candidates.push({ type: 'smash', label: 'Smash pottery', target: Math.min(6, def.pottery.length) });
      const enemyCount = def.enemies.length + (def.arenas || []).reduce((n, a) => n + (a.waves || []).reduce((m, w) => m + w.length, 0), 0);
      if (enemyCount >= 3) candidates.push({ type: 'kills', label: 'Defeat enemies', target: Math.min(4, enemyCount) });
      if ((def.gates || []).length >= 1) candidates.push({ type: 'cuts', label: 'Cut curtain gates', target: Math.min(2, def.gates.length) });
      if (candidates.length) { const q = candidates[((Math.max(1, def.id || 1) - 1) % candidates.length)]; this.quest = { ...q, progress: 0, done: false }; }
    }
    this.rankMax = def.stars.length * 100 + (def.enemies.length + (def.arenas || []).reduce((n, a) => n + a.waves.reduce((m, x) => m + x.length, 0), 0)) * 60 + def.pottery.length * 15 + (def.gates || []).length * 50 + 600 + (def.bags.length ? 300 : 0) + 600 + (def.par || 150) * 2;
    this.starCount = 0; this.hudStarFlash = 0;
    this.cacti = def.cacti.map(([c, r]) => ({ c, r, box: { x0: c * T + 14, x1: c * T + 50, y0: r * T + 12, y1: (r + 1) * T } }));
    this.saws = (def.saws || []).map(s => { const o = { ...s, rot: rnd(0, 6) }; [o.x, o.y] = sawPos(o, 0); return o; });
    this.world.extra.length = 0;
    this.cannons = def.cannons.map(c => {
      const o = { ...c, t: c.phase || 0, flash: 0, fireDelay: 0, active: false };
      o.x = c.c * T; o.y = c.r * T;
      if (c.size === 'small') this.world.extra.push({ x0: o.x + 4, x1: o.x + 60, y0: o.y + 18, y1: o.y + 64, one: false });
      else {
        this.world.extra.push({ x0: o.x + 4, x1: o.x + 60, y0: o.y + 21, y1: o.y + 81, one: false });
        this.world.extra.push({ x0: o.x + 8, x1: o.x + 56, y0: o.y + 81, y1: o.y + 128, one: false });
      }
      o.ang = c.dir < 0 ? Math.PI : 0; o.burstLeft = 0; o.burstT = 0;
      o.my = c.size === 'small' ? o.y + 42 : o.y + 49;           // muzzle height
      o.mx = c.dir < 0 ? o.x : o.x + T;
      return o;
    });
    this.bullets = []; this.cutGates = new Set(); this.arenaDone = new Set(); this.kills = 0; this.smashes = 0; this.cuts = 0;
    this.items = def.items.map(i => ({ ...i, x: i.c * T + 32, y: i.r * T + 32, taken: false, ph: Math.random() * 6 }));
    this.cps = def.checkpoints.map(([c, r]) => ({ c, r, x: c * T + 32, y: this.world.floorY(c, r), on: false, t: 0 }));
    this.door = { c: def.exit[0], r: def.exit[1], open: 0, opened: false, y: this.world.floorY(def.exit[0], def.exit[1]) - T };
    this.spawn = { x: def.spawn[0] * T + 32, y: this.world.floorY(def.spawn[0], def.spawn[1]) };
    this.resetDynamic(true);
    this.spawnPlayer(this.spawn.x, this.spawn.y);
    Cam.snap(this); FX.clear(); Cam.shake = 0;
    this.state = 'play';
  },

  placeMover(m, clock) {
    const u = .5 - .5 * Math.cos(6.2832 * (clock / m.per + (m.ph || 0))), off = u * m.rng * T, px = m.x, py = m.y;
    m.x = m.c * T + (m.ax === 'x' ? off : 0); m.y = m.r * T + (m.ax === 'y' ? off : 0); m.dx = px === undefined ? 0 : m.x - px; m.dy = py === undefined ? 0 : m.y - py;
    m.box.x0 = m.x + 2; m.box.x1 = m.x + m.w * T - 2; m.box.y0 = m.y + 16; m.box.y1 = m.y + 30;
  },
  buildEnemy(e) {
    const g = e.k === 'green', bo = e.boss;
    return { ...e, x: e.c * T + 32, base: this.world.floorY(e.c, e.r), dir: Math.random() < .5 ? -1 : 1, w: bo ? (g ? 84 : 100) : g ? 48 : e.k === 'flyer' ? 40 : 44, h: bo ? (g ? 124 : 96) : g ? 68 : e.k === 'flyer' ? 62 : 46, hp: e.hp || (g ? 2 : 1), maxhp: e.hp || 1, slam: 0, slamT: 2.2, alive: true, sq: 0, stun: 0, flash: 0, hopT: rnd(0, 1.2), hopY: 0, walk: 0, spawnT: 0, dropping: false,
      spd: e.speed || (g ? (e.chase ? 56 : 42) : (e.chase ? 104 : 66)), minX: e.min * T + 28, maxX: (e.max + 1) * T - 28, dead: 0 };
  },
  /* enemies, pottery, bullets, cannon timers, pickups-of-powerups reset (on load and on every respawn) */
  resetDynamic(full) {
    const def = this.level;
    this.pottery = def.pottery.map(([c, r, f], i) => {
      const tall = (f || '').includes('t');
      const o = { c, r, tall, alive: true, sq: 0, starRef: this.potStars[i] || null, box: { x0: c * T + 12, x1: c * T + 52, y0: r * T + (tall ? 2 : 8), y1: (r + 1) * T }, bounce: tall ? PH.BOUNCE_TALL : PH.BOUNCE };
      o.box.pot = o;
      if (o.starRef && !o.starRef.taken) o.starRef.hidden = true;
      return o;
    });
    this.enemies = def.enemies.map(e => this.buildEnemy(e));
    this.arenas = (def.arenas || []).map((a, i) => ({ ...a, i, state: 0, wave: 0, t: 0, spawned: false, list: [], gates: [], done: this.arenaDone.has(i) }));
    this.drapes = (def.gates || []).map(([c, r, h], i) => ({ c, r, h, i, alive: !this.cutGates.has(i), sway: rnd(0, 6), cut: 0, box: { x0: c * T + 10, x1: c * T + 54, y0: r * T, y1: (r + h) * T } }));
    for (const g of (def.tutGates || [])) this.drapes.push({ c: g.c, r: 4, h: 3, i: -1, lock: true, tut: g.step, alive: !(this.tut && this.tut.done.includes(g.step)), sway: rnd(0, 6), cut: 0, box: { x0: g.c * T + 10, x1: g.c * T + 54, y0: 4 * T, y1: 7 * T } });
    this.movers = (def.movers || []).map(m => { const o = { ...m, alive: true, dx: 0, dy: 0, box: { x0: 0, x1: 0, y0: 0, y1: 0, one: true, mover: true } }; this.placeMover(o, 0); o.dx = o.dy = 0; return o; });
    this.rains = (def.rain || []).map((r, i) => ({ ...r, i, state: 0, t: 0, pots: [], done: this.rainDone.has(i) }));
    this.dyn = this.pottery.concat(this.drapes, this.movers);
    if (!full) { this.world.grid = this.world.orig.slice(); this.crumble = new Map(); this.chase = { active: false, x: 0, done: new Set() }; }
    this.bullets = [];
    for (const c of this.cannons) { c.t = c.phase || 0; c.flash = 0; c.fireDelay = 0; c.warned = false; }
    for (const it of this.items) it.taken = (it.k === 'sword' && this.sword);
    this.door.open = 0; this.door.opened = false;
  },

  spawnPlayer(x, bottom) {
    const old = this.player;
    this.player = {
      x: x - PH.W / 2, y: bottom - PH.H, w: PH.W, h: PH.H, vx: 0, vy: 0, onGround: true, wasGround: true, coyote: 0, buf: 0, facing: 1,
      scx: 1, scy: 1, inv: 0, shield: false, jumping: false, cut: false, walkT: 0, atk: 0, atkCd: 0, atkHit: null, hide: 0, popIn: 0, lean: 0, blink: 0, win: false,
    };
    if (old && this.sword) this.player.sword = true;
    this.player.sword = this.sword;
  },
};

/* --------------------------- player simulation --------------------------- */
const _q = [];
function playerMoveX(p, dx) {
  const W = G.world;
  p.x += dx;
  if (p.x < 0) { p.x = 0; p.vx = 0; }
  if (p.x + p.w > W.px) { p.x = W.px - p.w; p.vx = 0; }
  for (let iter = 0; iter < 3; iter++) {
    const qs = W.query(p.x, p.y + 1, p.x + p.w, p.y + p.h - 1, _q, G.dyn); let hit = false;
    for (const b of qs) {
      if (b.one) continue;
      if (p.x + p.w > b.x0 && p.x < b.x1 && p.y + p.h > b.y0 + .01 && p.y < b.y1) {
        const rise = p.y + p.h - b.y0;
        if (rise <= PH.STEP && p.vy >= -60 && !blocked(p.x, b.y0 - p.h, p.w, p.h)) { p.y = b.y0 - p.h; if (p.vy > 0) p.vy = 0; hit = true; continue; }
        if (dx > 0 || (dx === 0 && p.vx >= 0)) p.x = b.x0 - p.w; else p.x = b.x1;
        p.vx = 0; hit = true;
      }
    }
    if (!hit) break;
  }
}
function blocked(x, y, w, h) {
  const qs = G.world.query(x, y + 1, x + w, y + h - 1, [], G.dyn);
  for (const b of qs) if (!b.one && x + w > b.x0 && x < b.x1 && y + h > b.y0 && y < b.y1) return true;
  return false;
}
function playerMoveY(p, dy) {
  const W = G.world, prevBottom = p.y + p.h;
  p.y += dy; p.onGround = false;
  const qs = W.query(p.x + 1, p.y, p.x + p.w - 1, p.y + p.h + 1, _q, G.dyn);
  if (dy >= 0) {
    let best = null;
    for (const b of qs) {
      if (!(p.x + p.w > b.x0 + 1 && p.x < b.x1 - 1 && p.y + p.h > b.y0 && p.y < b.y1)) continue;
      if (b.one && prevBottom > b.y0 + 3) continue;
      if (!b.one && prevBottom > b.y0 + PH.STEP + 6 && p.y + p.h - b.y0 > PH.STEP + 6) continue;   // side hit, handled by X
      if (!best || b.y0 < best.y0) best = b;
    }
    if (best) {
      p.y = best.y0 - p.h;
      if (best.bounce) { p.vy = -(Input.jump ? 1120 : 1000); p.jumping = true; p.cut = true; p.scx = .7; p.scy = 1.35; p.onGround = false; G.pads.set(best.r * W.w + best.c, .35); Sound.play('boing'); FX.ring(best.c * T + 32, best.r * T, 48, '#5aa0e0', .35); FX.dust(best.c * T + 32, best.r * T, 0, 5); G.bump(best.c * T + 32, best.r * T - 20, 'BOING!'); return; }
      if (best.pot) { const pot = best.pot; potteryBreak(pot, true); p.vy = -(Input.jump ? (pot.tall ? PH.BOUNCE_TALL : PH.BOUNCE_HI) : pot.bounce); p.scx = .78; p.scy = 1.25; p.jumping = true; p.cut = !Input.jump; p.onGround = false; return; }
      if (p.vy > 0) p.vy = 0; p.onGround = true;
    }
  } else {
    for (const b of qs) {
      if (b.one) continue;
      if (p.x + p.w > b.x0 + 1 && p.x < b.x1 - 1 && p.y < b.y1 && p.y + p.h > b.y0) {
        const ov = Math.min(p.x + p.w, b.x1) - Math.max(p.x, b.x0);
        if (ov <= 11) {     // corner correction: slide round the ledge
          const nx = (p.x + p.w / 2 < (b.x0 + b.x1) / 2) ? b.x0 - p.w : b.x1;
          if (!blocked(nx, p.y, p.w, p.h)) { p.x = nx; continue; }
        }
        p.y = b.y1; p.vy = 0; p.cut = true;
      }
    }
  }
}

function playerUpdate(p, dt) {
  const dir = (Input.right ? 1 : 0) - (Input.left ? 1 : 0);
  const gr = p.onGround;
  if (dir) {
    const a = (gr ? PH.ACC_G : PH.ACC_A) * (Math.sign(p.vx) === -dir ? PH.TURN : 1);
    p.vx += dir * a * dt; if (Math.abs(p.vx) > PH.MAXV) p.vx = Math.sign(p.vx) * Math.max(PH.MAXV, Math.abs(p.vx) - 3000 * dt);
    p.facing = dir;
  } else {
    const f = (gr ? PH.FRIC_G : PH.FRIC_A) * dt;
    p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f;
  }
  // timers
  p.coyote = gr ? PH.COYOTE : p.coyote - dt;
  p.buf = Input.jumpEdge ? PH.BUF : p.buf - dt;
  if (Input.jumpEdge) Input.jumpEdge = false;
  if (p.buf > 0 && p.coyote > 0) {
    p.vy = -PH.JV; p.buf = 0; p.coyote = 0; p.onGround = false; p.jumping = true; p.cut = false;
    p.scx = 1.2; p.scy = .8; Sound.play('jump'); FX.dust(p.x + p.w / 2, p.y + p.h, 0, 4);
  }
  if (p.jumping && !Input.jump && !p.cut && p.vy < -220) { p.vy *= .5; p.cut = true; }
  let g = p.vy > 0 ? PH.G_DOWN : PH.G_UP;
  if (p.jumping && Input.jump && Math.abs(p.vy) < 120) g *= .8;
  p.vy = Math.min(p.vy + g * dt, PH.VMAX);
  const was = p.wasGround, vyBefore = p.vy;
  playerMoveX(p, p.vx * dt);
  playerMoveY(p, p.vy * dt);
  if (p.onGround) { p.jumping = false; if (!was) { if (vyBefore > 320) { p.scx = 1.28; p.scy = .74; FX.dust(p.x + p.w / 2, p.y + p.h, 0, 5); Sound.play('land'); } else { p.scx = 1.1; p.scy = .92; } } }
  p.wasGround = p.onGround;
  // sword
  p.atkCd -= dt; if (p.atk > 0) p.atk -= dt;
  if (Input.attackEdge) { Input.attackEdge = false; if (G.sword && p.atkCd <= 0 && !p.win) {
    if (G.ink >= 100 && G.inkRush <= 0) G.startInkRush(p);
    p.atk = G.inkRush > 0 ? .32 : .24; p.atkCd = G.inkRush > 0 ? .22 : .38; p.atkHit = new Set();
    // A grounded or mid-air slash now carries a short, controllable forward lunge.
    p.dashT = Math.max(p.dashT || 0, G.inkRush > 0 ? .19 : .11); p.dashDir = p.facing; p.vx = p.facing * (G.inkRush > 0 ? 570 : 430);
    Sound.play('swing'); G.swungRun = true; if (!Save.data.swung) { Save.data.swung = true; Save.write(); }
  } }
  if (p.dashT > 0) { p.dashT = Math.max(0, p.dashT - dt); p.vx = p.dashDir * (G.inkRush > 0 ? 570 : 430); p.inv = Math.max(p.inv, Math.min(.08, p.dashT)); }
  p.inv = Math.max(0, p.inv - dt);
  // visual springs
  const k = Math.min(1, dt * 15); p.scx += (1 - p.scx) * k; p.scy += (1 - p.scy) * k;
  if (p.onGround && Math.abs(p.vx) > 20) p.walkT += Math.abs(p.vx) * dt * .045;
  p.lean += ((p.vx / PH.MAXV) * .16 - p.lean) * Math.min(1, dt * 12);
  if (p.y > G.world.killY) G.hurt('pit', { x: p.x + p.w / 2, y: G.world.py - 30 }, true);
}
