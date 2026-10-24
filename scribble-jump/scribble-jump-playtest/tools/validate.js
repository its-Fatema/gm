// Level validator: reachability (physics-derived), overlap audit, safety audit.
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');
const ctx = {}; vm.createContext(ctx);
const tilesSrc = src('02_world.js').match(/const TILES = \{[\s\S]*?\n\};/)[0];
vm.runInContext(src('levels.js').replace(/^const /gm, 'var ') + '\n' + tilesSrc.replace('const ', 'var ') + '\nvar T=64;', ctx);
const { LEVELS, TILES } = ctx; const T = 64;
if (process.env.ENDLESS) { LEVELS.length = 0; for (const sd of process.env.ENDLESS.split(',')) { const d = ctx.buildEndless(+sd); d.id = 'E' + sd; LEVELS.push(d); } }
const PH = { MAXV: 262, JV: 790, G_UP: 2100, G_DOWN: 2650, W: 38, H: 52 };
const APEX = PH.JV * PH.JV / (2 * PH.G_UP);
const dxMax = (dy, jv = PH.JV) => { const ap = jv * jv / (2 * PH.G_UP), rise = ap - dy; if (rise < 0) return -1; return PH.MAXV * (jv / PH.G_UP + Math.sqrt(2 * rise / PH.G_DOWN)); };
let problems = 0; const warn = (l, m) => { problems++; console.log(`  [L${l.id}] ${m}`); };
const note = m => console.log('  · ' + m);

for (const L of LEVELS) {
  console.log(`\n=== L${L.id} ${L.name}  (${L.w}x${L.h}, apex ${APEX.toFixed(0)}px)`);
  const grid = Array(L.w * L.h).fill('');
  for (const [t, c, r, w, h] of L.terrain) for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (x < L.w && y < L.h) grid[y * L.w + x] = t;
  const at = (c, r) => (c < 0 || c >= L.w || r < 0 || r >= L.h) ? '' : grid[r * L.w + c];
  const solidT = (c, r) => { const t = at(c, r); return t && !TILES[t].deco && !TILES[t].one; };
  const stand = (c, r) => { const t = at(c, r); return t && !TILES[t].deco; };
  const boxOf = (c, r) => { const t = at(c, r), d = TILES[t], ix = d.ix || 0, top = d.top || 0; return { x0: c * T + ix, x1: (c + 1) * T - ix, y0: r * T + top, y1: d.one ? r * T + top + d.th : (r + 1) * T, one: !!d.one }; };
  // ---------- surfaces ----------
  const surf = [];
  for (let r = 0; r < L.h; r++) { let cur = null; for (let c = 0; c <= L.w; c++) {
    const t = at(c, r); let ok = t && !TILES[t].deco; let b = ok ? boxOf(c, r) : null;
    if (ok && solidT(c, r - 1) && !TILES[at(c, r)].one) ok = false;       // buried
    if (ok && cur && Math.abs(cur.y - b.y0) < 1 && cur.one === b.one && !!cur.pad === !!TILES[t].bounce) cur.x1 = b.x1; else { if (cur) surf.push(cur); cur = ok ? { x0: b.x0, x1: b.x1, y: b.y0, one: b.one, pad: !!TILES[t].bounce } : null; }
  } }
  // objects that are standable (pottery, cannons)
  for (const p of L.pottery) surf.push({ x0: p[0] * T + 12, x1: p[0] * T + 52, y: p[1] * T + 8, obj: 'pot' });
  for (const k of L.cannons) { surf.push({ x0: k.c * T + 4, x1: k.c * T + 60, y: k.r * T + (k.size === 'small' ? 18 : 21), obj: 'cannon' }); if (k.size === 'large') surf.push({ x0: k.c * T + 8, x1: k.c * T + 56, y: k.r * T + 81, obj: 'cannon' }); }
  for (const m of (L.movers || [])) surf.push({ x0: m.c * T, x1: (m.c + (m.ax === 'x' ? m.rng : 0) + m.w) * T, y: m.r * T + 16, one: true, obj: 'mover' });
  // merge touching same-height surfaces
  surf.sort((a, b) => a.y - b.y || a.x0 - b.x0); const merged = [];
  for (const s of surf) { const m = merged.find(q => Math.abs(q.y - s.y) < 1 && !!q.one === !!s.one && !!q.pad === !!s.pad && s.x0 <= q.x1 + 1 && s.x1 >= q.x0 - 1 && q.obj === s.obj); if (m) { m.x0 = Math.min(m.x0, s.x0); m.x1 = Math.max(m.x1, s.x1); } else merged.push({ ...s }); }
  merged.forEach((s, i) => s.id = i);
  const floorY = (c, r) => { const t = at(c, r + 1); return (r + 1) * T + ((t && TILES[t].top) || 0); };
  const spawnY = floorY(L.spawn[0], L.spawn[1]), spawnX = L.spawn[0] * T + 32;
  const start = merged.find(s => Math.abs(s.y - spawnY) < 2 && spawnX >= s.x0 && spawnX <= s.x1);
  const exitY = floorY(L.exit[0], L.exit[1]), exitX = L.exit[0] * T + 32;
  const goal = merged.find(s => Math.abs(s.y - exitY) < 2 && exitX >= s.x0 && exitX <= s.x1);
  if (!start) warn(L, 'spawn not on a surface'); if (!goal) warn(L, 'exit not on a surface');
  // jump graph
  const edge = (A, B) => { const dy = A.y - B.y, gap = Math.max(0, B.x0 - A.x1, A.x0 - B.x1);
    if (dy > 0 && !B.one && gap === 0 && !(A.x0 < B.x0 - 24 || A.x1 > B.x1 + 24)) return null;   /* would jump up through a solid underside */
    const jv = A.pad ? 1000 : PH.JV, ap = jv * jv / (2 * PH.G_UP); const mx = dxMax(dy, jv); if (mx < 0) return null; if (dy > ap - 8) return null; const need = Math.max(0, gap - 22); if (need > mx * .93) return null; return { ratio: need / mx, dy, gap }; };
  const adj = merged.map(() => []);
  for (const A of merged) for (const B of merged) if (A !== B) { if (A.obj === 'pot' && B.obj !== 'pot' && false) continue; const e = edge(A, B); if (e) adj[A.id].push([B.id, e]); }
  const seen = new Set(), prev = {}, best = {};   // minimax-ratio Dijkstra: easiest route, report its hardest hop
  if (start) { best[start.id] = 0; const open = [start.id]; while (open.length) { open.sort((a, b) => best[a] - best[b]); const a = open.shift(); if (seen.has(a)) continue; seen.add(a); for (const [b, e] of adj[a]) { const v = Math.max(best[a], e.ratio); if (best[b] === undefined || v < best[b]) { best[b] = v; prev[b] = [a, e]; open.push(b); } } } }
  const reachable = s => seen.has(s.id);
  if (goal && !reachable(goal)) warn(L, 'EXIT NOT REACHABLE from spawn');
  else if (goal) { // report hardest required hop on the path
    let hard = []; let cur = goal.id; while (prev[cur] !== undefined) { const [a, e] = prev[cur]; hard.push({ from: merged[a], to: merged[cur], e }); cur = a; }
    fs.writeFileSync(path.join(__dirname, `route_L${L.id}.json`), JSON.stringify(hard.map(h => ({ A: h.from, B: h.to, ratio: h.e.ratio })).reverse()));
    hard.sort((x, y) => y.e.ratio - x.e.ratio); const h = hard[0];
    if (h) note(`hardest shortest-path hop: gap ${(h.e.gap / T).toFixed(1)}t rise ${(h.e.dy / T).toFixed(2)}t  (${(h.e.ratio * 100).toFixed(0)}% of max reach)`);
  }
  // all stars/bag reachable? (stand on a reachable surface under/near)
  const reachAny = (x, y, rx, ry) => merged.some(s => reachable(s) && s.x1 > x - rx && s.x0 < x + rx && s.y > y - 20 && s.y - y < ry);
  L.stars.forEach(([c, r], i) => { const x = c * T + 32, y = r * T + 32; if (!reachAny(x, y, 100, 170) && !merged.some(s => s.pad && Math.abs((s.x0 + s.x1) / 2 - x) < 260 && s.y - y < 260 && s.y - y > -40) && !L.pottery.some(p => (p[2] || '').includes('t') && Math.abs(p[0] * T + 32 - x) < 70)) warn(L, `star #${i} (${c},${r}) maybe unreachable (no reachable surface within jump reach)`); });
  L.bags.forEach(([c, r]) => { const x = c * T + 32, y = r * T + 32; if (!reachAny(x, y, 100, 170)) warn(L, `bag (${c},${r}) maybe unreachable`); });
  // ---------- hazards geometry ----------
  const cactusBox = ([c, r]) => ({ x0: c * T + 14, x1: c * T + 50, y0: r * T + 12, y1: (r + 1) * T });
  const sawPts = s => { if (!s.a) return [[s.c * T + 32, s.r * T + 32]]; const o = []; for (let i = 0; i <= 24; i++) { const u = i / 24; o.push([(s.a[0] + (s.b[0] - s.a[0]) * u) * T + 32, (s.a[1] + (s.b[1] - s.a[1]) * u) * T + 32]); } return o; };
  const hazAt = (x0, x1, y0, y1, pad) => {   // returns first hazard within rect expanded by pad
    for (const k of L.cactus || L.cacti) { const b = cactusBox(k); if (b.x1 > x0 - pad && b.x0 < x1 + pad && b.y1 > y0 - pad && b.y0 < y1 + pad) return 'cactus ' + k; }
    for (const s of L.saws) for (const [px, py] of sawPts(s)) { const cx = Math.max(x0, Math.min(px, x1)), cy = Math.max(y0, Math.min(py, y1)); if (Math.hypot(px - cx, py - cy) < 23 + pad) return 'saw ' + JSON.stringify(s.a ? s.a : [s.c, s.r]); }
    for (const e of L.enemies) { const ex0 = e.min * T, ex1 = (e.max + 1) * T, ey0 = e.r * T - 10, ey1 = (e.r + 1) * T; if (ex1 > x0 - pad && ex0 < x1 + pad && ey1 > y0 - pad && ey0 < y1 + pad) return 'enemy ' + e.c; }
    return null; };
  const lane = (k, x0, x1, y0, y1) => { // cannon bullet lane (12 tiles, stops at solids) hits rect?
    const mx = k.dir < 0 ? k.c * T : (k.c + 1) * T, my = k.r * T + (k.size === 'small' ? 42 : 49); if (my + 14 < y0 || my - 14 > y1) return false;
    let x = mx; for (let i = 0; i < 96; i++) { x += k.dir * 8; if (solidAtPx(x, my)) return false; if (x > x0 && x < x1) return true; } return false; };
  const solidAtPx = (x, y) => { const c = Math.floor(x / T), r = Math.floor(y / T); const t = at(c, r); if (t && !TILES[t].deco && !TILES[t].one) { const b = boxOf(c, r); return x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1; } for (const k of L.cannons) if (x > k.c * T + 4 && x < k.c * T + 60 && y > k.r * T + 18 && y < (k.r + (k.size === 'small' ? 1 : 2)) * T) return true; return false; };
  const safeZone = (label, cx, bottomY, tiles) => {
    const x0 = cx - tiles * T, x1 = cx + tiles * T, y0 = bottomY - 120, y1 = bottomY;
    const h = hazAt(x0, x1, y0, y1, 0); if (h) warn(L, `${label} has hazard nearby: ${h}`);
    for (const k of L.cannons) if (lane(k, cx - 24, cx + 24, bottomY - 52, bottomY)) warn(L, `${label} is in the fire lane of cannon (${k.c},${k.r})`);
  };
  safeZone('SPAWN', spawnX, spawnY, 5);
  L.checkpoints.forEach(([c, r]) => { safeZone('checkpoint (' + c + ',' + r + ')', c * T + 32, floorY(c, r), 4); if (!merged.some(s => Math.abs(s.y - floorY(c, r)) < 2 && c * T + 32 >= s.x0 && c * T + 32 <= s.x1)) warn(L, `checkpoint (${c},${r}) not on a surface`); });
  // collectibles vs hazards / solids
  const pick = [...L.stars.map(s => ['star', s]), ...L.bags.map(s => ['bag', s]), ...L.items.map(i => [i.k, [i.c, i.r]])];
  for (const [n, [c, r]] of pick) {
    const x = c * T + 32, y = r * T + 32;
    if (solidT(c, r) || L.pottery.some(p => p[0] === c && p[1] === r && !(p[2] || '').includes('s'))) warn(L, `${n} (${c},${r}) inside solid`);
    const h = hazAt(x - 20, x + 20, y - 20, y + 20, 14); if (h) warn(L, `${n} (${c},${r}) too close to ${h}`);
    for (const k of L.cannons) if (lane(k, x - 20, x + 20, y - 20, y + 20) && n !== 'star') warn(L, `${n} (${c},${r}) in cannon lane`);
  }
  // entities must stand on something
  const floorUnder = (c, r) => stand(c, r + 1) || L.pottery.some(p => false);
  for (const k of L.cacti) if (!floorUnder(k[0], k[1])) warn(L, `cactus (${k}) floating`);
  for (const p of L.pottery) if (!floorUnder(p[0], p[1])) warn(L, `pottery (${p}) floating`);
  for (const k of L.cannons) { if (!(k.size === 'small' ? floorUnder(k.c, k.r) : solidT(k.c, k.r + 2))) warn(L, `cannon (${k.c},${k.r}) floating`); const fx = k.dir < 0 ? k.c - 1 : k.c + 1; if (solidT(fx, k.r) && k.size !== 'small') warn(L, `cannon (${k.c},${k.r}) muzzle blocked`); }
  for (const e of L.enemies) { for (let c = e.min; c <= e.max; c++) { if (!floorUnder(c, e.r)) warn(L, `enemy ${e.c}: no floor under col ${c}`); if (solidT(c, e.r) || solidT(c, e.r - 1) && e.k === 'green') warn(L, `enemy ${e.c}: wall in patrol col ${c}`); } if (e.c < e.min || e.c > e.max) warn(L, `enemy ${e.c} outside bounds`); }
  for (const s of L.saws) for (const [px, py] of sawPts(s)) { const c = Math.floor(px / T), r = Math.floor(py / T); for (const [dc, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const b = solidAtPx(px + dc * 20, py + dr * 20); if (b) { warn(L, `saw path overlaps solid near (${(px / T).toFixed(1)},${(py / T).toFixed(1)})`); break; } } }
  // cactus/saw landing adjacency: hazard within 1 tile of a platform edge
  for (const s of merged) { if (s.obj) continue; for (const k of L.cacti) { const b = cactusBox(k); if (Math.abs(b.y1 - s.y) < 2 && b.x0 > s.x0 - 8 && b.x1 < s.x1 + 8 && (b.x0 - s.x0 < 70 || s.x1 - b.x1 < 70) && s.x1 - s.x0 > 150) { /* hazard hugging an edge */ const edgeL = b.x0 - s.x0 < 70, edgeR = s.x1 - b.x1 < 70; const gapL = merged.some(o => o !== s && Math.abs(o.x1 - s.x0) < 260 && o.x1 <= s.x0 + 1 && edgeL), gapR = merged.some(o => o !== s && o.x0 >= s.x1 - 1 && o.x0 - s.x1 < 260 && edgeR); if (gapL || gapR) warn(L, `cactus ${k} hugs a platform edge next to a gap (landing hazard)`); } } }
  // level start: first hazard distance
  const firsts = [...L.cacti.map(k => k[0]), ...L.saws.map(s => s.c ?? s.a[0]), ...L.enemies.map(e => e.min), ...L.cannons.map(k => k.c)];
  if (firsts.length) note(`first hazard at tile ${Math.min(...firsts)} (spawn ${L.spawn[0]})`);
  note(`${merged.length} surfaces, ${seen.size} reachable; stars ${L.stars.length}${L.pottery.some(p => (p[2] || '').includes('s')) ? ' (incl. pottery)' : ''}`);
}
console.log(`\n${problems} problem(s)`); process.exit(problems ? 1 : 0);
