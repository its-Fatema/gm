const TILES_NOTE=1;
// Heuristic autopilot (always runs right, hops hazards/gaps/walls). Reports deaths + stuck spots per level.
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  for (const [L, sc, sr] of [[0], [1], [2], [2, 113, 3], [3], [3, 115, 2]]) {
    const r = await p.evaluate(([L, sc, sr]) => {
      const { G, Input, startLevel, Cam } = __SJ; startLevel(L, false); G.state = 'play'; if (sc) { const pl = G.player; pl.x = sc * 64 + 32 - pl.w / 2; pl.y = G.world.floorY(sc, sr) - pl.h; Cam.snap(G); G.cp = G.cps.find(c => c.c === sc) || null; if (G.cp) G.cp.on = true; } const T = 64, DT = 1 / 120;
      const W = G.world, deaths = []; let t = 0, best = 0, lastProg = 0, lastX = 0, jumpUntil = 0, stuck = null, sword = false;
      const solidBelow = (x, y) => { for (let d = 0; d < 6; d++) { const yy = y + 4 + d * T; if (W.solidAt(x, yy) || (W.at(Math.floor(x / T), Math.floor(yy / T)) && TILES[W.at(Math.floor(x / T), Math.floor(yy / T))].one)) return true; } return false; };
      let lives = 0;
      for (let i = 0; i < 120 * 420 && G.state !== 'complete' && G.state !== 'win'; i++) {
        const p = G.player; if (G.state === 'play') {
          t += DT; const cx = p.x + p.w / 2, fy = p.y + p.h; G.lives = 99;
          Input.right = true; Input.left = false;
          let jump = false;
          if (p.onGround) {
            for (const dx of [28, 56, 84]) { const x = cx + dx; if (!solidBelow(x, fy - 8) && !solidBelow(x, fy + 70)) { if (dx <= 56) jump = true; } }
            const wq = W.query(cx + 14, fy - 46, cx + 36, fy - 4, [], G.pottery).some(bx => !bx.one && bx.y0 < fy - 6); if (wq) jump = true;
            for (const c of G.cacti) if (c.box.x0 - cx < 120 && c.box.x0 - cx > 10 && Math.abs(c.box.y1 - fy) < 20) jump = true;
            for (const s of G.saws) if (s.x - cx < 120 && s.x - cx > -10 && Math.abs(s.y - fy) < 90) jump = true;
            for (const e of G.enemies) if (e.alive && e.x - cx < 120 && e.x - cx > -40 && Math.abs(e.base - fy) < 30) jump = true;
            for (const q of G.pottery) if (q.alive && q.c * T - cx < 90 && q.c * T - cx > -20 && Math.abs((q.r + 1) * T - fy) < 20) jump = true;
            for (const bl of G.bullets) if (Math.abs(bl.y - (fy - 20)) < 50 && ((bl.vx < 0 && bl.x > cx && bl.x - cx < 260) || (bl.vx > 0 && bl.x < cx && cx - bl.x < 260))) jump = true;
            // optional: jump onto a one-tile step higher ahead
          }
          if (G.sword && !sword) sword = true;
          if (jump && p.onGround) { Input.jumpEdge = true; jumpUntil = t + .5; }
          Input.jump = t < jumpUntil || (!p.onGround && p.vy < 0 && t < jumpUntil + .2);
          if (G.sword) for (const d of G.drapes) if (d.alive && d.box.x0 - cx < 70 && d.box.x0 - cx > 0) Input.attackEdge = true;
          if (G.sword) for (const e of G.enemies) if (e.alive && e.x - cx > 0 && e.x - cx < 80 && Math.abs(e.base - fy) < 40) Input.attackEdge = true;
          if (cx > best + 1) { best = cx; lastProg = t; }
          if (t - lastProg > 8 && !stuck) { stuck = Math.round(cx / T * 10) / 10; break; }
        } else Input.right = false;
        const before = G.state; G.update(DT);
        if (before === 'play' && G.state === 'dying') { lastProg = t; best = 0; } if (before === 'play' && G.state === 'dying') deaths.push([Math.round(G.death.cause === 'pit' ? p.x / T : (G.death.x) / T), G.death.cause]);
      }
      return { state: G.state, t: Math.round(t), best: Math.round(best / T), width: W.w, deaths, stuck };
    }, [L, sc, sr]);
    console.log('L' + (L + 1), sc ? 'from ' + sc : '', JSON.stringify(r));
  }
  console.log(errs); await b.close();
})();
