'use strict';
/* ============================== RENDERING ================================= */
const FONT = '"Segoe Print","Bradley Hand","Chalkboard SE","Comic Neue","Comic Sans MS","Marker Felt","Patrick Hand",cursive,sans-serif';
const THEMES = {   // every page has its own paper stock, ink colour, sky, ground material and mood
  class:     { paper: '#f7efd6', line: 'rgba(98,134,190,.26)', ink: 'rgba(70,84,120,.32)', vig: 'rgba(120,90,50,.13)', note: '#4a5b86', sky: 'rgba(255,226,140,.34)', dark: false },
  artillery: { paper: '#e8c79c', line: 'rgba(130,70,35,.30)', ink: 'rgba(95,45,25,.42)', vig: 'rgba(110,40,10,.32)', note: '#7a3418', sky: 'rgba(255,120,40,.34)', dark: false, grid: 'rgba(130,70,35,.12)' },
  bridge:    { paper: '#b9d7ee', line: 'rgba(255,255,255,.60)', ink: 'rgba(255,255,255,.75)', vig: 'rgba(15,55,110,.28)', note: '#0d3358', sky: 'rgba(255,255,255,.35)', dark: false, grid: 'rgba(255,255,255,.55)' },
  castle:    { paper: '#272b44', line: 'rgba(150,160,215,.13)', ink: 'rgba(205,215,255,.42)', vig: 'rgba(0,0,12,.55)', note: '#dfe4ff', sky: 'rgba(110,100,190,.30)', dark: true },
};
const hash = n => { n = (n | 0) * 2654435761 >>> 0; n ^= n >>> 15; n = Math.imul(n, 2246822519) >>> 0; return (n >>> 0) / 4294967296; };

const R_ = { canvas: null, ctx: null, scale: 1, grain: null, hatch: null, vig: {}, snap: null };

function initRender() {
  R_.canvas = $('game'); R_.ctx = R_.canvas.getContext('2d');
  // paper grain tile
  const g = document.createElement('canvas'); g.width = g.height = 200; const gx = g.getContext('2d'), id = gx.createImageData(200, 200);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random(); id.data[i] = v < .5 ? 90 : 255; id.data[i + 1] = v < .5 ? 70 : 250; id.data[i + 2] = v < .5 ? 40 : 235; id.data[i + 3] = Math.random() < .35 ? Math.floor(Math.random() * 16) : 0; }
  gx.putImageData(id, 0, 0); R_.grain = R_.ctx.createPattern(g, 'repeat');
  // pencil hatch for inner ground
  const h = document.createElement('canvas'); h.width = h.height = 16; const hx = h.getContext('2d');
  hx.strokeStyle = 'rgba(60,60,80,.22)'; hx.lineWidth = 1.6; hx.lineCap = 'round'; hx.beginPath(); hx.moveTo(-2, 14); hx.lineTo(14, -2); hx.moveTo(6, 18); hx.lineTo(18, 6); hx.stroke();
  R_.hatch = R_.ctx.createPattern(h, 'repeat');
  { const ht = document.createElement('canvas'); ht.width = ht.height = 56; const hg = ht.getContext('2d'); hg.fillStyle = hg.createPattern(h, 'repeat'); hg.fillRect(0, 0, 56, 56); R_.hatchTile = ht; }
  R_.snap = document.createElement('canvas');
  resize();
}
function resize() {
  const stage = $('stage'), w = window.innerWidth, h = window.innerHeight;
  const s = Math.min(w / VW, h / VH); R_.fit = s;
  stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  const dpr = Math.min(window.devicePixelRatio || 1, Quality.level === 0 ? 1 : IS_COARSE ? 1.5 : 2), k = Math.min(s * dpr, Quality.level === 0 ? 1.0 : IS_COARSE ? 1.35 : 2.2);
  const zoomOut = DEVICE.touch ? clamp(w / (w > h ? DEVICE.smax : DEVICE.smin), 1, 2.6) : 1, sp = s / zoomOut; R_.zoomOut = zoomOut; stage.style.setProperty('--zo', zoomOut);
  const hs = clamp(.8 / sp, 1, 2.1), us = clamp(.85 / sp, 1, 1.7); R_.hs = hs; stage.style.setProperty('--hs', hs); stage.style.setProperty('--us', us); stage.style.setProperty('--cs', clamp(.85 / sp, 1, 1.1));
  R_.scale = k; R_.canvas.width = Math.round(VW * k); R_.canvas.height = Math.round(VH * k);
  R_.vig = {};
}

const IMG = (n, x, y, w = 64, h = w) => { const i = IM[n]; if (i) R_.ctx.drawImage(i, x, y, w, h); };
function txt(s, x, y, size, o = {}) {
  const c = R_.ctx; c.font = (o.weight || 'bold') + ' ' + size + 'px ' + FONT; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
  if (o.out !== false) { c.lineJoin = 'round'; c.lineWidth = o.ow || Math.max(3, size * .24); c.strokeStyle = o.oc || COLORS.paper; c.strokeText(s, x, y); }
  c.fillStyle = o.color || COLORS.ink; c.fillText(s, x, y);
}
function inkLine(c, x0, y0, x1, y1, w = 2.5) { c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }

/* ----------------------------- background ------------------------------- */
function drawPaper(th, camX, camY, clock) {
  const c = R_.ctx, T_ = THEMES[th];
  c.fillStyle = T_.paper; c.fillRect(0, 0, VW, VH);
  let sg = R_.sky && R_.sky[th]; if (!sg) { (R_.sky = R_.sky || {}); sg = R_.sky[th] = c.createLinearGradient(0, 0, 0, VH * .75); sg.addColorStop(0, T_.sky); sg.addColorStop(1, 'rgba(255,255,255,0)'); } c.fillStyle = sg; c.fillRect(0, 0, VW, VH * .75);
  c.strokeStyle = T_.line; c.lineWidth = 1.4; c.beginPath();
  const off = -(camY % 32);          // ruled lines are locked to the world (tile edges), so text and objects sit ON the page
  for (let y = off; y < VH; y += 32) { c.moveTo(0, y); c.lineTo(VW, y); }
  c.stroke();
  if (T_.grid) { c.strokeStyle = T_.grid; c.lineWidth = 1.2; c.beginPath(); const ox = -(camX % 64); for (let x = ox; x < VW; x += 64) { c.moveTo(x, 0); c.lineTo(x, VH); } c.stroke(); }
}
function drawPaperFinish(th) {
  const c = R_.ctx, T_ = THEMES[th];
  c.globalAlpha = 1; if (Quality.level >= 2) { c.fillStyle = R_.grain; c.fillRect(0, 0, VW, VH); }
  if (Quality.level < 1) return;
  let v = R_.vig[th];
  if (!v) { v = R_.vig[th] = c.createRadialGradient(VW / 2, VH / 2, VH * .45, VW / 2, VH / 2, VW * .72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, T_.vig); }
  c.fillStyle = v; c.fillRect(0, 0, VW, VH);
}
function drawMargin(camX, camY) {
  const c = R_.ctx, x = 40 - camX;
  if (x < -20 || x > VW) return;
  c.strokeStyle = 'rgba(201,84,79,.55)'; c.lineWidth = 2.2; inkLine(c, x, 0, x, VH, 2.2); inkLine(c, x + 7, 0, x + 7, VH, 1.6);
  // punched holes just inside the margin
  c.fillStyle = 'rgba(60,50,40,.18)'; for (let y = (((90 - camY) % 192) + 192) % 192; y < VH; y += 192) { c.beginPath(); c.arc(x - 22, y, 9, 0, 6.3); c.fill(); }
}

function doodle(th, id, x, y, f, clock) {
  const c = R_.ctx, ink = THEMES[th].ink; c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = 2.6; c.lineCap = 'round'; c.lineJoin = 'round';
  const text = (s, sz = 26, rot = -.04) => { c.save(); c.translate(x, y); c.rotate(rot); c.font = sz + 'px ' + FONT; c.fillText(s, 0, 0); c.restore(); };
  if (th === 'class') {
    switch (id % 8) {
      case 0: text('x² + 3x − 10 = 0', 30); break;
      case 1: text('a² + b² = c²', 34, .03); break;
      case 2: c.beginPath(); c.arc(x, y, 26, 0, 6.3); c.stroke(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; inkLine(c, x + Math.cos(a) * 34, y + Math.sin(a) * 34, x + Math.cos(a) * 48, y + Math.sin(a) * 48, 2.4); } break;
      case 3: inkLine(c, x, y - 70, x, y + 50); inkLine(c, x - 50, y + 30, x + 120, y + 30); c.beginPath(); c.moveTo(x - 30, y - 50); c.quadraticCurveTo(x + 30, y + 90, x + 100, y - 50); c.stroke(); break;
      case 4: c.strokeRect(x, y, 200, 34); for (let i = 0; i <= 20; i++) inkLine(c, x + i * 10, y, x + i * 10, y + (i % 5 === 0 ? 18 : 10), 1.8); break;
      case 5: text('2 + 2 = 4', 30); inkLine(c, x + 6, y + 10, x + 150, y + 14); break;
      case 6: c.beginPath(); c.arc(x, y, 18, 3.1, 6.3); c.arc(x + 26, y - 6, 24, 3.2, 6.1); c.arc(x + 56, y, 18, 3.4, 6.4); c.closePath(); c.stroke(); break;
      case 7: IMG('triangle:bg', x, y - 40, 110, 110); break;
    }
  } else if (th === 'artillery') {
    switch (id % 7) {
      case 0: c.setLineDash([8, 9]); c.beginPath(); c.moveTo(x, y + 60); c.quadraticCurveTo(x + 150, y - 110, x + 300, y + 60); c.stroke(); c.setLineDash([]); text('45°', 28); break;
      case 1: c.beginPath(); c.arc(x, y, 34, 0, 6.3); c.stroke(); c.beginPath(); c.arc(x, y, 16, 0, 6.3); c.stroke(); inkLine(c, x - 50, y, x + 50, y); inkLine(c, x, y - 50, x, y + 50); break;
      case 2: text('v₀ = ?   θ = ?', 30); break;
      case 3: text('target practice', 28, .04); break;
      case 4: c.beginPath(); c.moveTo(x, y); for (let i = 1; i <= 12; i++) { const a = i / 12 * 6.28, r = i % 2 ? 34 : 18; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.stroke(); text('BOOM', 20, .1); break;
      case 5: for (let i = 0; i < 5; i++) inkLine(c, x, y + i * 26, x + 190, y + i * 26, 1.8); for (let i = 0; i < 5; i++) inkLine(c, x + i * 48, y, x + i * 48, y + 104, 1.8); break;
      case 6: text('range = v² sin2θ / g', 24); break;
    }
  } else if (th === 'bridge') {
    switch (id % 6) {
      case 0: c.beginPath(); c.arc(x, y, 20, 3.1, 6.3); c.arc(x + 30, y - 6, 28, 3.2, 6.1); c.arc(x + 64, y, 20, 3.4, 6.4); c.closePath(); c.stroke(); break;
      case 1: for (let i = 0; i < 3; i++) { const bx = x + i * 38, by = y + (i % 2) * 20, w = Math.sin(clock * 3 + i) * 3; c.beginPath(); c.moveTo(bx - 14, by - 4 + w); c.quadraticCurveTo(bx - 6, by - 12, bx, by); c.quadraticCurveTo(bx + 6, by - 12, bx + 14, by - 4 + w); c.stroke(); } break;
      case 2: c.globalAlpha = .26; for (let i = 0; i < 3; i++) IMG('bridge_arch_large:s', x + i * 120, y, 128, 128); c.globalAlpha = 1; break;
      case 3: text('span = ?', 30); break;
      case 4: c.beginPath(); c.arc(x, y, 24, 0, 6.3); c.stroke(); break;
      case 5: text('load ≤ 2 tons', 26, .05); break;
    }
  } else {
    switch (id % 6) {
      case 0: c.beginPath(); c.arc(x, y, 30, 0, 6.3); c.stroke(); c.beginPath(); c.arc(x + 14, y - 6, 26, 0, 6.3); c.fillStyle = THEMES.castle.paper; c.fill(); c.stroke(); break;
      case 1: for (let i = 0; i < 3; i++) { const bx = x + i * 44, by = y + (i % 2) * 24; c.beginPath(); c.moveTo(bx - 16, by - 6); c.lineTo(bx - 8, by + 4); c.lineTo(bx, by - 2); c.lineTo(bx + 8, by + 4); c.lineTo(bx + 16, by - 6); c.stroke(); } break;
      case 2: c.globalAlpha = .3; IMG('tower:s', x, y - 40, 96, 96); IMG('tower_top:s', x - 6, y - 98, 108, 108); c.globalAlpha = 1; break;
      case 3: text('DETENTION', 30, -.05); break;
      case 4: for (let i = 0; i < 5; i++) { const sx = x + i * 40, sy = y + ((i * 37) % 50); inkLine(c, sx - 6, sy - 6, sx + 6, sy + 6, 2); inkLine(c, sx + 6, sy - 6, sx - 6, sy + 6, 2); } break;
      case 5: c.globalAlpha = .26; IMG('castle:s', x, y - 30, 120, 120); c.globalAlpha = 1; break;
    }
  }
}
function drawDoodles(th, camX, camY, clock) {
  const c = R_.ctx;
  for (const L of (Quality.level < 1 ? [{ f: .32, gap: 560, y0: 60, ys: 150, a: .8, k: 0 }] : [{ f: .32, gap: 560, y0: 60, ys: 150, a: .8, k: 0 }, { f: .55, gap: 760, y0: 230, ys: 160, a: 1, k: 100 }])) {
    const i0 = Math.floor((camX * L.f) / L.gap) - 1, n = Math.ceil(VW / L.gap) + 3;
    for (let i = i0; i < i0 + n; i++) {
      const hx = hash(i * 7 + L.k), x = i * L.gap + hx * 240 - camX * L.f, y = L.y0 + hash(i * 13 + L.k) * L.ys - camY * .2;
      if (x < -380 || x > VW + 40) continue;
      c.globalAlpha = L.a; doodle(th, Math.floor(hash(i * 3 + L.k + 1) * 97), x, y, L.f, clock); c.globalAlpha = 1;
    }
  }
}
function drawRiver(camY, clock) {
  const c = R_.ctx, base = G.world.py - 6 - camY + 30; c.strokeStyle = 'rgba(70,120,170,.45)'; c.lineWidth = 2.4;
  for (let k = 0; k < 4; k++) {
    const y = base + k * 22; c.beginPath();
    for (let x = -20; x <= VW + 20; x += 16) { const yy = y + Math.sin((x + Cam.x * .5) * .03 + clock * (1 + k * .3) + k * 2) * 4; x === -20 ? c.moveTo(x, yy) : c.lineTo(x, yy); }
    c.stroke();
  }
  c.fillStyle = 'rgba(130,170,205,.14)'; c.fillRect(0, base - 6, VW, VH);
}

/* ------------------------------- tiles ----------------------------------- */
function drawTiles(W, camX, camY) {
  const th0 = G.theme || W.def.theme, TS = { class: { ground: ['block', 'block:in'] }, artillery: { ground: ['block_metal:a', 'block_metal:a_in'], plank: 'plank_metal:a' }, bridge: { ground: ['block:b', 'block:b_in'] }, castle: { ground: ['block:c', 'block:c_in'] } }[th0] || { ground: ['block', 'block:in'] };
  const c = R_.ctx, c0 = Math.max(0, Math.floor(camX / T) - 1), c1 = Math.min(W.w - 1, Math.floor((camX + VW) / T) + 1), r0 = Math.max(0, Math.floor(camY / T) - 1), r1 = Math.min(W.h - 1, Math.floor((camY + VH) / T) + 1);
  // pass 1: background architecture (deco tiles, lighter)
  for (let r = r0; r <= r1; r++) for (let q = c0; q <= c1; q++) {
    const t = W.grid[r * W.w + q]; if (!t) continue; const d = TILES[t]; if (!d.deco) continue;
    if (t === 'b') { if (q > c0 && W.at(q - 1, r) === 'b') continue; let run = 1; while (q + run <= c1 && W.at(q + run, r) === 'b') run++;
      if (W.at(q, r - 1) !== 'b') { c.globalAlpha = .55; for (let k = 0; k < run; k++) IMG('castle:s', (q + k) * T, r * T - 56); c.globalAlpha = 1; }
      c.fillStyle = 'rgba(110,100,90,.17)'; c.fillRect(q * T, r * T, run * T + 1, T + 1); c.globalAlpha = .55; c.fillStyle = R_.hatch; c.fillRect(q * T, r * T, run * T + 1, T + 1); c.globalAlpha = 1; continue; }
    c.globalAlpha = (t === 'P' || t === 'I') ? .95 : .6; IMG(d.img, q * T, r * T); c.globalAlpha = 1;
  }
  // pass 2: soft drop shadows for solids
  c.fillStyle = 'rgba(70,50,30,.17)';
  for (let r = r0; r <= r1; r++) for (let q = c0; q <= c1; q++) {
    const t = W.grid[r * W.w + q]; if (!t) continue; const d = TILES[t]; if (d.deco) continue;
    if (d.one) { c.fillRect(q * T + 3, r * T + (d.top || 0) + 6, T, d.th + 2); continue; }
    if (W.at(q, r + 1) && !TILES[W.at(q, r + 1)].deco && W.at(q + 1, r) && !TILES[W.at(q + 1, r)].deco) continue;
    c.fillRect(q * T + 6, r * T + (d.top || 0) + 7, T, T - (d.top || 0));
  }
  // pass 3: solids
  for (let r = r0; r <= r1; r++) for (let q = c0; q <= c1; q++) {
    const t = W.grid[r * W.w + q]; if (!t) continue; const d = TILES[t]; if (d.deco) continue;
    const above = W.at(q, r - 1), aboveSolid = above && !TILES[above].deco && !TILES[above].one;
    let img = d.img, inner = false;
    if (t === '#') img = TS.ground[0]; else if (t === '=' && TS.plank) img = TS.plank;
    if (t === '#' && aboveSolid) { img = TS.ground[1]; inner = true; }
    if (t === 'C' && aboveSolid) { img = 'block:in2'; inner = true; }
    if (d.crumble) { const ct = G.crumble.get(r * W.w + q); const jx = ct !== undefined ? (Math.random() - .5) * 4 : 0; IMG(img, q * T + jx, r * T + (ct !== undefined ? (.5 - ct) * 6 : 0)); c.strokeStyle = 'rgba(60,40,30,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(q * T + 18, r * T + 6); c.lineTo(q * T + 28, r * T + 18); c.lineTo(q * T + 22, r * T + 24); c.moveTo(q * T + 44, r * T + 4); c.lineTo(q * T + 38, r * T + 16); c.stroke(); continue; }
    if (d.bounce) { const pt = G.pads.get(r * W.w + q); const k = pt ? Math.sin(pt / .35 * Math.PI) * .22 : 0; c.save(); c.translate(q * T + 32, (r + 1) * T); c.scale(1 + k * .6, 1 - k); IMG(img, -32, -64, 64); c.restore(); c.strokeStyle = 'rgba(70,140,220,.9)'; c.lineWidth = 3; c.lineCap = 'round'; const ay = r * T - 14 - Math.sin(performance.now() / 180) * 4; c.beginPath(); c.moveTo(q * T + 22, ay + 8); c.lineTo(q * T + 32, ay - 2); c.lineTo(q * T + 42, ay + 8); c.stroke(); continue; }
    IMG(img, q * T, r * T);
    if (inner) c.drawImage(R_.hatchTile, q * T + 4, r * T + 4);
  }
}

/* ----------------------------- world objects ----------------------------- */
function drawShadowBlob(x, y, w, a = .2) { const c = R_.ctx; c.fillStyle = 'rgba(60,40,20,' + a + ')'; c.beginPath(); c.ellipse(x, y, w, w * .22, 0, 0, 6.3); c.fill(); }
const _glow = {};
function glow(x, y, r, col, a) {
  if (Quality.level < 1) return;
  a = Math.round(a * 20) / 20; r = Math.round(r / 4) * 4; const k = col + a + r; let cv = _glow[k];
  if (!cv) { cv = _glow[k] = document.createElement('canvas'); cv.width = cv.height = r * 2; const g = cv.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); }
  R_.ctx.drawImage(cv, x - r, y - r);
}

function drawObjects(clock) {
  const c = R_.ctx, W = G.world, camX = Cam.x, camY = Cam.y, vis = (x, w = 64) => x + w > camX - 40 && x < camX + VW + 40;
  // door + checkpoints (architecture layer)
  const d = G.door, dx = d.c * T, dy = d.y;
  if (d.open > 0) glow(dx + 32, dy + 34, 110, 'rgba(255,214,110,A)', .55 * d.open);
  c.globalAlpha = 1; IMG('doorway_closed:w', dx, dy); if (d.open > 0) { c.globalAlpha = d.open; IMG('doorway_open:w', dx, dy); c.globalAlpha = 1; }
  if (d.open >= 1 && G.state === 'play') { const b = Math.sin(clock * 5) * 4; c.strokeStyle = COLORS.margin; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(dx + 32, dy - 20 + b); c.lineTo(dx + 32, dy - 40 + b); c.moveTo(dx + 24, dy - 28 + b); c.lineTo(dx + 32, dy - 18 + b); c.lineTo(dx + 40, dy - 28 + b); c.stroke(); }
  for (const cp of G.cps) {
    if (!vis(cp.x - 32)) continue;
    if (cp.on) glow(cp.x, cp.y - 32, 70, 'rgba(255,200,70,A)', .5 + .12 * Math.sin(cp.t * 4));
    drawShadowBlob(cp.x, cp.y - 2, 24, .18); IMG(cp.on ? 'obelisk:on' : 'obelisk:off', cp.x - 32, cp.y - 64);
    if (cp.on) { c.strokeStyle = COLORS.yellow; c.lineWidth = 3; const a = cp.t * 2; for (let i = 0; i < 3; i++) { const aa = a + i * 2.09; inkLine(c, cp.x + Math.cos(aa) * 40, cp.y - 34 + Math.sin(aa) * 40, cp.x + Math.cos(aa) * 48, cp.y - 34 + Math.sin(aa) * 48, 3); } }
  }
  // pottery
  for (const q of G.pottery) if (q.alive && vis(q.c * T)) { drawShadowBlob(q.c * T + 32, (q.r + 1) * T - 1, 22, .18); IMG(q.tall ? 'pottery_tall:t' : 'pottery:t', q.c * T, q.r * T + 1); }
  // curtain gates (cut them with the sword)
  for (const d of G.drapes) if (d.alive && vis(d.c * T)) {
    const sw = Math.sin(clock * 1.6 + d.sway) * 3; c.save(); c.translate(d.c * T + 32, d.r * T); c.transform(1, 0, sw * .012, 1, 0, 0);
    drawShadowBlob(0, d.h * T - 1, 26, .16); IMG('drapes:r', -32 + 2, 0, 60, d.h * T); if (d.lock) { c.fillStyle = 'rgba(217,54,62,.42)'; c.fillRect(-28, 0, 56, d.h * T); c.strokeStyle = '#8f1d26'; c.lineWidth = 4; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-26, i * 50 - 10); c.lineTo(26, i * 50 + 30); c.stroke(); } } c.restore();
    // (the 'press X' prompt is drawn by drawPrompts)
  }
  // moving planks (with a dotted rail so the motion is readable)
  for (const m of G.movers) {
    const x0 = m.c * T, x1 = m.c * T + (m.ax === 'x' ? m.rng * T : 0) + m.w * T, y0 = m.r * T + 22, y1 = m.r * T + (m.ax === 'y' ? m.rng * T : 0) + 22; if (x1 < camX - 60 || x0 > camX + VW + 60) continue;
    c.strokeStyle = 'rgba(60,60,80,.28)'; c.lineWidth = 2.5; c.setLineDash([3, 9]); c.lineCap = 'round'; c.beginPath(); c.moveTo(x0 + 8, y0); c.lineTo(x1 - 8, y1); c.stroke(); c.setLineDash([]);
    const pl = (G.theme || G.world.def.theme) === 'artillery' ? 'plank_metal:a' : 'plank:w'; for (let k = 0; k < m.w; k++) IMG(pl, m.x + k * T, m.y);
    c.fillStyle = 'rgba(70,50,30,.15)'; c.fillRect(m.x + 3, m.y + 22, m.w * T, 14);
  }
  // pot party
  for (const rn of G.rains) for (const o of rn.pots) {
    const gx = o.c * T + 32, gy2 = G.world.floorY(o.c, rn.r);
    if (o.st === 'shadow') { const u = clamp(1 - o.t / 1, 0, 1); c.fillStyle = 'rgba(217,54,62,' + (.15 + u * .3) + ')'; c.beginPath(); c.ellipse(gx, gy2 - 2, 14 + u * 14, 4 + u * 3, 0, 0, 6.3); c.fill(); txt('!', gx, gy2 - 22, 22, { align: 'center', color: '#d9363e' }); }
    else if (o.st === 'fall' || o.st === 'land') { c.save(); c.translate(gx, o.y + 28); c.rotate(o.st === 'fall' ? Math.sin(o.rot) * .4 : 0); IMG('pottery:t', -32, -28, 64); c.restore(); }
  }
  // hazards: cactus
  for (const k of G.cacti) if (vis(k.c * T)) { drawShadowBlob(k.c * T + 32, (k.r + 1) * T - 1, 24, .2); IMG('cactus:g', k.c * T, k.r * T + 1); }
  // saws (rails first)
  for (const s of G.saws) if (s.a) {
    const ax = s.a[0] * T + 32, ay = s.a[1] * T + 32, bx = s.b[0] * T + 32, by = s.b[1] * T + 32;
    if (Math.max(ax, bx) + 40 < camX || Math.min(ax, bx) - 40 > camX + VW) continue;
    c.strokeStyle = 'rgba(60,60,80,.35)'; c.lineWidth = 2.5; c.setLineDash([3, 9]); c.lineCap = 'round'; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(60,60,80,.45)'; for (const [px, py] of [[ax, ay], [bx, by]]) { c.beginPath(); c.arc(px, py, 5, 0, 6.3); c.fill(); }
  }
  for (const s of G.saws) if (vis(s.x - 32)) { c.save(); c.translate(s.x, s.y + 2); c.rotate(s.rot); IMG('sawblade:s', -30, -30, 60, 60); c.restore(); }
  // cannons (aimed ones swivel to track you, then lock)
  for (const k of G.cannons) {
    if (!vis(k.x)) continue;
    const warnU = k.warned ? clamp((k.t - (k.interval - k.warn)) / k.warn, 0, 1) : 0;
    const jit = k.warned ? Math.sin(clock * 60) * (.5 + warnU * 1.2) : 0, fl = 1 + k.flash * .08;
    const rel = k.dir < 0 ? Math.atan2(Math.sin(k.ang), -Math.cos(k.ang)) : k.ang;
    if (k.size !== 'small') { c.save(); c.translate(k.x + 32, 0); if (k.dir < 0) c.scale(-1, 1); IMG('cannon_base:s', -32, k.y + 64); c.restore(); }
    c.save(); c.translate(k.x + 32 + jit, k.my); if (k.dir < 0) c.scale(-1, 1); c.rotate(rel); c.scale(fl, fl);
    IMG(k.size === 'small' ? 'cannon_small:s' : 'cannon_large:s', -32, -32, 64); c.restore();
    if (k.warned) {         // aim line + alert
      const ca = Math.cos(k.ang), sa = Math.sin(k.ang); let x = k.mx + ca * 20, y = k.my + sa * 20, steps = 0, locked = !k.aim || k.t >= k.interval - .3;
      c.strokeStyle = 'rgba(217,54,62,' + (locked ? .9 : .25 + .5 * warnU) + ')'; c.lineWidth = locked ? 4 : 3; c.setLineDash(locked ? [10, 6] : [2, 12]); c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y);
      while (steps < 130 && !W.solidAt(x + ca * 10, y + sa * 10)) { x += ca * 8; y += sa * 8; steps++; if (Math.hypot(x - k.mx, y - k.my) > 11 * T) break; } c.lineTo(x, y); c.stroke(); c.setLineDash([]);
      const ax = k.x + 32, ay = k.y - 12; c.fillStyle = locked ? '#b01822' : '#d9363e'; c.beginPath(); c.arc(ax, ay, locked ? 13 : 11, 0, 6.3); c.fill(); txt('!', ax, ay + 7, 20, { align: 'center', color: '#fff', out: false });
    }
  }
  // collectibles
  for (const s of G.stars) {
    if (s.taken || s.hidden || !vis(s.x - 32)) continue;
    const b = Math.sin(clock * 3 + s.ph) * 4, sc = 1 + Math.sin(clock * 5 + s.ph) * .04 + (s.pop > 0 ? s.pop * 1.2 : 0);
    glow(s.x, s.y + b, 44, 'rgba(255,200,60,A)', .38);
    c.save(); c.translate(s.x, s.y + b); c.rotate(Math.sin(clock * 2 + s.ph) * .12); c.scale(sc, sc); IMG('star:gold', -27, -27, 54); c.restore();
  }
  if (G.bag && !G.bag.taken && vis(G.bag.x - 32)) {
    const b = G.bag, bob = Math.sin(clock * 2.6) * 4; glow(b.x, b.y + bob, 54, 'rgba(255,214,120,A)', .4); IMG('bag:t', b.x - 29, b.y - 29 + bob, 58);
    if (Math.sin(clock * 2.2) > .8) { c.fillStyle = '#fff'; const tw = (Math.sin(clock * 2.2) - .8) * 5; inkLine(c, b.x + 20 - 8 * tw, b.y - 22, b.x + 20 + 8 * tw, b.y - 22, 3); inkLine(c, b.x + 20, b.y - 22 - 8 * tw, b.x + 20, b.y - 22 + 8 * tw, 3); }
  }
  for (const it of G.items) if (!it.taken && vis(it.x - 32)) {
    const bob = Math.sin(clock * 3 + it.ph) * 4; glow(it.x, it.y + bob, 50, it.k === 'shield' ? 'rgba(110,180,255,A)' : it.k === 'heart' ? 'rgba(255,90,100,A)' : 'rgba(255,255,255,A)', .5);
    if (it.k === 'heart') { c.save(); c.translate(it.x, it.y + bob); const hs = 1 + Math.sin(clock * 6) * .08; c.scale(hs, hs); heart(c, 0, -2, 18, COLORS.red); c.restore(); }
    else if (it.k === 'shield') IMG('item_shield:b', it.x - 28, it.y - 28 + bob, 56); else { c.save(); c.translate(it.x, it.y + bob); c.rotate(.5 + Math.sin(clock * 2) * .08); IMG('item_sword:s', -30, -32, 60); c.restore(); }
  }
  // enemies
  for (const e of G.enemies) {
    if (!vis(e.x - 40)) continue;
    if (e.spawnT > 0) { const u = clamp(1 - e.spawnT / 1.15, 0, 1); c.fillStyle = 'rgba(217,54,62,' + (.18 + u * .32) + ')'; c.beginPath(); c.ellipse(e.x, e.base - 2, 16 + u * 26, 5 + u * 5, 0, 0, 6.3); c.fill(); txt('!', e.x, e.base - 30 - Math.sin(clock * 14) * 3, 26, { align: 'center', color: '#d9363e' }); continue; }
    if (!e.alive) {
      if (e.dead < .9) {      // knocked-out spin: flies off, paper-thin and fading
        const t = e.dead, green = e.k === 'green', sz = green ? 80 : e.k === 'flyer' ? 66 : 58;
        c.save(); c.globalAlpha = 1 - t / .9; c.translate(e.x + e.dvx * t, e.base - (green ? 30 : 22) - 260 * t + 900 * t * t); c.rotate(t * 11 * Math.sign(e.dvx)); c.scale(1 + t * .3, 1 - t * .4);
        IMG(green ? 'character_rectangle_green' : e.k === 'flyer' ? 'character_rectangle_purple' : e.k === 'yellow' ? 'character_round_yellow' : 'character_round_purple', -sz / 2, -sz / 2, sz); c.restore(); c.globalAlpha = 1;
      }
      continue;
    }
    const bx = e.x, by = e.base - e.hopY, green = e.k === 'green', sz = e.boss ? (green ? 150 : 124) : green ? 80 : e.k === 'flyer' ? 66 : 58, bob = e.hopY ? 0 : Math.abs(Math.sin(e.walk)) * 2.5;
    if (!e.hopY) drawShadowBlob(bx, e.base - 1, sz * .38, .2); else drawShadowBlob(bx, e.base - 1, sz * .3, .12);
    let sx = 1 + e.sq * .25, sy = 1 - e.sq * .22;
    if (e.hopY) { sy = 1.1; sx = .93; }
    c.save(); c.translate(bx + (e.stun > 0 ? Math.sin(clock * 50) * 2 : 0), by + 3 - bob); c.scale(sx, sy);
    if (e.flash > .5) c.globalAlpha = .75;
    if (e.k === 'flyer') { const fl = Math.sin(clock * 22 + e.c) * .5 + .5; c.strokeStyle = COLORS.ink; c.fillStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2.6; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 30, -sz * .55 - fl * 8, 16, 7 + fl * 5, s * (.5 + fl * .5), 0, 6.3); c.fill(); c.stroke(); } IMG('character_rectangle_purple', -sz / 2, -sz + 4, sz); }
    else if (green) { IMG('character_rectangle_green', -sz / 2, -sz + 4, sz); } else if (e.k === 'yellow') { c.rotate(Math.sin(e.walk) * .06 + (e.cs === 'dash' ? .22 * e.dir : 0)); IMG('character_round_yellow', -sz / 2, -sz + 3, sz); if (e.cs === 'wind') txt('!', 0, -sz - 6, 26, { align: 'center', color: '#d9363e' }); } else { c.rotate(Math.sin(e.walk) * .06); IMG('character_round_purple', -sz / 2, -sz + 3, sz); }
    c.restore(); c.globalAlpha = 1;
    if (green && !e.boss) { for (let i = 0; i < 2; i++) { c.fillStyle = i < e.hp ? COLORS.green : 'rgba(60,60,60,.25)'; c.strokeStyle = COLORS.ink; c.lineWidth = 2; c.beginPath(); c.arc(bx - 9 + i * 18, by - e.h - 12, 5.5, 0, 6.3); c.fill(); c.stroke(); } }
    if (e.stun > 0) { for (let i = 0; i < 3; i++) { const a = clock * 6 + i * 2.1; IMG('star:gold', bx + Math.cos(a) * 20 - 7, by - e.h - 8 + Math.sin(a) * 6 - 7, 14); } }
  }
  // the eraser (chase)
  if (G.chase.active) {
    const ex = G.chase.x, y0 = Cam.y - 30, hh = VH + 60, w0 = 300;
    const gr = c.createLinearGradient(ex - w0 - 140, 0, ex - w0, 0); gr.addColorStop(0, 'rgba(245,237,216,0)'); gr.addColorStop(1, 'rgba(245,237,216,.96)'); c.fillStyle = gr; c.fillRect(ex - w0 - 140, y0, 140, hh);
    c.fillStyle = '#f2a1ad'; c.strokeStyle = COLORS.ink; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); c.rect(ex - w0, y0, w0, hh); c.fill(); c.stroke();
    c.fillStyle = '#6e8fd1'; c.fillRect(ex - 120, y0, 120, hh); c.strokeRect(ex - 120, y0, 120, hh);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(ex - w0 + 16, y0, 22, hh);
    c.fillStyle = COLORS.ink; for (let i = 0; i < 9; i++) { const yy = y0 + ((i * 97 + clock * 40) % hh); c.beginPath(); c.arc(ex + 10 + (i % 3) * 8, yy, 4 + (i % 3), 0, 6.3); c.fill(); }
    txt('ERASER', ex - 205, Cam.y + VH / 2, 40, { align: 'center', color: '#8f3d4b', ow: 0, out: false });
  }
  // bullets
  for (const b of G.bullets) {
    if (!vis(b.x - 32)) continue;
    c.save(); c.translate(b.x, b.y); if (!b.wave) { c.rotate(Math.atan2(b.vy || 0, b.vx)); if (b.vx < 0) c.scale(1, -1); } else if (b.dir < 0) c.scale(-1, 1); if (b.wave) { c.fillStyle = COLORS.purple; c.strokeStyle = COLORS.ink; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 14, 20, 0, 0, 6.3); c.fill(); c.stroke(); } else IMG('bullet:d', -22, -22, 44); if (b.friendly) { c.strokeStyle = COLORS.yellow; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 26, 0, 6.3); c.stroke(); } c.restore();
  }
}

/* -------------------------------- player -------------------------------- */
function drawPlayer(clock) {
  const p = G.player, c = R_.ctx, st = G.state;
  if (st === 'dying' && G.deathT > FREEZE_T) return;
  if (st === 'play') for (let i = 0; i < G.trail.length - 1; i++) { const t = G.trail[i], k = (i + 1) / G.trail.length; if (t.a < .35) continue; c.globalAlpha = .06 + k * .16 * t.a; c.save(); c.translate(t.x, t.y + 5); c.scale(.8 + k * .2, .8 + k * .2); IMG(skinImg(), -32, -64, 64); c.restore(); }
  c.globalAlpha = 1;
  const cx = p.x + p.w / 2, bot = p.y + p.h + 5;
  if (p.inv > 0 && st === 'play' && Math.floor(clock * 14) % 2 === 0) c.globalAlpha = .45;
  // ground shadow
  let gy = p.y + p.h, n = 0; while (n < 40 && !G.world.solidAt(cx, gy + 1) && !isOneWayBelow(cx, gy + 1)) { gy += 6; n++; }
  if (n < 40) drawShadowBlob(cx, gy + 1, 22 - n * .3, Math.max(.05, .22 - n * .005));
  let sx = p.scx, sy = p.scy, a = 1;
  if (p.popIn > 0) { sx *= 1; }
  if (p.win) { const u = clamp((G.winT - .5) / .45, 0, 1); sx *= 1 - u * .5; sy *= 1 - u * .5; a = 1 - u; }
  if (st === 'dying') { sx = 1.35; sy = .7; }
  c.save(); c.globalAlpha *= a; c.translate(cx, bot); c.rotate(p.lean + (p.onGround ? Math.sin(p.walkT) * .05 : 0)); c.scale(sx, sy);
  const bob = p.onGround && Math.abs(p.vx) > 20 ? -Math.abs(Math.sin(p.walkT)) * 3 : 0;
  IMG(skinImg(), -32, -64 + bob, 64);
  c.restore(); c.globalAlpha = 1;
  // held shield (front arm) — the real shield sprite; it shatters when it takes a hit
  if (p.shield && st !== 'dying') {
    const f = p.facing, sx = cx + f * 21, sy = p.y + p.h * .55 + Math.sin(clock * 4) * 1.5 + (p.onGround ? 0 : -3);
    glow(sx, sy, 40, 'rgba(120,190,255,A)', .35);
    c.save(); c.translate(sx, sy); c.rotate(f * .08 + p.lean); if (f < 0) c.scale(-1, 1); IMG('item_shield:b', -24, -26, 48); c.restore();
  }
  // sword: carried on the back, swings in front when you attack
  if (p.sword && st !== 'dying') {
    const f = p.facing, hy = p.y + p.h * .62;
    if (p.atk > 0) {
      const u = 1 - p.atk / .24, ang = f * lerp(-1.0, 1.9, ease.out(u)), len = 58, hx = cx + f * 20;
      c.strokeStyle = 'rgba(60,60,80,.4)'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath();
      const a0 = -Math.PI / 2 + f * -1.0, a1 = -Math.PI / 2 + ang; c.arc(cx, hy, 64, Math.min(a0, a1), Math.max(a0, a1)); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, hy, 64, Math.min(a0, a1), Math.max(a0, a1)); c.stroke();
      c.save(); c.translate(hx, hy); c.rotate(ang); if (f < 0) c.scale(-1, 1); IMG('item_sword:s', -len * .5, -len * 1.05, len); c.restore();
    } else {
      c.save(); c.translate(cx - f * 19, hy - 4 + Math.sin(clock * 3) * 1.2); c.rotate(-f * .55); if (f > 0) c.scale(-1, 1); IMG('item_sword:s', -22, -48, 44); c.restore();
    }
  }
}
function isOneWayBelow(x, y) { const t = G.world.at(Math.floor(x / T), Math.floor(y / T)); if (!t) return false; const d = TILES[t]; if (!d.one) return false; const b = G.world.box(Math.floor(x / T), Math.floor(y / T), t); return y >= b.y0 && y <= b.y1; }

/* ----------------------------- effects layer ----------------------------- */
function drawFX() {
  const c = R_.ctx;
  for (const p of FX.list) {
    const u = p.age / p.life, a = 1 - u;
    switch (p.t) {
      case 'puff': { const s = p.size * (.6 + u * .8); c.globalAlpha = a * .85; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); IMG('smoke', -s / 2, -s / 2, s); c.restore(); break; }
      case 'dust': c.globalAlpha = a * .7; c.fillStyle = '#9d8d73'; c.beginPath(); c.arc(p.x, p.y, p.size * (1 - u * .4), 0, 6.3); c.fill(); break;
      case 'spark': c.globalAlpha = a; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); IMG('star:gold', -p.size / 2, -p.size / 2, p.size * (1 - u * .4)); c.restore(); break;
      case 'shard': c.globalAlpha = Math.min(1, a * 1.6); c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col; c.strokeStyle = COLORS.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(-p.size, -p.size * .5); c.lineTo(p.size, -p.size * .2); c.lineTo(p.size * .3, p.size * .7); c.closePath(); c.fill(); c.stroke(); c.restore(); break;
      case 'line': { const r0 = 14 + u * 22, r1 = r0 + p.size * (1 - u); c.globalAlpha = a; c.strokeStyle = p.col; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x + Math.cos(p.a) * r0, p.y + Math.sin(p.a) * r0); c.lineTo(p.x + Math.cos(p.a) * r1, p.y + Math.sin(p.a) * r1); c.stroke(); break; }
      case 'ring': c.globalAlpha = a; c.strokeStyle = p.col; c.lineWidth = 4 * a + 1; c.beginPath(); c.arc(p.x, p.y, p.size * (.3 + .7 * ease.out(u)), 0, 6.3); c.stroke(); break;
      case 'text': { const pop = u < .15 ? .6 + u / .15 * .5 : 1.1 - Math.min(.1, (u - .15) * .3); c.globalAlpha = Math.min(1, a * 2.2); c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(pop, pop); txt(p.s, 0, 0, p.size, { align: 'center', color: p.col }); c.restore(); break; }
      case 'conf': c.globalAlpha = Math.min(1, a * 2); c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.abs(Math.sin(p.age * 6 + p.rot))); c.fillStyle = p.col; c.strokeStyle = COLORS.ink; c.lineWidth = 1.6; c.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * .66); c.strokeRect(-p.size / 2, -p.size / 3, p.size, p.size * .66); c.restore(); break;
      case 'sprite': c.globalAlpha = Math.min(1, a * 2); c.save(); c.translate(p.x, p.y); c.rotate(p.rot); IMG(p.img, -p.size / 2, -p.size / 2, p.size); c.restore(); break;
      case 'shock': c.globalAlpha = a * .8; c.strokeStyle = COLORS.ink; c.lineWidth = 5 * a + 1; c.beginPath(); c.ellipse(p.x, p.y, p.size * ease.out(u), p.size * .7 * ease.out(u), 0, 0, 6.3); c.stroke(); break;
    }
  }
  c.globalAlpha = 1;
  // red-pen circle round whatever just hurt the player
  if (G.state === 'dying' && G.death && G.deathT > FREEZE_T * .6) {
    const d = G.death, u = clamp((G.deathT - FREEZE_T * .6) / .3, 0, 1);
    c.strokeStyle = '#d9363e'; c.lineWidth = 4.2; c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = clamp(1.6 - G.deathT / DEATH_T * 1.2, 0, 1);
    if (d.cause === 'pit') { const x = clamp(d.x, Cam.x + 40, Cam.x + VW - 40), y = Cam.y + VH - 46; const s = 20 * ease.out(u); inkLine(c, x - s, y - s, x + s, y + s, 5); inkLine(c, x + s, y - s, x - s, y + s, 5); }
    else if (d.src) {
      const r = (d.src.r || 38) + 6, sweep = Math.PI * 2.25 * ease.out(u); c.beginPath();
      for (let a = 0; a <= sweep; a += .12) { const rr = r + a * 1.7 + Math.sin(a * 3) * 1.5, x = d.src.x + Math.cos(a - 1.2) * rr * 1.12, y = d.src.y + Math.sin(a - 1.2) * rr * .96; a === 0 ? c.moveTo(x, y) : c.lineTo(x, y); }
      c.stroke();
    }
    c.globalAlpha = 1;
  }
}

/* ------------------------------ level notes ------------------------------- */
function drawNotes(W, clock) {
  const c = R_.ctx;
  for (const n of (W.def.notes || [])) {
    const x = n[0] * T, y = Math.round(n[1] * T / 32) * 32; if (x + 400 < Cam.x || x > Cam.x + VW) continue;
    c.save(); c.translate(x, y); c.rotate(n[3] || -.03); c.globalAlpha = .82;
    txt(noteTouch(n[2]), 0, 0, n[4] || 24, { weight: '600', color: THEMES[G.theme || W.def.theme].note, oc: THEMES[G.theme || W.def.theme].paper, ow: 5 });
    if (n[5] === 'arrow') { c.strokeStyle = THEMES[G.theme || W.def.theme].note; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(20, 12); c.quadraticCurveTo(26, 36, 14, 56); c.moveTo(6, 46); c.lineTo(14, 58); c.lineTo(24, 48); c.stroke(); }
    c.restore();
  }
  c.globalAlpha = 1;
}

/* --------------------------------- HUD ---------------------------------- */
function heart(c, x, y, s, fill) {
  c.beginPath(); c.moveTo(x, y + s * .9); c.bezierCurveTo(x - s * 1.3, y - s * .1, x - s * .55, y - s * .95, x, y - s * .3); c.bezierCurveTo(x + s * .55, y - s * .95, x + s * 1.3, y - s * .1, x, y + s * .9); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); } c.lineWidth = 2.6; c.strokeStyle = COLORS.ink; c.lineJoin = 'round'; c.stroke();
}
function drawHUD() {
  const c = R_.ctx, lv = G.level; c.save(); c.scale(R_.hs || 1, R_.hs || 1);
  // tape-like label strip behind the stats for legibility
  c.fillStyle = 'rgba(245,237,216,.78)'; c.beginPath(); c.roundRect ? c.roundRect(10, 10, 388, 44, 12) : c.rect(10, 10, 388, 44); c.fill(); c.strokeStyle = 'rgba(43,43,51,.55)'; c.lineWidth = 2; c.stroke();
  for (let i = 0; i < 3; i++) {
    const alive = i < G.lives, sh = (!alive && G.lifeShake > 0 && i === G.lives) ? Math.sin(G.lifeShake * 40) * 3 * G.lifeShake : 0;
    c.save(); c.translate(36 + i * 34 + sh, 33); const sc = (!alive && i === G.lives && G.lifeShake > 0) ? 1 + G.lifeShake * .25 : 1; c.scale(sc, sc);
    if (alive) heart(c, 0, 0, 11, COLORS.red); else { c.globalAlpha = .45; heart(c, 0, 0, 11, 'rgba(120,110,100,.18)'); c.globalAlpha = 1; }
    c.restore();
  }
  const sc = 1 + G.hudStarFlash * .3; c.save(); c.translate(150, 32); c.scale(sc, sc); IMG('star:gold', -15, -16, 30); c.restore();
  txt(G.starCount + '/' + G.stars.length, 170, 41, 22, { ow: 0, out: false });
  txt(fmtTime(G.time), 238, 41, 22, { out: false });
  if (G.endless) txt(G.dist + ' m', 316, 41, 22, { out: false, color: COLORS.margin }); else txt(G.calcScore() + '', 316, 41, 20, { out: false, color: COLORS.margin });
  // power-ups / bag
  let ix = 412;
  if (G.bag) { c.globalAlpha = G.bag.taken ? 1 : .4; IMG('bag:t', ix, 12, 38); c.globalAlpha = 1; ix += 44; }
  if (G.player.shield) { IMG('item_shield:b', ix, 14, 34); ix += 40; }
  if (G.sword) { IMG('item_sword:s', ix, 12, 36); ix += 40; }
  c.restore();
  const boss = G.enemies.find(e => e.boss && e.alive && e.x > Cam.x - 80 && e.x < Cam.x + VW + 80);
  if (boss) { const bw = 300, bx = VW / 2 - bw / 2; c.fillStyle = 'rgba(245,237,216,.85)'; c.fillRect(bx - 6, 62, bw + 12, 24); c.strokeStyle = COLORS.ink; c.lineWidth = 3; c.strokeRect(bx - 6, 62, bw + 12, 24);
    c.fillStyle = '#d9363e'; c.fillRect(bx, 67, bw * boss.hp / boss.maxhp, 14); txt(boss.boss === 'head' ? 'THE HEADMASTER' : 'BIG BLOB', VW / 2, 112, 20, { align: 'center' }); }
  if (G.chase.active && G.chase.x < Cam.x + 40) { const a = .25 + .2 * Math.sin(performance.now() / 90); const g2 = c.createLinearGradient(0, 0, 160, 0); g2.addColorStop(0, 'rgba(217,54,62,' + a + ')'); g2.addColorStop(1, 'rgba(217,54,62,0)'); c.fillStyle = g2; c.fillRect(0, 0, 160, VH); }
  // A visible optional objective gives each page a reason to explore beyond the exit.
  if (G.quest && !G.endless) {
    const q = G.quest, qx = 12, qy = 64, qw = 304;
    c.save(); c.globalAlpha = .94; c.fillStyle = 'rgba(245,237,216,.90)'; c.beginPath(); c.roundRect ? c.roundRect(qx, qy, qw, 44, 9) : c.rect(qx, qy, qw, 44); c.fill(); c.strokeStyle = q.done ? '#4f9362' : 'rgba(43,43,51,.48)'; c.lineWidth = 2; c.stroke();
    txt(q.done ? '✓ PAGE QUEST COMPLETE' : 'PAGE QUEST', qx + 10, qy + 16, 13, { out: false, color: q.done ? '#34764a' : COLORS.margin });
    txt(q.done ? '+350 SCORE  ·  +35 INK' : q.label + '  ' + q.progress + '/' + q.target, qx + 10, qy + 34, 15, { out: false, color: COLORS.ink }); c.restore();
  }
  if (G.sword) {
    const bx = 12, by = G.quest && !G.endless ? 114 : 64, bw = 204, bh = 12;
    c.save(); c.globalAlpha = .94; c.fillStyle = 'rgba(245,237,216,.82)'; c.fillRect(bx, by, bw, bh + 17); c.strokeStyle = COLORS.ink; c.lineWidth = 1.5; c.strokeRect(bx, by, bw, bh + 17);
    txt(G.inkRush > 0 ? 'INK RUSH  ' + G.inkRush.toFixed(1) + 's' : (G.ink >= 100 ? 'INK FULL · PRESS X!' : 'INK ' + Math.round(G.ink) + '%'), bx + 6, by + 11, 12, { out: false, color: G.ink >= 100 || G.inkRush > 0 ? COLORS.red : COLORS.ink });
    c.fillStyle = '#d8cdb4'; c.fillRect(bx + 6, by + 15, bw - 12, 7); c.fillStyle = G.inkRush > 0 ? '#d9363e' : '#4e8f68'; c.fillRect(bx + 6, by + 15, (bw - 12) * (G.inkRush > 0 ? G.inkRush / 3.2 : G.ink / 100), 7); c.restore();
  }
  if (G.toast) { const t = G.toast, a = clamp(Math.min(t.t / .25, (t.max - t.t) / .15), 0, 1); c.globalAlpha = a; txt(t.s, VW / 2, 98 - (1 - a) * 10, 28, { align: 'center', color: '#3b4a74' }); c.globalAlpha = 1; }
}

/* ---------------------------- scene composition -------------------------- */
function drawAmbient(th, camX, camY, t) {      // weather that belongs to the page
  const c = R_.ctx;
  if (th === 'class') {              // sunbeams + dust motes
    c.fillStyle = 'rgba(255,238,170,.11)'; for (let i = 0; i < 3; i++) { const x = ((i * 380 + t * 14 - camX * .12) % 1300 + 1300) % 1300 - 160; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 90, 0); c.lineTo(x - 130, VH); c.lineTo(x - 260, VH); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 18; i++) { const h = hash(i * 7 + 1), x = ((h * 1200 + t * (5 + h * 8) - camX * .2) % 1100 + 1100) % 1100 - 30, y = ((hash(i * 3 + 5) * 600 + Math.sin(t * .6 + i) * 18) % 600 + 600) % 600; c.globalAlpha = .35 + .3 * Math.sin(t * 2 + i); c.beginPath(); c.arc(x, y, 1.6 + h * 1.6, 0, 6.3); c.fill(); } c.globalAlpha = 1;
  } else if (th === 'artillery') {   // rising embers
    for (let i = 0; i < 20; i++) { const h = hash(i * 13 + 2), x = ((h * 1200 - camX * (.2 + h * .3) + Math.sin(t + i) * 20) % 1100 + 1100) % 1100 - 30, y = VH - (((t * (28 + h * 40) + h * 900) % 640)); c.globalAlpha = Math.max(0, .75 - (VH - y) / 700); c.fillStyle = h > .5 ? '#ff8a2a' : '#ffc14a'; c.beginPath(); c.arc(x, y, 1.5 + h * 2, 0, 6.3); c.fill(); } c.globalAlpha = 1;
  } else if (th === 'bridge') {      // wind streaks + drifting scraps
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const h = hash(i * 9 + 4), x = ((h * 1300 + t * (90 + h * 120) - camX * .3) % 1300 + 1300) % 1300 - 120, y = hash(i * 5 + 8) * VH, l = 40 + h * 70; c.globalAlpha = .25 + h * .3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l * .5, y - 6, x + l, y); c.stroke(); } c.globalAlpha = 1;
  } else {                            // castle: fireflies
    for (let i = 0; i < 16; i++) { const h = hash(i * 11 + 6), x = ((h * 1200 - camX * (.25 + h * .3) + Math.sin(t * .7 + i * 2) * 40) % 1100 + 1100) % 1100 - 30, y = (hash(i * 4 + 9) * 520 + Math.cos(t * .6 + i) * 30) + 20, a = .35 + .55 * Math.max(0, Math.sin(t * 2.2 + i * 1.7));
      c.globalAlpha = a; c.fillStyle = '#e9f08a'; c.beginPath(); c.arc(x, y, 2.4, 0, 6.3); c.fill(); c.globalAlpha = a * .25; c.beginPath(); c.arc(x, y, 8, 0, 6.3); c.fill(); } c.globalAlpha = 1;
  }
}
/* far scenery: each page gets its own skyline and a living background */
function drawScenery(th, camX, camY, t) {
  const c = R_.ctx, gy = (G.world ? (G.level.spawn[1] + 1) * T : 448) - camY;
  const layer = (f, gap, fn) => { const i0 = Math.floor(camX * f / gap) - 1, n = Math.ceil(VW / gap) + 3; for (let i = i0; i < i0 + n; i++) fn(i, i * gap + hash(i * 5 + 1) * gap * .5 - camX * f, hash(i * 11 + 2)); };
  if (th === 'class') {
    layer(.26, 560, (i, x, h) => { c.globalAlpha = .5; IMG('window_round', x, 36, 118); IMG('drapes_poles', x - 52, 28, 74); IMG('drapes_poles', x + 96, 28, 74); });
    layer(.6, 330, (i, x, h) => { const k = (hash(i * 3) * 3) | 0, nm = ['character_rectangle_red', 'character_rectangle_yellow', 'character_round_green'][k], jump = Math.max(0, Math.sin(t * 3 + i * 1.7)) * 16, sz = k === 2 ? 42 : 44; c.globalAlpha = .36; IMG(nm, x, gy - sz - jump, sz); drawShadowBlob(x + sz / 2, gy - 1, sz * .4, .08); });
  } else if (th === 'artillery') {
    layer(.3, 600, (i, x, h) => { c.globalAlpha = .5; IMG('roof:s', x, gy - 118, 120); IMG('pole', x + 130, gy - 130, 70); c.fillStyle = 'rgba(200,60,50,.65)'; c.beginPath(); c.moveTo(x + 160, gy - 124); c.lineTo(x + 198, gy - 110 + Math.sin(t * 4 + i) * 3); c.lineTo(x + 160, gy - 98); c.fill(); });
    layer(.42, 700, (i, x, h) => { for (let k = 0; k < 4; k++) { const yy = gy - 120 - k * 46 - ((t * 14 + h * 40) % 46), a = .4 - k * .08; c.globalAlpha = Math.max(0, a); IMG('smoke', x - k * 6, yy, 60 + k * 18); } });
    layer(.15, 900, (i, x, h) => { const u = ((t * .16 + h * 3) % 1); const sx = x, ex = x + 360, px = lerp(sx, ex, u), py = 210 - Math.sin(u * Math.PI) * 140 + hash(i) * 50; c.globalAlpha = .55; c.fillStyle = '#2b2b33'; c.beginPath(); c.arc(px, py, 5, 0, 6.3); c.fill(); c.strokeStyle = 'rgba(60,30,20,.3)'; c.setLineDash([3, 8]); c.lineWidth = 2; c.beginPath(); for (let k = 0; k <= 20; k++) { const uu = k / 20, xx = lerp(sx, ex, uu), yy = 210 - Math.sin(uu * Math.PI) * 140 + hash(i) * 50; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); c.setLineDash([]); if (u > .93) { c.globalAlpha = (1 - u) * 14; c.fillStyle = '#ff9a3a'; c.beginPath(); c.arc(ex, 210 + hash(i) * 50, 30 * (u - .9) * 10, 0, 6.3); c.fill(); } });
  } else if (th === 'bridge') {
    layer(.12, 640, (i, x, h) => { c.globalAlpha = .7; c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x, 90 + h * 90, 30, 3.1, 6.3); c.arc(x + 44, 80 + h * 90, 40, 3.2, 6.2); c.arc(x + 96, 90 + h * 90, 30, 3.4, 6.4); c.fill(); });
    layer(.34, 520, (i, x, h) => { c.globalAlpha = .3; for (let k = 0; k < 3; k++) IMG('bridge_arch_large:s', x + k * 120, gy + 70 + 40 * h, 128); });
    layer(.5, 440, (i, x, h) => { c.globalAlpha = .45; IMG('pole_lantern', x, 40 + Math.sin(t * 1.5 + i) * 3, 64); });
  } else {
    c.globalAlpha = 1; { const mx = 820 - camX * .04, my = 120; const gl = c.createRadialGradient(mx, my, 20, mx, my, 150); gl.addColorStop(0, 'rgba(255,248,205,.35)'); gl.addColorStop(1, 'rgba(255,248,205,0)'); c.fillStyle = gl; c.fillRect(mx - 150, my - 150, 300, 300); c.fillStyle = '#f6f0cf'; c.beginPath(); c.arc(mx, my, 42, 0, 6.3); c.fill(); c.fillStyle = 'rgba(190,180,150,.55)'; for (const [dx, dy, rr] of [[-12, -8, 9], [14, 10, 7], [4, -18, 5]]) { c.beginPath(); c.arc(mx + dx, my + dy, rr, 0, 6.3); c.fill(); } }
    for (let i = 0; i < 46; i++) { const sx = ((hash(i * 7) * 1300 - camX * .05) % 1100 + 1100) % 1100, sy = hash(i * 13) * 330, a = .35 + .5 * Math.max(0, Math.sin(t * 1.7 + i)); c.globalAlpha = a; c.fillStyle = '#fff'; c.fillRect(sx, sy, 2, 2); }
    layer(.25, 460, (i, x, h) => { c.globalAlpha = .28; const k = (h * 3) | 0; IMG(k === 0 ? 'castle:s' : k === 1 ? 'tower:s' : 'tower_base:s', x, gy - 150, 120); IMG(k === 1 ? 'tower_roof_top:s' : 'roof_roundC', x + (k === 1 ? 0 : 20), gy - 240 + (k === 1 ? 10 : 30), k === 1 ? 120 : 80); });
    layer(.55, 520, (i, x, h) => { c.globalAlpha = .28; IMG('column_top', x, gy - 250, 64); IMG('column_middle', x, gy - 186, 64); IMG('column_middle', x, gy - 122, 64); IMG('column_bottom', x, gy - 58, 64); });
    layer(.8, 380, (i, x, h) => { const fl = .55 + .45 * Math.sin(t * 9 + i * 3) * Math.sin(t * 5.3 + i); c.globalAlpha = .75; IMG('pole_lantern', x, gy - 190, 64); glow(x + 48, gy - 128, 56, 'rgba(255,190,80,A)', .45 * fl); });
    for (let i = 0; i < 3; i++) { const bx = ((i * 520 + t * 60 - camX * .1) % 1500) - 100, by = 70 + i * 55 + Math.sin(t * 2 + i) * 10, w = Math.sin(t * 14 + i) * 5; c.globalAlpha = .7; c.strokeStyle = '#0b0b16'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(bx - 14, by - 4 + w); c.quadraticCurveTo(bx - 6, by - 12, bx, by); c.quadraticCurveTo(bx + 6, by - 12, bx + 14, by - 4 + w); c.stroke(); }
  }
  c.globalAlpha = 1;
}
const noteTouch = s => IS_TOUCH() ? s.replace('← →  or  A D  to move', 'use ◀ ▶ to move').replace('↑  W  or  space  to jump', 'tap ▲ to jump').replace(/press X to slash/i, 'tap ⚔ to slash').replace(/\(X\)/g, '(⚔)').replace(/slash it open/i, 'tap ⚔ to slash it open') : s;
function IS_TOUCH() { return R_.touch === undefined ? (R_.touch = document.getElementById('stage').classList.contains('touch')) : R_.touch || document.getElementById('stage').classList.contains('touch'); }
function drawKeycap(x, y, pulse) {
  const c = R_.ctx, t = performance.now() / 1000, s = 1 + pulse * .09 * Math.sin(t * 8), touch = IS_TOUCH();
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
  c.fillStyle = COLORS.ink; if (touch) { c.beginPath(); c.arc(3, 6, 27, 0, 6.3); c.fill(); c.fillStyle = '#fffdf4'; c.strokeStyle = COLORS.ink; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 27, 0, 6.3); c.fill(); c.stroke(); IMG('item_sword:s', -17, -21, 38); }
  else { c.fillRect(-23, -17, 52, 50); c.fillStyle = '#fffdf4'; c.strokeStyle = COLORS.ink; c.lineWidth = 4; c.fillRect(-26, -22, 52, 50); c.strokeRect(-26, -22, 52, 50); txt('X', 0, 14, 34, { align: 'center', out: false }); }
  c.restore();
}
function drawPrompts() {
  const h = G.hint, c = R_.ctx; if (!h || G.state !== 'play') return;
  const t = performance.now() / 1000, touch = IS_TOUCH();
  if (h.k === 'sword') { const a = clamp(G.swordT / .5, 0, 1); c.globalAlpha = a; c.fillStyle = 'rgba(245,237,216,.92)'; c.strokeStyle = COLORS.ink; c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(VW / 2 - 210, 470, 420, 76, 16) : c.rect(VW / 2 - 210, 470, 420, 76); c.fill(); c.stroke();
    drawKeycap(VW / 2 - 150, 507, 1); txt(touch ? 'tap the sword button to SLASH!' : 'press  X  to SLASH!', VW / 2 + 20, 516, touch ? 22 : 28, { align: 'center', out: false }); c.globalAlpha = 1; return; }
  let sx = h.wx - Cam.x, sy = h.wy - Cam.y; sx = clamp(sx, 50, VW - 50); sy = clamp(sy, 120, VH - 90);
  const bob = Math.sin(t * 5) * (h.urgent ? 9 : 4);
  c.globalAlpha = h.near || h.urgent ? 1 : .8;
  if (h.urgent) { c.strokeStyle = 'rgba(217,54,62,.8)'; c.lineWidth = 5; c.beginPath(); c.arc(sx, sy + bob, 46 + Math.sin(t * 9) * 4, 0, 6.3); c.stroke(); }
  drawKeycap(sx, sy + bob - 26, h.urgent ? 1.6 : h.near ? 1 : .4);
  txt(h.k === 'guard' ? 'SLASH THE GUARD!' : touch ? 'TAP TO SLASH!' : 'PRESS X TO SLASH!', sx, sy + bob + 30, h.urgent ? 22 : 18, { align: 'center', color: h.urgent ? '#d9363e' : COLORS.ink });
  c.strokeStyle = COLORS.margin; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, sy + bob + 38); c.lineTo(sx, sy + bob + 52); c.moveTo(sx - 8, sy + bob + 44); c.lineTo(sx, sy + bob + 54); c.lineTo(sx + 8, sy + bob + 44); c.stroke();
  c.globalAlpha = 1;
}
function kc(x, y, label, w = 40) { const c = R_.ctx; c.fillStyle = COLORS.ink; c.fillRect(x - w / 2 + 3, y - 17, w, 40); c.fillStyle = '#fffdf4'; c.strokeStyle = COLORS.ink; c.lineWidth = 3; c.fillRect(x - w / 2, y - 20, w, 40); c.strokeRect(x - w / 2, y - 20, w, 40); txt(label, x, y + 9, label.length > 2 ? 15 : 26, { align: 'center', out: false }); }
function tutTarget() {
  const st = TUT_STEPS[G.tut.i]; if (!st) return null; const L = G.level;
  switch (st.id) { case 'jump': return [26 * T, 5.1 * T]; case 'smash': return [34 * T + 32, 5.4 * T]; case 'sword': { const it = G.items[0]; return it && !it.taken ? [it.x, it.y - 44] : null; }
    case 'slash': { const d = G.drapes.find(d => d.alive && !d.lock); return d ? [d.c * T + 32, d.r * T - 20] : null; } case 'fight': { const e = G.enemies.find(e => e.alive && !e.spawnT); return e ? [e.x, e.base - e.h - 40] : [62 * T, 5 * T]; }
    case 'door': return [G.door.c * T + 32, G.door.y - 30]; default: return null; }
}
function drawTutorial() {
  if (!G.tut || G.state !== 'play') return; const c = R_.ctx, st = TUT_STEPS[G.tut.i], touch = IS_TOUCH(), t = performance.now() / 1000;
  const tg = tutTarget(); if (tg) { const sx = clamp(tg[0] - Cam.x, 40, VW - 40), sy = clamp(tg[1] - Cam.y, 150, VH - 90) + Math.sin(t * 6) * 6; c.strokeStyle = '#d9363e'; c.fillStyle = '#d9363e'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(sx, sy - 34); c.lineTo(sx, sy - 8); c.stroke(); c.beginPath(); c.moveTo(sx - 12, sy - 14); c.lineTo(sx, sy + 4); c.lineTo(sx + 12, sy - 14); c.closePath(); c.fill(); }
  const hs = R_.hs || 1, y0 = 60 * hs + 18, w = 560, x0 = VW / 2 - w / 2; c.save(); c.translate(VW / 2, y0 + 40); const sc = 1 + G.tut.flash * .06; c.scale(sc, sc); c.translate(-VW / 2, -(y0 + 40));
  c.fillStyle = 'rgba(245,237,216,.96)'; c.strokeStyle = COLORS.ink; c.lineWidth = 4; c.beginPath(); c.roundRect ? c.roundRect(x0, y0, w, 82, 16) : c.rect(x0, y0, w, 82); c.fill(); c.stroke();
  txt('STEP ' + Math.min(G.tut.i + 1, TUT_STEPS.length) + ' / ' + TUT_STEPS.length, x0 + 18, y0 + 24, 15, { color: COLORS.margin, out: false });
  txt(touch ? st.text.replace(/with X/, '').replace('Land ON', 'Land ON') : st.text, x0 + 18, y0 + 56, st.text.length > 30 ? 21 : 25, { out: false });
  const kx = x0 + w - 70; if (st.key === 'move') { if (touch) txt('◀  ▶', kx, y0 + 52, 28, { align: 'center', out: false }); else { kc(kx - 24, y0 + 40, '←'); kc(kx + 24, y0 + 40, '→'); } }
  else if (st.key === 'jump') { if (touch) txt('tap ▲', kx, y0 + 52, 26, { align: 'center', out: false }); else { kc(kx - 40, y0 + 40, '↑'); kc(kx + 24, y0 + 40, 'SPACE', 70); } }
  else if (st.key === 'X') { drawKeycap(kx, y0 + 38, 1); }
  for (let i = 0; i < TUT_STEPS.length; i++) { c.fillStyle = i < G.tut.i ? COLORS.green : i === G.tut.i ? COLORS.yellow : 'rgba(43,43,51,.2)'; c.strokeStyle = COLORS.ink; c.lineWidth = 2; c.beginPath(); c.arc(x0 + w / 2 - 66 + i * 22, y0 + 72, 6, 0, 6.3); c.fill(); c.stroke(); }
  c.restore();
}
function drawBannerAndProgress() {
  const c = R_.ctx, b = G.banner;
  if (b) { const t = 2.6 - b.t, a = clamp(Math.min(t / .25, b.t / .4), 0, 1), u = ease.out(clamp(t / .5, 0, 1)), y = 170 + (1 - ease.out(clamp(t / .3, 0, 1))) * 16; c.globalAlpha = a;
    c.fillStyle = 'rgba(255,196,46,.6)'; c.save(); c.translate(VW / 2, y); c.rotate(-.01); c.fillRect(-300, -34, 600, b.sub ? 92 : 64); c.restore();
    txt(b.name, VW / 2, y + 12, b.name.length > 20 ? 34 : 42, { align: 'center', out: false }); if (b.sub) txt(b.sub, VW / 2, y + 42, 20, { align: 'center', out: false, color: COLORS.margin });
    c.strokeStyle = COLORS.margin; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(VW / 2 - 250, y + 54); c.lineTo(VW / 2 - 250 + 500 * u, y + 52); c.stroke(); c.globalAlpha = 1; }
  if (G.tutorial || !G.level.exit || G.state === 'intro') return;
  const bw = 340, bx = VW / 2 - bw / 2, by = VH - 26, p = clamp(G.player.x / (G.level.exit[0] * T), 0, 1);
  c.fillStyle = 'rgba(245,237,216,.85)'; c.strokeStyle = COLORS.ink; c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(bx - 8, by - 10, bw + 16, 22, 11) : c.rect(bx - 8, by - 10, bw + 16, 22); c.fill(); c.stroke();
  c.fillStyle = COLORS.yellow; c.fillRect(bx, by - 4, bw * p, 10);
  for (const m of [.25, .5, .75]) { c.fillStyle = G.mile.has(m) ? COLORS.green : COLORS.ink; c.fillRect(bx + bw * m - 1.5, by - 8, 3, 18); }
  for (const cp of G.cps) { c.fillStyle = cp.on ? COLORS.green : 'rgba(43,43,51,.5)'; c.beginPath(); c.moveTo(bx + bw * cp.x / (G.level.exit[0] * T), by - 14); c.lineTo(bx + bw * cp.x / (G.level.exit[0] * T) + 7, by - 10); c.lineTo(bx + bw * cp.x / (G.level.exit[0] * T), by - 6); c.fill(); }
  c.fillStyle = COLORS.red; c.strokeStyle = COLORS.ink; c.lineWidth = 2.4; c.beginPath(); c.arc(bx + bw * p, by + 1, 8, 0, 6.3); c.fill(); c.stroke();
}
function drawFlyStars() {
  const c = R_.ctx;
  for (const f of G.fly) { const u = ease.inOut(f.t / f.dur), x = lerp(f.x, 152, u), y = lerp(f.y, 32, u) - Math.sin(u * Math.PI) * 70; c.globalAlpha = 1; IMG('star:gold', x - 15, y - 15, 30 * (1 - u * .3)); }
}
function drawScene(clock) {
  const c = R_.ctx, W = G.world, th = G.theme || W.def.theme;
  c.setTransform(R_.scale, 0, 0, R_.scale, 0, 0);
  const cx = Math.round(Cam.x + Cam.sx), cy = Math.round(Cam.y + Cam.sy), z = 1 + Cam.kick;
  c.save();
  if (z > 1.0005) { c.translate(VW / 2, VH / 2); c.scale(z, z); c.translate(-VW / 2, -VH / 2); }
  drawPaper(th, cx, cy, clock);
  drawDoodles(th, cx, cy, clock);
  if (Quality.level >= 1) drawScenery(th, cx, cy, clock);
  if (th === 'bridge') drawRiver(cy, clock);
  drawMargin(cx, cy);
  if (Quality.level >= 2) drawAmbient(th, cx, cy, clock);
  c.save(); c.translate(-cx, -cy);
  drawNotes(W, clock);
  const rv = G.reveal < 1, rx = cx + (VW + 80) * ease.out(clamp(G.reveal, 0, 1));
  if (rv) { c.save(); c.beginPath(); c.rect(cx - 20, cy - 20, rx - cx + 20, VH + 40); c.clip(); }
  for (const n of (W.def.near || [])) { const [img, q, r, a, sz] = n; if (q * T + 128 < cx || q * T > cx + VW) continue; c.globalAlpha = a || .5; IMG(img, q * T, r * T, sz || 64); c.globalAlpha = 1; }
  drawTiles(W, cx, cy);
  drawObjects(clock);
  if (rv) { c.restore(); c.strokeStyle = COLORS.ink; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); for (let y = cy; y < cy + VH; y += 14) c.lineTo(rx + Math.sin(y * .2 + clock * 20) * 3, y); c.stroke(); }
  drawPlayer(clock);
  if (G.inkRush > 0 && G.player) { const c = R_.ctx, p = G.player, x = p.x + p.w / 2 - Cam.x, y = p.y + p.h / 2 - Cam.y; c.save(); c.globalAlpha = .25 + .12 * Math.sin(clock * 24); c.strokeStyle = '#d9363e'; c.lineWidth = 5; c.beginPath(); c.ellipse(x, y, 34 + Math.sin(clock * 18) * 5, 44, 0, 0, 6.283); c.stroke(); c.restore(); }
  drawFX();
  c.restore();
  drawPaperFinish(th);
  c.restore();
  if (G.flash > 0) { const g = c.createRadialGradient(VW / 2, VH / 2, VH * .3, VW / 2, VH / 2, VW * .7); g.addColorStop(0, 'rgba(217,54,62,0)'); g.addColorStop(1, 'rgba(217,54,62,' + (G.flash * .38) + ')'); c.fillStyle = g; c.fillRect(0, 0, VW, VH); }
  drawHUD(); drawFlyStars(); drawPrompts(); drawTutorial(); drawBannerAndProgress();
  if (G.combo >= 2 && G.comboT > 0) { const k = 1 + (G.comboT > 1.1 ? (G.comboT - 1.1) * 2.4 : 0); c.save(); c.translate(VW - 30, 96 + (R_.hs - 1) * 40); c.rotate(-.06); c.scale(k, k); txt('x' + G.combo, 0, 0, 40, { align: 'right', color: G.combo >= 5 ? COLORS.red : COLORS.ink }); c.restore(); }
}
