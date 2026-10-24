'use strict';
/* =============================== CORE ===================================== */
const VW = 1024, VH = 576, T = 64;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const ease = {
  out: t => 1 - (1 - t) * (1 - t),
  inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
const $ = id => document.getElementById(id);
const fmtTime = s => { s = Math.max(0, s); const m = Math.floor(s / 60), x = Math.floor(s % 60); return String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0'); };
const COLORS = { ink: '#2b2b33', paper: '#f4ecd6', red: '#ff5a64', purple: '#8f7bff', green: '#35d98a', yellow: '#ffb800', margin: '#c9544f', pencil: '#5c6b8c' };

/* ------------------------------- SAVE ------------------------------------ */
const Save = {
  key: 'scribblejump.v1',
  data: { unlocked: 1, levels: {}, sound: true, music: true, fs: false, sword: false, best: {}, ach: {}, skin: 'red', edist: 0 },
  load() { try { const s = JSON.parse(localStorage.getItem(this.key) || localStorage.getItem('pagehopper.v1')); if (s && typeof s === 'object') Object.assign(this.data, s); } catch (e) { } },
  write() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { } },
  level(id) { return this.data.levels[id] || null; },
  starsFor(id) { const l = this.level(id); return l ? l.stars.filter(Boolean).length : 0; },
  totalStars() { return LEVELS.reduce((a, l) => a + this.starsFor(l.id), 0); },
  /* merges a finished run into the record; returns {newBest} */
  record(id, stars, time) {
    const old = this.level(id);
    const merged = old ? old.stars.map((v, i) => v || stars[i]) : stars.slice();
    const newBest = !old || time < old.best;
    this.data.levels[id] = { stars: merged, best: newBest ? time : old.best };
    this.data.unlocked = Math.max(this.data.unlocked, Math.min(LEVELS.length, id + 1));
    this.write();
    return { newBest, merged };
  },
};

/* ------------------------------- AUDIO ----------------------------------- */
const Sound = (() => {
  let ctx = null, master, sfxG, musG, noiseBuf, last = {};
  let sfxOn = true, musOn = true;
  function init() {
    if (ctx) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = .7; master.connect(ctx.destination);
    sfxG = ctx.createGain(); sfxG.gain.value = sfxOn ? 1 : 0; sfxG.connect(master);
    musG = ctx.createGain(); musG.gain.value = musOn ? .2 : 0; musG.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function resume() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function tone(f, d, type = 'sine', v = .15, to = 0, delay = 0, dest) {
    if (!ctx) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + d + .02);
  }
  function noise(d, v, f0 = 1200, f1 = 0, delay = 0, type = 'lowpass') {
    if (!ctx) return;
    const t = ctx.currentTime + delay, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.setValueAtTime(f0, t);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(sfxG); s.start(t, Math.random() * .5); s.stop(t + d + .02);
  }
  const S = {
    jump() { tone(300, .13, 'square', .05, 620); },
    land() { noise(.07, .12, 500, 160); },
    star(a = 0) { const k = Math.pow(1.0595, a); tone(988 * k, .09, 'triangle', .13); tone(1480 * k, .16, 'triangle', .12, 0, .07); },
    combo(a = 0) { const k = Math.pow(1.0595, a * 2); tone(660 * k, .1, 'square', .05); tone(990 * k, .14, 'triangle', .09, 0, .06); },
    boing() { tone(180, .32, 'sine', .2, 620); tone(360, .3, 'triangle', .08, 900); },
    whoosh() { noise(.18, .09, 300, 2500, 0, 'bandpass'); },
    pot() { noise(.18, .2, 2600, 500, 0, 'bandpass'); tone(190, .1, 'triangle', .1, 90); },
    stomp() { tone(260, .12, 'square', .08, 90); noise(.06, .1, 900, 200); },
    defeat() { tone(420, .1, 'triangle', .1, 160); tone(210, .18, 'triangle', .09, 70, .06); },
    hurt() { noise(.25, .22, 2400, 200, 0, 'bandpass'); tone(300, .25, 'sawtooth', .07, 60); },
    death() { tone(440, .12, 'triangle', .14, 330); tone(330, .14, 'triangle', .13, 220, .1); tone(200, .3, 'triangle', .12, 70, .22); noise(.2, .12, 900, 150); },
    warn() { tone(660, .07, 'square', .05); tone(660, .07, 'square', .05, 0, .13); },
    fire() { noise(.3, .3, 900, 80); tone(120, .26, 'sine', .3, 40); },
    shield() { tone(520, .1, 'triangle', .12); tone(780, .1, 'triangle', .12, 0, .08); tone(1170, .22, 'triangle', .12, 0, .16); },
    shieldBreak() { noise(.3, .2, 7000, 1500, 0, 'highpass'); tone(1400, .2, 'triangle', .08, 500); },
    swordGet() { tone(1500, .06, 'triangle', .1); tone(2200, .3, 'triangle', .1, 0, .05); noise(.2, .08, 6000, 3000, 0, 'highpass'); },
    swing() { noise(.14, .14, 500, 3500, 0, 'bandpass'); },
    hit() { noise(.09, .2, 1800, 300, 0, 'bandpass'); tone(180, .1, 'square', .08, 80); },
    check() { tone(660, .25, 'sine', .14); tone(990, .35, 'sine', .12, 0, .1); },
    door() { tone(262, .1, 'triangle', .1); tone(392, .16, 'triangle', .1, 0, .08); },
    complete() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .28, 'triangle', .13, 0, i * .09)); },
    page() { noise(.55, .16, 400, 4200, 0, 'bandpass'); noise(.35, .08, 3000, 500, .4, 'highpass'); },
    click() { tone(520, .05, 'square', .04); },
    bag() { [660, 880, 1100, 1320, 1760].forEach((f, i) => tone(f, .18, 'sine', .1, 0, i * .06)); },
  };
  function play(n, a) {
    if (!ctx || !sfxOn || ctx.state !== 'running') return;
    const now = performance.now(); if (last[n] && now - last[n] < 45 && n !== 'star') return; last[n] = now;
    try { S[n](a); } catch (e) { console.warn('[Scribble Jump] sound failed:', n, e); }
  }
  /* --- soundtrack: layered procedural BGM (pads, bass, arpeggios, melody, drums). A different track per page; it gets busier in fights --- */
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const MUS = {
    0: { bpm: 100, root: 60, prog: [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M']], sc: [0, 2, 4, 7, 9] },                    // title: sunny
    1: { bpm: 112, root: 55, prog: [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M']], sc: [0, 2, 4, 7, 9] },                    // page 1: bouncy classroom
    2: { bpm: 120, root: 57, prog: [[0, 'm'], [10, 'M'], [8, 'M'], [7, 'M']], sc: [0, 3, 5, 7, 10], march: true },     // page 2: marching minor
    3: { bpm: 104, root: 62, prog: [[0, 'M'], [2, 'M'], [9, 'm'], [7, 'M']], sc: [0, 2, 4, 6, 9] },                    // page 3: airy lydian
    4: { bpm: 110, root: 52, prog: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], sc: [0, 3, 5, 7, 10] },                  // page 4: dramatic
  };
  const CH = { M: [0, 4, 7], m: [0, 3, 7] };
  let mus = { page: -1, step: 0, next: 0, timer: 0, mel: [] }, inten = 1;
  function melodyFor(page) { let s = (page + 3) * 9301 + 49297; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; const m = []; for (let i = 0; i < 16; i++) m.push(r() < .42 ? -1 : Math.floor(r() * 7)); return m.concat(m.map((v, i) => i > 11 && r() < .6 ? Math.floor(r() * 7) : v)); }
  function drum(t, kind) {
    if (!ctx) return;
    if (kind === 'kick') { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .17); o.connect(g); g.connect(musG); o.start(t); o.stop(t + .2); return; }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7500 : 1900;
    g.gain.setValueAtTime(kind === 'hat' ? .2 : .55, t); g.gain.exponentialRampToValueAtTime(.001, t + (kind === 'hat' ? .045 : .13)); s.connect(f); f.connect(g); g.connect(musG); s.start(t, Math.random() * .4); s.stop(t + .16);
  }
  function tone2(f, d, type, v, t) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(musG); o.start(t); o.stop(t + d + .05);
  }
  function musicStep(sc, step, t) {
    const tick = 60 / sc.bpm / 4, bar = Math.floor(step / 16), s = step % 16, ch = sc.prog[Math.floor(bar / 2) % 4], base = sc.root + ch[0], notes = CH[ch[1]].map(x => base + x);
    if (s === 0 && bar % 2 === 0) for (const n of notes) tone2(hz(n), tick * 30, 'sine', .13, t);                                   // pad (two bars)
    if ([0, 3, 6, 8, 11, 14].includes(s)) tone2(hz(base - 24), tick * 2.4, 'triangle', .55, t);                                    // bass
    if (inten >= 2 || s % 2 === 0) { const idx = (inten >= 2 ? [0, 2, 1, 2][s % 4] : [0, 1, 2, 1][(s / 2) % 4]); tone2(hz(notes[idx % 3] + 12), tick * 1.7, 'triangle', inten >= 2 ? .3 : .24, t); }   // arpeggio
    if (s % 2 === 0) { const m = mus.mel[(bar * 8 + s / 2) % 32]; if (m >= 0) tone2(hz(sc.root + 12 + sc.sc[m % 5] + 12 * (m >= 5 ? 1 : 0)), tick * 3.2, 'square', .09, t); }   // melody
    if (inten >= 1) { if (inten >= 2 ? s % 4 === 0 : s % 8 === 0 || (bar % 2 && s === 10)) drum(t, 'kick'); if (s === 4 || s === 12 || (sc.march && s % 4 === 0 && s % 8)) drum(t, 'snare'); }
    if (inten >= 2 ? true : (inten >= 1 ? s % 2 === 0 : s % 4 === 2)) drum(t, 'hat');
  }
  function musicLoop() {
    clearTimeout(mus.timer); mus.timer = 0;
    if (!ctx || mus.page < 0) return;
    const sc = MUS[mus.page] || MUS[0];
    if (ctx.state === 'running' && musOn) {
      const tick = 60 / sc.bpm / 4; if (mus.next < ctx.currentTime) mus.next = ctx.currentTime + .06;
      while (mus.next < ctx.currentTime + .35) { musicStep(sc, mus.step++, mus.next); mus.next += tick; }
    }
    mus.timer = setTimeout(musicLoop, 100);
  }
  return {
    init, play,
    resume() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); if (ctx && mus.page >= 0 && !mus.timer) musicLoop(); },
    music(page) { const p = MUS[page] ? page : 0; if (mus.page === p) { if (ctx && !mus.timer) musicLoop(); return; } mus = { page: p, step: 0, next: 0, timer: 0, mel: melodyFor(p) }; if (ctx) musicLoop(); },
    intensity(v) { inten = v; },
    startMusic() { if (ctx && mus.page >= 0) musicLoop(); },
    stopMusic() { clearTimeout(mus.timer); mus.timer = 0; mus.page = -1; },
    set sfx(v) { sfxOn = v; if (sfxG) sfxG.gain.value = v ? 1 : 0; },
    get sfx() { return sfxOn; },
    set mus(v) { musOn = v; if (musG) musG.gain.value = v ? .2 : 0; },
    get mus() { return musOn; },
    get ready() { return !!ctx; },
  };
})();

/* ------------------------------ BADGES / SKINS --------------------------- */
const BADGES = [
  ['smash', 'First Smash', 'Break a pot'], ['sword', 'Sharp Start', 'Find the sword'], ['curtain', 'Curtain Call', 'Cut a curtain gate'], ['deflect', 'Return to Sender', 'Bat a cannonball back'],
  ['guard', 'Guard Duty', 'Slash down an armored guard'], ['combo5', 'On a Roll', 'Chain x5'], ['combo10', 'Scribble Storm', 'Chain x10'], ['bag', 'Treasure Hunter', 'Find a hidden bag'],
  ['clean', 'Spotless', 'Finish a page without losing a life'], ['p1', 'Page 1', 'Finish Morning Algebra'], ['p2', 'Page 2', 'Finish Artillery Margin'], ['p3', 'Page 3', 'Finish The Great Span'],
  ['p4', 'Page 4', 'Finish the Bastion'], ['allstars', 'Star Collector', 'Get every star on a page'],
];
const SKINS = [['red', 'character_round_red', 0], ['yellow', 'character_round_yellow', 3], ['green', 'character_round_green', 6], ['purple', 'character_round_purple', 10]];
const Ach = {
  unlock(id) {
    if (Save.data.ach[id]) return; Save.data.ach[id] = 1; Save.write();
    const b = BADGES.find(x => x[0] === id); if (b && typeof G !== 'undefined' && G.toastShow) G.toastShow('BADGE · ' + b[1], 2.2);
  },
};
function skinImg() { const k = SKINS.find(x => x[0] === Save.data.skin) || SKINS[0]; return k[1]; }

/* ---------------------- device + adaptive quality ------------------------ */
/* what kind of device is this? (phones in "desktop site" mode still report a small physical screen + touch points) */
const DEVICE = (() => {
  let coarse = false, anyCoarse = false; try { coarse = matchMedia('(pointer:coarse)').matches; anyCoarse = matchMedia('(any-pointer:coarse)').matches; } catch (e) { }
  const tp = navigator.maxTouchPoints || 0, sw = screen.width || 1024, sh = screen.height || 576, smin = Math.min(sw, sh), smax = Math.max(sw, sh);
  const phone = tp > 0 && smin <= 520, tablet = !phone && tp > 0 && smin <= 900 && (coarse || anyCoarse);
  return { phone, tablet, touch: phone || tablet || (coarse && tp > 0), smin, smax };
})();
const IS_COARSE = (() => { try { return matchMedia('(pointer:coarse) and (hover:none)').matches; } catch (e) { return false; } })();
const Quality = {
  level: IS_COARSE ? 1 : 2,        // 2 = full, 1 = no ambient bits, 0 = also no glows/doodle layer 2 + fewer particles
  acc: 0, n: 0,
  sample(dt) {                     // auto-downgrade when the average frame time stays high
    this.acc += dt; this.n++;
    if (this.n >= 45) { const avg = this.acc / this.n; this.acc = 0; this.n = 0; if (avg > .026 && this.level > 0) { this.level--; this.apply(); } }
  },
  apply() { FX.max = this.level === 0 ? 70 : 170; if (typeof resize === 'function') resize(); },
};

/* ------------------------- PORTAL SDK HOOKS (no-ops) -------------------------
   Fill these in later with your publisher's SDK of choice. The game already calls them
   at the right moments; nothing else in the code needs to change.                                  */
const Portal = {
  init() { }, loadingStart() { }, loadingDone() { },
  gameplayStart() { }, gameplayStop() { },
  levelComplete(levelId, stars, time) { }, gameOver(levelId) { },
  hasRewarded: false,                                // set true when the SDK can show a rewarded ad: a REVIVE button appears on the out-of-lives card
  adBreak(done) { done && done(); },                 // call done() when the ad is finished (or skipped)
  rewarded(done) { done && done(false); },           // done(true) => grant the revive
  muteAudio(on) { },
  track(event, data) { },                            // analytics: level_start, level_complete, death, game_over (id, cause, x ...)
};

/* ------------------------------- ASSETS ---------------------------------- */
const ASSET_NAMES = ['character_round_red', 'character_round_purple', 'character_round_yellow', 'character_round_green', 'character_rectangle_green', 'block', 'plank', 'pottery', 'pottery_tall', 'cactus', 'star', 'bag', 'doorway_closed', 'doorway_open', 'smoke', 'cannon_large', 'cannon_small', 'cannon_base', 'bullet', 'bridge_walkway', 'bridge_column', 'bridge_arch', 'bridge_arch_bottom', 'bridge_arch_large', 'sawblade', 'item_shield', 'item_sword', 'castle', 'castle_top', 'tower', 'tower_base', 'tower_top', 'tower_overhang', 'roof', 'drapes', 'window', 'window_decorative', 'fence', 'pole', 'pole_lantern', 'column', 'carpet', 'obelisk', 'archway_small', 'tower_window', 'triangle', 'lock', 'block_metal', 'plank_metal', 'block_glass', 'character_rectangle_purple', 'character_rectangle_red', 'character_rectangle_yellow', 'column_bottom', 'column_middle', 'column_top', 'column_wide', 'drapes_poles', 'roof_roundA', 'roof_roundB', 'roof_roundC', 'roof_roundD', 'roof_roundE', 'roof_round_half', 'tower_roof_bottom', 'tower_roof_top', 'window_round', 'archway_small_decorative'];
const IM = {};            // raw images
const TINTS = {           // name:variant -> [source, color]
  'star:gold': ['star', '#ffc42e'], 'cactus:g': ['cactus', '#93d890'], 'pottery:t': ['pottery', '#f2b697'], 'pottery_tall:t': ['pottery_tall', '#eaa88a'],
  'sawblade:s': ['sawblade', '#b4c3d8'], 'bullet:d': ['bullet', '#6a6a7a'], 'bag:t': ['bag', '#ebc58a'], 'item_shield:b': ['item_shield', '#8ec6f4'],
  'item_sword:s': ['item_sword', '#d4dbe6'], 'obelisk:on': ['obelisk', '#ffd267'], 'obelisk:off': ['obelisk', '#e6e0d2'],
  'plank:w': ['plank', '#f1d8a8'], 'block:in': ['block', '#d9cfb8'], 'block:in2': ['block', '#cbd0d6'],
  'cannon_large:s': ['cannon_large', '#bdb8cf'], 'cannon_small:s': ['cannon_small', '#bdb8cf'], 'cannon_base:s': ['cannon_base', '#aca7bf'],
  'bridge_walkway:s': ['bridge_walkway', '#e8dfc9'], 'bridge_arch:x': ['bridge_arch', '#e6c79f'], 'bridge_arch:s': ['bridge_arch', '#e8dfc9'], 'bridge_arch_large:s': ['bridge_arch_large', '#e1d8c3'],
  'bridge_column:s': ['bridge_column', '#e1d8c3'], 'castle:s': ['castle', '#d7dbe6'], 'castle_top:s': ['castle_top', '#d7dbe6'],
  'window:s': ['window', '#cfd4e2'], 'window_decorative:s': ['window_decorative', '#cfd4e2'], 'tower:s': ['tower', '#dfe3ee'], 'tower_base:s': ['tower_base', '#d5d9e6'],
  'tower_overhang:s': ['tower_overhang', '#d5d9e6'], 'tower_top:s': ['tower_top', '#cdd3e6'], 'doorway_closed:w': ['doorway_closed', '#e9cf9c'], 'doorway_open:w': ['doorway_open', '#fff0c4'],
  'roof:s': ['roof', '#d4c9c3'], 'drapes:r': ['drapes', '#e9a3a6'], 'window:bg': ['window', '#d6d8de'], 'window_decorative:bg': ['window_decorative', '#d6d8de'], 'block:bg': ['block', '#ddd7c8'],
  'fence:bg': ['fence', '#e8dfc6'], 'block_metal:a': ['block_metal', '#ecd3b0'], 'block_metal:a_in': ['block_metal', '#c4a67f'], 'plank_metal:a': ['plank_metal', '#ead0ac'], 'block:b': ['block', '#e6f2fb'], 'block_glass:t': ['block_glass', '#bfeaff'], 'block:b_in': ['block', '#a6c4dc'], 'block:c': ['block', '#d6dbee'], 'block:c_in': ['block', '#8d93b5'], 'tower_roof_top:s': ['tower_roof_top', '#cfd4e6'], 'triangle:bg': ['triangle', '#e9e2cf'], 'column:bg': ['column', '#e9e2cf'], 'archway_small:bg': ['archway_small', '#e9e2cf'],
};
const MISSING = [];
function loadAssets(onProgress) {
  const inline = window.SJ_INLINE || null;
  return Promise.all(ASSET_NAMES.map(n => new Promise(res => {
    const im = new Image();
    im.onload = () => { IM[n] = im; onProgress && onProgress(); res(); };
    im.onerror = () => { MISSING.push(n); console.error('[Scribble Jump] MISSING ASSET: ' + n); onProgress && onProgress(); res(); };
    im.src = inline ? inline[n] : 'assets/' + n + '.png';
  }))).then(() => {
    for (const k in TINTS) {
      const [src, col] = TINTS[k]; const im = IM[src]; if (!im) continue;
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0);
      IM[k] = c;
    }
    if (MISSING.length) console.error('[Scribble Jump] ' + MISSING.length + ' asset(s) failed to load:', MISSING.join(', '));
  });
}

/* ------------------------------- INPUT ----------------------------------- */
const Input = {
  left: false, right: false, jump: false, attack: false,
  jumpEdge: false, attackEdge: false, any: false,
  keys: new Set(),
  reset() { this.left = this.right = this.jump = this.attack = this.jumpEdge = this.attackEdge = false; this.keys.clear(); },
  sync() {
    const k = this.keys;
    this.left = k.has('ArrowLeft') || k.has('KeyA') || this.tLeft;
    this.right = k.has('ArrowRight') || k.has('KeyD') || this.tRight;
    this.jump = k.has('ArrowUp') || k.has('KeyW') || k.has('Space') || this.tJump;
    this.attack = k.has('KeyX') || k.has('KeyJ') || k.has('KeyK') || this.tAttack;
  },
  tLeft: false, tRight: false, tJump: false, tAttack: false,
};
