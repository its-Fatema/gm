/* ==========================================================================
   PAGEHOPPER — LEVEL DATA
   Units: tiles (1 tile = 64 world px). (c,r) = column,row, row 0 = top.
   terrain: [type, col, row, w, h]
     #  block (solid)            =  plank (one-way)        ~  walkway (one-way)
     A  bridge-arch deck (1-way) P  pier head (deco)       I  pier column (deco)
     C  castle wall (solid)      c  parapet (solid, low)   w/x castle wall blocks
     U  tower body (solid)       B  tower base (solid)     O  balcony (solid)
     n/m  background wall (deco, not solid)
   Entities sit in the tile they occupy; their feet rest on the tile below.
   ========================================================================== */
const R = (t, c, r, w = 1, h = 1) => [t, c, r, w, h];
const pier = (c, deckRow, bottom) => {            // pier head + column under a deck tile
  const out = [R('P', c, deckRow + 1)];
  for (let r = deckRow + 2; r <= bottom; r++) out.push(R('I', c, r));
  return out;
};
// background tower (non-colliding architecture): base, body, balcony, spire
const bgTower = (c, top, base, a = .5) => {
  const out = [['tower_base:s', c, base, a], ['tower_top:s', c, top, a], ['tower_overhang:s', c, top + 1, a]];
  for (let r = top + 2; r < base; r++) out.push(['tower:s', c, r, a]);
  return out;
};
const piers = (cols, deckRow, bottom) => cols.flatMap(c => pier(c, deckRow, bottom));

const LEVELS = [
/* ───────────────────────── PAGE 1 — MORNING ALGEBRA ───────────────────────── */
{
  id: 1, name: 'MORNING ALGEBRA', blurb: 'smash · slash · collect', theme: 'class',
  w: 176, h: 9, spawn: [3, 6], exit: [172, 6], chase: [],
  challenge: 'Find the hidden bag',
  terrain: [
    R('#', 0, 7, 20, 2),                                 // 1  opening: star trail + first smash
    R('#', 22, 7, 36, 2),                                // 2  the sword + smash row + first blob
    R('#', 60, 7, 30, 2),                                // 3  cactus lane
    R('#', 92, 7, 2, 2),                                 // 2-wide pillar in the pit (pottery on top)
    R('#', 95, 7, 45, 2),                                // 4  pottery + blob + star stairs
    R('#', 142, 7, 34, 2),                               // 5  final approach
    // optional star stairs to the hidden bag
    R('=', 118, 6, 2), R('=', 121, 5, 2), R('=', 124, 4, 2), R('=', 121, 3, 2), R('=', 118, 2, 2), R('=', 113, 1, 4),
  ],
  stars: [[6, 6], [9, 5], [11, 4], [19, 4], [28, 5], [40, 4], [44, 4], [56, 4], [66, 4], [78, 5], [92, 4], [104, 4], [119, 5], [122, 4], [125, 3], [122, 2], [119, 1], [146, 2], [168, 5], [159, 4], [38, 6], [38, 5], [165, 6], [166, 5]],
  bags: [[115, 0]],
  cacti: [[66, 6], [72, 6], [75, 6], [83, 6], [113, 6], [150, 6]],
  pottery: [[13, 6, 's'], [30, 6], [31, 6, 's'], [32, 6], [92, 6], [101, 6], [102, 6, 's'], [135, 6], [146, 6, 't']],
  checkpoints: [[53, 6], [98, 6], [144, 6]],
  enemies: [
    { k: 'purple', c: 43, r: 6, min: 40, max: 47 },
    { k: 'purple', c: 108, r: 6, min: 105, max: 111 },
    { k: 'purple', c: 158, r: 6, min: 155, max: 162, hop: true },
  ],
  items: [{ k: 'sword', c: 25, r: 6 }],
  gates: [[36, 4, 3], [163, 4, 3]],
  saws: [], cannons: [],
  notes: [[1.6, 3.2, '← →  or  A D  to move', -.03, 26], [1.6, 4.0, '↑  W  or  space  to jump', -.02, 26], [10.6, 3.6, 'land on it!', -.04, 24, 'arrow'],
    [22.4, 3.9, 'a sword!  take it', -.03, 24, 'arrow'], [28.4, 3.2, 'press X to slash', -.03, 24], [34, 2.9, 'curtain! slash it open', -.03, 22], [39.6, 2.6, 'blobs: stomp them or slash them', -.03, 22],
    [62.6, 3.6, 'cactus = ouch!', -.05, 24], [79.5, 4.4, 'obelisk = checkpoint', -.03, 22, 'arrow'], [97.6, 1.2, 'star stairs → something up there?', -.03, 20],
    [143, 4.2, 'tall pottery = BIG bounce', -.03, 22, 'arrow']],
  near: [], cam: [],
},
/* ───────────────────────── PAGE 2 — ARTILLERY MARGIN ───────────────────────── */
{
  id: 2, name: 'ARTILLERY MARGIN', blurb: 'cannons · purple blobs', theme: 'artillery',
  w: 160, h: 9, spawn: [3, 6], exit: [158, 6],
  challenge: 'Reach the bag above the guns',
  terrain: [
    R('#', 0, 7, 66, 2),                                 // 0-65 : intro, enemies, first cannon
    R('#', 38, 6, 6, 1),                                 // plateau for the 2nd blob
    R('#', 68, 7, 2, 2),                                 // pillar between two 2-tile pits
    R('#', 72, 7, 64, 2),                                // 72-135 : cannon over gap, blob + cannon
    R('#', 138, 7, 22, 2),                               // 138-159 : final approach
    // optional high route to the bag (two stepping planks, then a long ledge guarded by a cannon)
    R('=', 112, 6, 2), R('=', 115, 5, 2), R('=', 118, 4, 2),
    R('#', 121, 3, 11, 1),
  ],
  stars: [[8, 6], [12, 5], [15, 5], [29, 4], [41, 3], [51, 4], [65, 6], [65, 5], [69, 5], [92, 4], [106, 4], [116, 4], [125, 2], [147, 4]],
  bags: [[130, 2]],
  cacti: [[153, 6]],
  pottery: [[20, 6, 's']],
  checkpoints: [[61, 6], [84, 6], [139, 6]],
  enemies: [
    { k: 'purple', c: 29, r: 6, min: 26, max: 33 },
    { k: 'purple', c: 41, r: 5, min: 39, max: 42 },
    { k: 'purple', c: 93, r: 6, min: 90, max: 95 },
    { k: 'purple', c: 124, r: 6, min: 119, max: 125 },
    { k: 'purple', c: 146, r: 6, min: 144, max: 149, hop: true },
  ],
  cannons: [
    { c: 57, r: 5, dir: -1, size: 'large', interval: 4.2, warn: 1.5, phase: 0.6 },
    { c: 79, r: 6, dir: -1, size: 'small', interval: 3.4, warn: 1.2, phase: 0 },
    { c: 104, r: 6, dir: -1, size: 'small', interval: 3.4, warn: 1.2, phase: 1.1 },
    { c: 129, r: 2, dir: -1, size: 'small', interval: 3.0, warn: 1.1, phase: 0.4 },
  ],
  saws: [], items: [],
  gates: [[63, 4, 3]],
  notes: [[1.6, 3.4, 'purple blobs: land on their heads!', -.03, 24], [36, 3.4, 'stomp them', -.04, 22], [47, 3.6, 'a cannon! watch the red dotted line', -.03, 22],
    [66, 4.2, 'wait for the shot, then hop', -.03, 22], [96.5, 4.6, 'blob + cannon: stomp first, hop second', -.02, 20], [111, 2.2, 'high road → bag', -.04, 22, 'arrow']],
  near: [], cam: [],
},
/* ───────────────────────── PAGE 3 — THE GREAT SPAN ───────────────────────── */
{
  id: 3, name: 'THE GREAT SPAN', blurb: 'sawblades · shield · bridge', theme: 'bridge',
  w: 176, h: 12, spawn: [3, 8], exit: [172, 8],
  challenge: 'Cross the high span for the bag',
  terrain: [
    R('#', 0, 9, 10, 3),
    R('A', 10, 9, 21), ...piers([14, 20, 26, 30], 9, 11),
    R('A', 33, 9, 18), ...piers([38, 44, 50], 9, 11),
    R('A', 53, 9, 30), ...piers([58, 64, 70, 76, 82], 9, 11),
    R('A', 85, 9, 2), ...piers([85, 86], 9, 11),
    R('A', 89, 9, 16), ...piers([92, 98, 104], 9, 11),
    // vertical section: zig-zag climb
    R('A', 107, 8, 4), ...piers([108, 110], 8, 11),
    R('A', 112, 7, 4), ...piers([113, 115], 7, 11),
    R('A', 107, 6, 4), R('A', 112, 5, 4), R('A', 107, 4, 4),
    // optional: bag route off the top of the climb
    R('A', 103, 3, 3), R('A', 107, 2, 6),
    // upper span
    R('A', 112, 4, 11), ...piers([113, 118, 122], 4, 11),
    R('A', 125, 4, 15), ...piers([127, 133, 139], 4, 11),
    // descent
    R('A', 141, 5, 3), R('A', 145, 6, 3), R('A', 149, 7, 3), R('A', 153, 8, 3),
    R('A', 157, 9, 9), ...piers([158, 164], 9, 11),
    R('#', 166, 9, 10, 3),
  ],
  stars: [[6, 8], [9, 7], [18, 8], [28, 8], [42, 6], [64, 8], [79, 7], [96, 8], [109, 7], [117, 3], [130, 3], [146, 5], [160, 8]],
  bags: [[112, 1]],
  saws: [
    { c: 42, r: 8 },                                                 // teach: one static blade on a wide deck
    { c: 62, r: 8 }, { c: 66, r: 8 },                                // test: two blades, safe lane between
    { a: [84, 7], b: [88, 7], period: 3.4 },                         // gauntlet: blade sweeping over the islet
    { c: 115, r: 4 },                                                // on the climb, far end of the deck
    { c: 110, r: 1 },                                                // optional bag route
    { a: [123.5, 0.6], b: [123.5, 2.2], period: 3.0 },                   // high blade over the upper gap
  ],
  cannons: [], enemies: [], pottery: [], cacti: [],
  gates: [[47, 6, 3]],
  checkpoints: [[57, 8], [96, 8]],
  items: [{ k: 'shield', c: 76, r: 8 }],
  notes: [[1.5, 6.2, 'a real bridge, at last', -.03, 26], [36, 5.6, 'sawblades never wander', -.03, 22], [71.5, 5.8, 'shield = one free mistake', -.03, 22, 'arrow'],
    [83, 4.4, 'time the sweep', -.03, 22], [104, 2.4, 'climb!', -.03, 24]],
  near: [], cam: [],
},
/* ───────────────────────── PAGE 4 — THE HEADMASTER'S BASTION ───────────────────────── */
{
  id: 4, name: "THE HEADMASTER'S BASTION", blurb: 'armored guards · sword · fortress', theme: 'castle',
  w: 176, h: 14, spawn: [3, 10], exit: [170, 1],
  challenge: 'Find the bag on the armory roof',
  terrain: [
    // backdrops (non-solid): courtyard wall, armory hall, tower shaft
    R('b', 0, 3, 50, 8), R('n', 8, 8), R('n', 16, 8), R('n', 24, 8), R('n', 32, 8), R('n', 44, 8),
    R('b', 50, 7, 18, 4), R('m', 53, 8), R('m', 58, 8), R('m', 63, 8),
    R('b', 104, 2, 14, 9), R('n', 108, 4), R('n', 114, 6), R('n', 108, 8), R('m', 114, 9),
    // ground
    R('#', 0, 11, 80, 3),                                // entrance, courtyard, armory floor
    R('#', 81, 11, 2, 3),                                // island in the pit
    R('#', 85, 11, 34, 3),                               // lower fortress + tower floor
    R('C', 38, 10, 2, 1),
    // armory roof and the optional parapet stair that leads up to it
    R('C', 50, 6, 18, 1),
    R('c', 40, 9, 3), R('c', 44, 8, 3), R('c', 47, 7, 3),
    R('C', 98, 10, 2, 1),
    // tower ascent
    R('c', 105, 9, 3), R('c', 110, 8, 3), R('c', 105, 7, 3), R('c', 110, 6, 3), R('c', 105, 5, 3), R('c', 110, 4, 3),
    R('C', 118, 4, 1, 7),
    // upper fortress walkways
    R('c', 114, 3, 13), R('c', 129, 3, 13), R('c', 144, 3, 13),
    // keep (final approach)
    R('x', 157, 3, 18, 2), R('C', 157, 2, 18, 1), R('C', 157, 5, 18, 7),
  ],
  stars: [[12, 9], [30, 8], [41, 8], [64, 4], [69, 9], [81, 9], [92, 8], [106, 8], [106, 4], [118, 1], [128, 1], [148, 1]],
  bags: [[66, 5]],
  cacti: [], pottery: [], saws: [], cannons: [],
  gates: [[50, 8, 3], [101, 8, 3]],
  enemies: [
    { k: 'green', c: 30, r: 10, min: 27, max: 35 },
    { k: 'green', c: 64, r: 10, min: 62, max: 66 },
    { k: 'green', c: 58, r: 5, min: 54, max: 62 },
    { k: 'green', c: 92, r: 10, min: 88, max: 95 },
    { k: 'green', c: 122, r: 2, min: 120, max: 125 },
    { k: 'green', c: 136, r: 2, min: 135, max: 140 },
    { k: 'green', c: 152, r: 2, min: 150, max: 155 },
  ],
  checkpoints: [[20, 10], [74, 10], [115, 2], [130, 2], [145, 2]],
  items: [{ k: 'sword', c: 59, r: 10 }],
  near: [
    ...[12, 20, 28, 36, 46].map(c => ['drapes:r', c, 7, .85]), ...[52, 56, 61, 65].map(c => ['drapes:r', c, 7, .9]),
    ...bgTower(80, 5, 12, .42), ...bgTower(84, 7, 12, .42), ...bgTower(127, 3, 12, .42), ...bgTower(142, 4, 12, .42), ...bgTower(100, 6, 11, .35),
    ['tower_top:s', 174, 1, .95], ['roof:s', 160, 1, .9], ['tower_top:s', 157, 1, .95],
  ],
  notes: [[1.6, 7.2, 'the headmaster\'s bastion', -.03, 28], [24, 7.2, 'armor: stomps only stun — slash them (X)', -.03, 22], [47.4, 4.2, 'slash the curtain → armory', -.03, 22, 'arrow'],
    [71, 8.2, 'sword: press X', -.03, 22], [103, 11.4, 'up the tower!', -.03, 22], [153.5, 0.6, 'the headmaster\'s door →', -.03, 22]],
  cam: [],
},
];

/* ---- level extension: splice a block of content (absolute columns) into a level at column `at` ---- */
function insertAt(L, at, w, seg) {
  const sh = c => (c >= at ? c + w : c);
  L.terrain = L.terrain.flatMap(([t, c, r, rw, rh]) => (c < at && c + rw > at) ? [[t, c, r, at - c, rh], [t, at + w, r, c + rw - at, rh]] : [[t, sh(c), r, rw, rh]]);
  for (const k of ['stars', 'bags', 'cacti', 'pottery', 'checkpoints']) L[k] = L[k].map(([c, r, ...x]) => [sh(c), r, ...x]);
  L.enemies = L.enemies.map(e => ({ ...e, c: sh(e.c), min: sh(e.min), max: sh(e.max) }));
  L.cannons = L.cannons.map(e => ({ ...e, c: sh(e.c) }));
  L.saws = L.saws.map(s => s.a ? { ...s, a: [sh(s.a[0]), s.a[1]], b: [sh(s.b[0]), s.b[1]] } : { ...s, c: sh(s.c) });
  L.items = L.items.map(i => ({ ...i, c: sh(i.c) }));
  L.near = (L.near || []).map(([i, c, ...x]) => [i, sh(c), ...x]);
  L.notes = (L.notes || []).map(([c, ...x]) => [sh(c), ...x]);
  L.cam = (L.cam || []).map(([a, b, ...x]) => [sh(a), sh(b), ...x]);
  L.sections = (L.sections || []).map(([a, b, ...x]) => [sh(a), b >= at ? b + w : b, ...x]);
  L.movers = (L.movers || []).map(m => ({ ...m, c: sh(m.c) })); L.rain = (L.rain || []).map(r => ({ ...r, c1: sh(r.c1), c2: sh(r.c2) }));
  L.exit = [sh(L.exit[0]), L.exit[1]]; L.w += w;
  for (const k of Object.keys(seg)) L[k] = (L[k] || []).concat(seg[k]);
}

/* PAGE 2 — "the reflecting range": deflect a cannon shot back into a blob, smash pottery with its own bullets */
insertAt(LEVELS[1], 136, 30, {
  terrain: [R('#', 136, 7, 30, 2)],
  stars: [[141, 5], [148, 4], [157, 5], [163, 5]],
  checkpoints: [[138, 6]],
  enemies: [{ k: 'purple', c: 147, r: 6, min: 144, max: 150 }],
  pottery: [[154, 6, 's'], [155, 6], [156, 6]],
  cannons: [{ c: 163, r: 6, dir: -1, size: 'small', interval: 3.2, warn: 1.2, phase: 0.8 }],
  notes: [[139, 3.4, 'swing X at a cannonball to bat it back!', -.03, 22], [150.6, 4.6, 'bullets break pottery too', -.03, 22]],
});

/* PAGE 3 — "saw alley": a second low span with a rising blade, twin blades and another shield */
insertAt(LEVELS[2], 106, 34, {
  terrain: [R('A', 106, 9, 34), ...piers([110, 116, 122, 128, 134, 139], 9, 11)],
  stars: [[112, 7], [120, 8], [131, 8], [134, 8]],
  saws: [{ c: 113, r: 8 }, { a: [125, 6.4], b: [125, 8.1], period: 3.0 }, { c: 132, r: 8 }, { c: 136, r: 8 }],
  items: [{ k: 'shield', c: 108, r: 8 }],
  checkpoints: [[119, 8]],
  notes: [[108, 5.4, 'another shield — use it!', -.03, 22], [123, 5.2, 'slip under when it rises', -.03, 22]],
});

/* PAGE 4 — "the dining hall": two guards, castle-block steps, a pit */
insertAt(LEVELS[3], 103, 34, {
  terrain: [R('#', 103, 11, 17, 3), R('#', 122, 11, 15, 3), R('C', 116, 10, 2, 1)],
  stars: [[107, 9], [119, 8], [129, 8]],
  enemies: [{ k: 'green', c: 112, r: 10, min: 109, max: 115 }, { k: 'green', c: 129, r: 10, min: 126, max: 133 }],
  checkpoints: [[103, 10]],
  notes: [[106, 7.2, 'the dining hall', -.03, 24]],
});
// Page 4: the sword is already yours (Page 1) — the armory now holds a shield instead
LEVELS[3].items = [{ k: 'shield', c: 59, r: 10 }];
LEVELS[3].notes = LEVELS[3].notes.filter(n => !/sword/.test(n[2]));
LEVELS[3].notes.push([71, 8.2, 'a shield, for the road', -.03, 22]);

/* ================= PAGE TWISTS (built on the same splice helper) ================= */
/* PAGE 1 — THE ERASER: the page is being erased from the left; keep running */
insertAt(LEVELS[0], 140, 38, {
  terrain: [R('#', 140, 7, 20, 2), R('#', 162, 7, 16, 2)],
  stars: [[146, 5], [150, 4], [154, 5], [158, 5], [164, 5], [167, 4], [174, 5]],
  cacti: [[152, 6], [170, 6]],
  checkpoints: [[141, 6]],
  chase: [[144, 176, 170]],
  notes: [[142.2, 3.4, 'RUN! the eraser is coming', -.03, 26]],
  sections: [[140, 178, 'THE ERASER RUN', 'keep running!']],
});
LEVELS[0].chase = LEVELS[0].chase || [];

/* PAGE 2 — BIG BLOB: only a batted-back cannonball hurts it */
{ const a = LEVELS[1].exit[0];
  insertAt(LEVELS[1], a, 36, {
    terrain: [R('#', a, 7, 36, 2)],
    checkpoints: [[a + 2, 6]],
    enemies: [{ k: 'purple', boss: 'blob', c: a + 24, r: 6, min: a + 19, max: a + 29, hp: 4 }],
    cannons: [{ c: a + 34, r: 6, dir: -1, size: 'small', interval: 3.2, warn: 1.3, phase: 0.6, range: 24 }],
    stars: [[a + 8, 5], [a + 11, 4], [a + 14, 5]],
    sections: [[a, a + 36, 'BOSS: BIG BLOB', 'bat the cannonball back']],
    notes: [[a + 4, 3.2, 'BIG BLOB! stomps just bounce off…', -.03, 24], [a + 9.5, 4.0, 'bat the cannonball into it (X)', -.03, 24]],
  }); }

/* PAGE 3 — THE COLLAPSING SPAN: cracked planks drop half a second after you step on them */
{ const a = 191;
  insertAt(LEVELS[2], a, 26, {
    terrain: [R('X', a, 9, 26)],
    stars: [[a + 4, 8], [a + 10, 8], [a + 16, 8], [a + 22, 8]],
    checkpoints: [[a - 3, 7]],
    sections: [[a, a + 26, 'THE COLLAPSING SPAN', 'keep moving!']],
    notes: [[a + 1, 6.4, 'cracked planks fall — keep moving!', -.03, 24]],
  }); }

/* PAGE 4 — THE HEADMASTER: slash him, dodge the slam shockwaves */
{ const a = LEVELS[3].exit[0];
  insertAt(LEVELS[3], a, 30, {
    terrain: [R('C', a, 2, 30, 10)],
    checkpoints: [[a + 2, 1]],
    enemies: [{ k: 'green', boss: 'head', c: a + 20, r: 1, min: a + 14, max: a + 25, hp: 6 }],
    sections: [[a, a + 30, 'BOSS: THE HEADMASTER', 'slash him, jump the shockwaves']],
    notes: [[a + 3, -0.2, 'THE HEADMASTER — slash him (X), jump the shockwaves', -.02, 24]],
  }); }


/* ================= PAGE REDESIGN: dense, escalating set-pieces spliced into every page ================= */
/* Each set-piece is safe by construction (flat entry/exit, no hazard beside checkpoints) and is verified by tools/validate.js */
function setPiece(name, a, L) {
  const gr = L.spawn[1] + 1, er = gr - 1, H = L.h, gt = (L.terrain.find(t => t[2] === gr && t[0] !== 'P') || ['#'])[0] === 'A' ? 'A' : (LEVELS.indexOf(L) === 3 ? '#' : '#');
  const seg = { terrain: [], stars: [], cacti: [], pottery: [], checkpoints: [], enemies: [], items: [], saws: [], cannons: [], gates: [], notes: [], arenas: [], bags: [], movers: [], rain: [], sections: [], near: [] };
  const bridge = gt === 'A';
  const g = (x, len) => { seg.terrain.push(R(bridge ? 'A' : '#', x, gr, len, bridge ? 1 : H - gr)); if (bridge) for (let i = 0; i < len; i += 6) { seg.terrain.push(R('P', x + i, gr + 1)); for (let rr = gr + 2; rr < H; rr++) seg.terrain.push(R('I', x + i, rr)); } };
  const star = (x, r) => seg.stars.push([x, r]);
  const cn = (c, r, dir, size, o) => seg.cannons.push({ c, r, dir, size, interval: 3, warn: 1, phase: .4, aim: true, ...o });
  let len = 0; const v = Math.max(0, LEVELS.indexOf(L));       // page index: every page gets its own flavour of each piece
  switch (name) {
    case 'yard': len = 30; g(a, 30); cn(a + 13, er, -1, 'small', { interval: 3.2, warn: 1.1, burst: 2 }); cn(a + 23, gr - 2, -1, 'large', { interval: 3.6, warn: 1.1, phase: 1.5 });
      seg.pottery.push([a + 6, er], [a + 7, er], [a + 17, er], [a + 18, er]); star(a + 4, er - 1); star(a + 10, er - 2); star(a + 20, er - 2); seg.notes.push([a + 2, er - 4.2, 'the cannons AIM at you now — keep moving!', -.03, 22]); break;
    case 'yardLite': len = 24; g(a, 24); cn(a + 14, er, -1, 'small', { interval: 3.8, warn: 1.5, burst: 1 }); seg.pottery.push([a + 7, er], [a + 8, er]); star(a + 5, er - 1); star(a + 10, er - 2); star(a + 18, er - 2);
      seg.notes.push([a + 2, er - 4.2, 'a cannon… what is that thing aiming at?', -.03, 22]); break;
    case 'crossfire': len = 30; g(a, 30); cn(a + 2, er, 1, 'small', { interval: 3.4, warn: 1.1, burst: 1, phase: 1 }); cn(a + 26, gr - 2, -1, 'large', { interval: 3.2, warn: 1.0, burst: 1 });
      seg.pottery.push([a + 12, er], [a + 13, er], [a + 18, er]); star(a + 8, er - 2); star(a + 15, er - 2); star(a + 21, er - 2); seg.notes.push([a + 5, er - 4.2, 'crossfire! one in front, one behind', -.03, 22]); break;
    case 'arena1': { len = 32; g(a, 32); seg.checkpoints.push([a + 1, er]); const pi = LEVELS.indexOf(L);
      const waves = pi === 0 ? [[{ k: 'purple' }, { k: 'purple' }], [{ k: 'purple' }, { k: 'yellow' }, { k: 'purple' }]]
        : [[{ k: 'purple' }, { k: 'flyer' }], [{ k: 'yellow' }, { k: 'flyer' }, { k: 'purple', hop: true }], [{ k: 'flyer' }, { k: 'flyer' }, { k: 'yellow' }]];
      seg.arenas.push({ c1: a + 2, c2: a + 30, r: er, waves }); star(a + 9, er - 2); star(a + 16, er - 2); star(a + 23, er - 2); seg.notes.push([a + 3, er - 4.2, 'a locked arena — beat every wave!', -.03, 22]); break; }
    case 'arena2': { len = 36; g(a, 36); seg.checkpoints.push([a + 1, er]); const pi = LEVELS.indexOf(L);
      const waves = pi === 3 ? [[{ k: 'yellow' }, { k: 'flyer' }, { k: 'flyer' }], [{ k: 'green' }, { k: 'yellow' }, { k: 'yellow' }], [{ k: 'green' }, { k: 'green' }, { k: 'flyer' }]]
        : [[{ k: 'purple' }, { k: 'yellow' }, { k: 'flyer' }], [{ k: 'green' }, { k: 'flyer' }, { k: 'yellow' }], [{ k: 'green' }, { k: 'green' }]];
      seg.arenas.push({ c1: a + 2, c2: a + 34, r: er, waves }); star(a + 10, er - 2); star(a + 18, er - 2); star(a + 26, er - 2); break; }
    case 'zoo': len = 34; g(a, 34); seg.enemies.push({ k: 'flyer', c: a + 9, r: er, min: a + 6, max: a + 14 }, { k: 'yellow', c: a + 21, r: er, min: a + 18, max: a + 27 });
      star(a + 4, er - 1); star(a + 11, er - 2); star(a + 24, er - 2); seg.notes.push([a + 2, er - 4.2, 'flyers: stomp or jump + slash (X)  ·  chargers: jump the dash!', -.03, 20]); break;
    case 'sawlane': len = 32; g(a, 32); seg.saws.push({ c: a + 8, r: er }, { c: a + 15, r: er }, { a: [a + 23, er - 1.6], b: [a + 23, er + .1], period: 2.8 - v * .2 }); if (v >= 2) seg.saws.push({ c: a + 28, r: er });
      star(a + 11, er - 2); star(a + 19, er - 1); star(a + 28, er - 1); seg.notes.push([a + 3, er - 4.2, 'saw lane: wait for the rise', -.03, 22]); break;
    case 'smash': len = 24; g(a, 24); seg.gates.push([a + 4, er - 2, 3]); star(a + 6, er); star(a + 6, er - 1); for (let i = 0; i < 8; i++) seg.pottery.push([a + 9 + i, er, i % 2 ? 's' : '']); seg.notes.push([a + 2, er - 4.2, 'slash the curtain, then SMASH everything', -.03, 22]); break;
    case 'crumbleaim': len = 32; seg.terrain.push(R('X', a, gr, 22)); g(a + 22, 10); cn(a + 30, er, -1, 'small', { interval: 3, warn: 1.1, burst: 2, range: 20 });
      for (let i = 0; i < 4; i++) star(a + 4 + i * 5, er); seg.notes.push([a + 1, er - 4.2, 'cracked planks… and something is aiming at you', -.03, 22]); break;
    case 'lifts': len = 36; g(a, 9); g(a + 22, 14); seg.checkpoints.push([a + 1, er]);
      seg.movers.push({ c: a + 9, r: gr - .25, w: v === 2 ? 2 : 3, ax: 'x', rng: 5, per: 4.6 - v * .5, ph: 0 }, { c: a + 13, r: gr - .25, w: v === 2 ? 2 : 3, ax: 'x', rng: 6, per: 4.6 - v * .5, ph: .5 });
      star(a + 12, er - 2); star(a + 18, er - 2); star(a + 28, er - 1); seg.notes.push([a + 2, er - 4.2, 'hop on the planks and ride across!', -.03, 22]); break;
    case 'launch': len = 26; g(a, 26); seg.terrain.push(R('G', a + 8, er, 1, 1), R('=', a + 10, er - 3, 5));
      star(a + 9, er - 3); star(a + 11, er - 4); star(a + 13, er - 4); star(a + 15, er - 4); star(a + 22, er - 1); seg.notes.push([a + 5, er - 3.6, 'glass = trampoline! jump on it', -.03, 22, 'arrow']); break;
    case 'potrain': len = 30; g(a, 30); seg.rain.push({ c1: a + 2, c2: a + 28, r: er, n: 6 + v * 2 }); star(a + 6, er - 1); star(a + 14, er - 2); star(a + 22, er - 1);
      seg.notes.push([a + 3, er - 4.2, 'something is falling…', -.03, 22]); break;
    case 'rest': len = 14; g(a, 14); seg.checkpoints.push([a + 3, er]); seg.items.push({ k: 'shield', c: a + 7, r: er }, { k: 'heart', c: a + 9, r: er }); star(a + 5, er - 1); break;
  }
  const NAMES = { yard: ['THE CANNON YARD', 'they aim — keep moving'], yardLite: ['THE FIRST CANNON', 'what is it aiming at?'], crossfire: ['CROSSFIRE', 'one ahead, one behind'], arena1: ['ARENA', 'the gates lock behind you'], arena2: ['ARENA II', 'bigger waves'],
    sawlane: ['SAW LANE', 'wait for the rise'], smash: ['SMASH ROOM', 'slash the curtain, break everything'], crumbleaim: ['CRUMBLE & CANNON', 'keep moving!'], rest: ['REST STOP', 'grab the heart'], zoo: ['THE ZOO', 'flyers and chargers'], lifts: ['PLANK RIDE', 'hop on, hold on'], launch: ['TRAMPOLINE', 'jump on the glass'], potrain: ['POT PARTY', 'smash them all'] };
  if (NAMES[name]) seg.sections.push([a, a + len, NAMES[name][0], NAMES[name][1]]);
  const col = (x, bot) => [['column_bottom', x, bot, 1, 64], ['column_middle', x, bot - 1, 1, 64], ['column_top', x, bot - 2, 1, 64]];
  const style = (a + v) % 3;       // three gateway designs, so sections don't all look alike
  if (style === 0) seg.near.push(...col(a, gr - 1), ...col(a + 2, gr - 1), ['archway_small_decorative', a + 1, gr - 3, 1, 64], ['drapes_poles', a + 1, gr - 2, .95, 64]);
  else if (style === 1) seg.near.push(['tower_base:s', a, gr - 1, 1], ['tower:s', a, gr - 2, 1], ['tower:s', a, gr - 3, 1], ['tower_roof_top:s', a, gr - 4, 1, 64], ['tower_base:s', a + 3, gr - 1, 1], ['tower:s', a + 3, gr - 2, 1], ['tower_roof_top:s', a + 3, gr - 3, 1, 64], ['pole_lantern', a + 1, gr - 3, .95, 64]);
  else seg.near.push(['window_round', a + 1, gr - 3, 1, 64], ['roof_roundC', a + 1, gr - 4, 1, 64], ...col(a, gr - 1).slice(0, 2), ['drapes_poles', a + 2, gr - 2, .95, 64]);
  return { len, seg };
}
/* find safe places to splice: long flat stretch, nothing else (hazards, gates, chases...) within 7 columns, nothing overhead */
function findSlots(L, lo, hi) {
  const gr = L.spawn[1] + 1, W = L.w, grid = {}; for (const [t, c, r, w, h] of L.terrain) for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) grid[x + ',' + y] = t;
  const busy = new Set(), mark = (a, b, m = 4) => { for (let x = Math.floor(a) - m; x <= Math.ceil(b) + m; x++) busy.add(x); };
  for (const k of L.cacti) mark(k[0], k[0], 4); for (const k of L.pottery) mark(k[0], k[0], 2); for (const e of L.enemies) mark(e.min, e.max, 4); for (const s of L.saws) s.a ? mark(Math.min(s.a[0], s.b[0]), Math.max(s.a[0], s.b[0]), 4) : mark(s.c, s.c, 4);
  for (const k of L.cannons) mark(k.c - 12, k.c + 1, 1); for (const g of (L.gates || [])) mark(g[0], g[0], 2); for (const k of L.checkpoints) mark(k[0], k[0], 3); for (const k of L.items) mark(k.c, k.c, 2);
  for (const m of (L.movers || [])) mark(m.c, m.c + (m.ax === 'x' ? m.rng : 0) + m.w, 3); for (const r of (L.rain || [])) mark(r.c1, r.c2, 3); for (const [a, b] of (L.chase || []).map(x => [x[0], x[1]])) mark(a, b, 3); for (const a of (L.arenas || [])) mark(a.c1, a.c2, 3); mark(L.exit[0] - 40, L.exit[0] + 5); mark(L.spawn[0] - 2, L.spawn[0] + 10, 0);
  const out = [];
  for (let c = lo; c < Math.min(hi, W - 8); c++) {
    if (busy.has(c)) continue; let ok = true, tp = grid[c + ',' + gr];
    for (let x = c - 2; x <= c + 2 && ok; x++) { if (grid[x + ',' + gr] !== tp || !tp) ok = false; for (let y = 0; y < gr && ok; y++) { const o = grid[x + ',' + y]; if (o && !'PInmb'.includes(o)) ok = false; } }
    if (ok) out.push(c);
  }
  return out;
}
function redesign(idx, list) {              // list: [name, minCol] — gated pieces must come after the sword pickup
  const L = LEVELS[idx], slots = findSlots(L, 12, L.exit[0] - 20); if (!slots.length) return 0;
  const taken = [], jobs = [];
  list.forEach(([n, minCol], i) => {
    const ok = slots.filter(c => c >= minCol && !taken.some(t => Math.abs(t - c) < 24)); if (!ok.length) return;
    const target = slots[0] + (slots[slots.length - 1] - slots[0]) * (i + .5) / list.length; let best = ok[0];
    for (const c of ok) if (Math.abs(c - target) < Math.abs(best - target)) best = c;
    taken.push(best); jobs.push([best, n]);
  });
  jobs.sort((x, y) => y[0] - x[0]);           // rightmost first so earlier columns stay valid
  for (const [col, n] of jobs) { const { len, seg } = setPiece(n, col, L); insertAt(L, col, len, seg); }
  return jobs.length;
}
redesign(0, [['arena1', 80], ['potrain', 90], ['smash', 40]]);
redesign(1, [['yard', 0], ['arena1', 0], ['lifts', 0], ['zoo', 0], ['launch', 0], ['crossfire', 0], ['crumbleaim', 0]]);
redesign(2, [['sawlane', 0], ['lifts', 0], ['zoo', 0], ['launch', 0], ['crossfire', 0], ['potrain', 0], ['arena2', 0], ['smash', 0], ['crumbleaim', 0]]);
redesign(3, [['arena2', 0]]);   // (page 4 has little free flat ground left)
/* page 2's original cannons now hunt you too */
LEVELS[1].cannons.forEach((k, i) => { if (i > 0) { k.aim = true; k.interval = Math.max(2.5, k.interval - .7); k.warn = Math.min(k.warn, 1.0); if (i > 1) k.burst = 2; } });
LEVELS[0].teaser = 'Artillery Margin — cannons that HUNT you.'; LEVELS[1].teaser = 'The Great Span — a bridge of blades that falls apart under you.'; LEVELS[2].teaser = "The Headmaster's Bastion — armored guards, and a boss.";
LEVELS[0].par = 190; LEVELS[1].par = 250; LEVELS[2].par = 270; LEVELS[3].par = 290;

/* ================= ENDLESS: DOODLE DASH (seeded, chunk-built, safe by construction) ================= */
function buildEndless(seed) {
  let s = (seed >>> 0) || 1; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const D = { id: 5, name: 'DOODLE DASH', blurb: 'endless', theme: 'class', themeAt: [[0, 'class']], w: 0, h: 9, spawn: [3, 6], exit: [0, 6], challenge: 'Make it to the end',
    endless: true, sections: [], movers: [], rain: [], terrain: [], stars: [], bags: [], cacti: [], pottery: [], checkpoints: [], enemies: [], items: [], saws: [], cannons: [], gates: [], notes: [], near: [], cam: [], chase: [] };
  const TH = ['class', 'artillery', 'bridge', 'castle'], GT = { class: '#', artillery: '#', bridge: 'A', castle: 'C' };
  let c = 0, n = 0, gt = '#', last = '', since = 0;
  const gnd = (a, len) => D.terrain.push(R(gt, a, 7, len, gt === 'A' ? 1 : 2));
  const star = (a, r) => D.stars.push([a, r]);
  const K = {
    run: () => { gnd(c, 10); star(c + 4, 5); star(c + 5, 4); star(c + 6, 4); star(c + 7, 5); return 10; },
    gap2: () => { gnd(c, 6); gnd(c + 8, 6); star(c + 7, 5); return 14; },
    gap3: () => { gnd(c, 6); D.terrain.push(R('=', c + 7, 6)); gnd(c + 9, 6); star(c + 7, 4); return 15; },
    pots: () => { gnd(c, 12); D.pottery.push([c + 4, 6], [c + 5, 6, 's'], [c + 6, 6]); star(c + 9, 5); return 12; },
    cactus: () => { gnd(c, 13); D.cacti.push([c + 6, 6]); star(c + 6, 4); return 13; },
    cactus2: () => { gnd(c, 17); D.cacti.push([c + 5, 6], [c + 11, 6]); star(c + 8, 5); return 17; },
    gate: () => { gnd(c, 12); D.gates.push([c + 6, 4, 3]); star(c + 8, 6); star(c + 8, 5); if (!D._g) { D._g = 1; D.notes.push([c + 2, 3.4, 'slash the curtain (X)', -.03, 24]); } return 12; },
    blob: () => { gnd(c, 15); D.enemies.push({ k: 'purple', c: c + 8, r: 6, min: c + 5, max: c + 11 }); star(c + 8, 4); return 15; },
    hop: () => { gnd(c, 16); D.enemies.push({ k: 'purple', c: c + 8, r: 6, min: c + 5, max: c + 12, hop: true }); star(c + 8, 4); return 16; },
    pillar: () => { gnd(c, 5); D.terrain.push(R('#', c + 7, 7, 2, 2)); gnd(c + 10, 5); D.pottery.push([c + 7, 6]); star(c + 8, 4); return 15; },
    saw: () => { gnd(c, 14); D.saws.push({ c: c + 7, r: 6 }); star(c + 7, 4); return 14; },
    cannon: () => { gnd(c, 18); D.cannons.push({ c: c + 16, r: 6, dir: -1, size: 'small', interval: 3.4, warn: 1.2, phase: .5 }); star(c + 6, 5); star(c + 9, 5); return 18; },
    zoo: () => { gnd(c, 34); D.enemies.push({ k: 'flyer', c: c + 9, r: 6, min: c + 6, max: c + 14 }, { k: 'yellow', c: c + 21, r: 6, min: c + 18, max: c + 27 }); star(c + 4, 5); star(c + 11, 4); star(c + 24, 4); return 34; },
    lifts: () => { gnd(c, 9); gnd(c + 24, 12); D.movers.push({ c: c + 9, r: 6.75, w: 3, ax: 'x', rng: 5, per: 4.4, ph: 0 }, { c: c + 13, r: 6.75, w: 3, ax: 'x', rng: 6, per: 4.4, ph: .5 }); star(c + 12, 4); star(c + 18, 4); star(c + 28, 5); D.notes.push([c + 2, 2.8, 'ride the planks!', -.03, 24]); return 36; },
    launch: () => { gnd(c, 26); D.terrain.push(R('G', c + 8, 6, 1, 1), R('=', c + 10, 3, 5)); star(c + 9, 3); star(c + 11, 2); star(c + 13, 2); star(c + 15, 2); star(c + 22, 5); D.notes.push([c + 5, 3.2, 'glass = trampoline!', -.03, 24, 'arrow']); return 26; },
    potrain: () => { gnd(c, 30); D.rain.push({ c1: c + 2, c2: c + 28, r: 6, n: 7 }); star(c + 6, 5); star(c + 14, 4); star(c + 22, 5); return 30; },
    guard: () => { gnd(c, 18); D.enemies.push({ k: 'green', c: c + 9, r: 6, min: c + 5, max: c + 13 }); star(c + 9, 4); return 18; },
    rest: () => { gnd(c, 12); D.checkpoints.push([c + 3, 6]); D.items.push({ k: 'shield', c: c + 7, r: 6 }, { k: 'heart', c: c + 9, r: 6 }); star(c + 5, 5); since = 0; return 12; },
    smash: () => { gnd(c, 16); for (let i = 0; i < 8; i++) D.pottery.push([c + 4 + i, 6, i % 2 ? 's' : '']); D.notes.push([c + 3, 4.2, 'SMASH IT ALL!', -.03, 26]); return 16; },
    rain: () => { gnd(c, 14); for (let i = 0; i < 11; i++) star(c + 2 + i, 4 + (i % 2)); D.notes.push([c + 2, 2.4, 'star shower!', -.03, 26]); return 14; },
    crumble: () => { D.terrain.push(R('X', c, 7, 22)); for (let i = 0; i < 4; i++) star(c + 4 + i * 5, 6); D.notes.push([c + 1, 4.3, 'cracked planks — keep moving!', -.03, 22]); return 22; },
    eraser: () => { gnd(c, 18); gnd(c + 20, 16); D.cacti.push([c + 10, 6], [c + 28, 6]); for (let i = 0; i < 6; i++) star(c + 5 + i * 5, 5); D.checkpoints.push([c + 1, 6]); D.chase.push([c + 4, c + 34, 165 + Math.min(40, n * 1.5)]); D.notes.push([c + 2, 3.4, 'RUN! the eraser!', -.03, 26]); return 36; },
  };
  const early = ['run', 'gap2', 'pots', 'cactus', 'gate', 'blob', 'launch'], mid = ['gap3', 'pillar', 'saw', 'cactus2', 'potrain'], late = ['cannon', 'hop', 'zoo', 'lifts'], hard = ['guard'];
  const twists = ['smash', 'eraser', 'crumble', 'rain'];
  // opening: a gentle, juicy start
  gnd(0, 14); star(6, 6); star(9, 5); star(11, 4); c = 14;
  while (c < 560) {
    n++; const d = Math.min(8, Math.floor(n / 2.5)); const th = TH[Math.floor(n / 6) % 4];
    if (D.themeAt[D.themeAt.length - 1][1] !== th) { D.themeAt.push([c, th]); gt = GT[th]; }
    let t;
    if (since >= 4) t = 'rest';
    else if (n % 7 === 6) t = twists[Math.floor(n / 7) % twists.length];
    else { const pool = early.concat(d >= 1 ? mid : [], d >= 3 ? late : [], d >= 5 ? hard : []); do { t = pool[Math.floor(rnd() * pool.length)]; } while (t === last); }
    last = t; if (t !== 'rest') since++;
    const c0 = c; c += K[t](); const NM = { gate: 'CURTAIN CALL', blob: 'BLOB ALLEY', hop: 'HOPPERS', pillar: 'STEPPING STONES', saw: 'SAW LANE', cannon: 'CANNON POINT', guard: 'THE GUARD', rest: 'REST STOP', smash: 'SMASH ROOM', rain: 'STAR SHOWER', crumble: 'CRUMBLING PLANKS', eraser: 'THE ERASER', zoo: 'THE ZOO', lifts: 'PLANK RIDE', launch: 'TRAMPOLINE', potrain: 'POT PARTY', cactus2: 'CACTUS PATCH' }; if (NM[t]) D.sections.push([c0, c, NM[t], 'section ' + n]);
  }
  gnd(c, 16); D.exit = [c + 10, 6]; D.w = c + 16;
  return D;
}

/* ================= DOODLE SCHOOL — the interactive tutorial (steps live in src/03_game.js) ================= */
const TUTORIAL = {
  id: 0, name: 'DOODLE SCHOOL', blurb: 'learn the ropes', theme: 'class', tutorial: true, w: 104, h: 9, spawn: [3, 6], exit: [100, 6], challenge: '', par: 90,
  terrain: [R('#', 0, 7, 25, 2), R('#', 27, 7, 77, 2)],
  stars: [[8, 6], [11, 5], [14, 5], [26, 5], [31, 6], [44, 5], [64, 5], [68, 5], [72, 5], [84, 5], [88, 5], [92, 5]],
  bags: [], cacti: [], saws: [], cannons: [], enemies: [], movers: [], rain: [], chase: [], near: [], cam: [], notes: [],
  items: [{ k: 'sword', c: 44, r: 6 }], pottery: [[34, 6, 's']], checkpoints: [[29, 6]], gates: [[53, 4, 3]],
  arenas: [{ c1: 60, c2: 80, r: 6, waves: [[{ k: 'purple' }]] }],
  tutGates: [{ c: 39, step: 'smash' }, { c: 47, step: 'sword' }],
  sections: [],
};
