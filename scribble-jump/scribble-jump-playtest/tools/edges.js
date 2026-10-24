// Verifies every hop of the validator's route with the REAL engine (hazards disabled).
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  for (let L = 1; L <= 4; L++) {
    const route = JSON.parse(fs.readFileSync(`tools/route_L${L}.json`));
    const res = await p.evaluate(({ L, route }) => {
      const { G, Input, startLevel } = __SJ; const DT = 1 / 120, T = 64; startLevel(L - 1, false); G.state = 'play';
      const fails = [], marg = [];
      for (const [k, e] of route.entries()) {
        const A = e.A, B = e.B; let ok = false, usedTj = null;
        const dir = (B.x0 + B.x1) / 2 > (A.x0 + A.x1) / 2 ? 1 : -1;
        const edgeX = dir > 0 ? Math.min(A.x1, B.x0 > A.x1 ? A.x1 : A.x1) : A.x0;
        outer: for (const back of [0, 100, 200, 300]) for (let tj = 0; tj <= 330; tj += 11) {
          // fresh dynamic state: no hazards
          G.cacti = []; G.saws = []; G.enemies = []; G.cannons = []; G.bullets = []; G.world.extra.length = 0; G.pottery = [];
          const pl = G.player; pl.inv = 99; pl.shield = false; G.state = 'play';
          const sx = clamp(dir > 0 ? A.x1 - 20 - back : A.x0 + 20 + back, A.x0 + 19, A.x1 - 19);
          pl.x = sx - pl.w / 2; pl.y = A.y - pl.h; pl.vx = pl.vy = 0; pl.onGround = true; pl.wasGround = true; pl.jumping = false;
          let pressed = false, travelled = 0, lx = pl.x;
          for (let i = 0; i < 300; i++) {
            Input.left = dir < 0; Input.right = dir > 0;
            const tx = dir > 0 ? Math.max(0, tj - (A.x1 - (pl.x + pl.w / 2))) : 0;
            if (!pressed && Math.abs(pl.x - lx) >= tj) { pressed = true; Input.jumpEdge = true; }
            Input.jump = pressed && i < 120;
            G.update(DT); lx = lx;
            if (pressed && pl.onGround && Math.abs(pl.y + pl.h - B.y) < 2 && pl.x + pl.w > B.x0 + 4 && pl.x < B.x1 - 4 && i > 20) { ok = true; usedTj = [back, tj]; break outer; }
            if (pl.y > G.world.py + 100) break;
          }
        }
        if (!ok) fails.push([k, Math.round(A.x0 / T), Math.round(A.x1 / T), Math.round(A.y), '->', Math.round(B.x0 / T), Math.round(B.x1 / T), Math.round(B.y), e.ratio.toFixed(2)]);
      }
      function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
      return { edges: route.length, fails };
    }, { L, route });
    console.log('L' + L, res.edges, 'edges; FAILS:', JSON.stringify(res.fails));
  }
  console.log(errs); await b.close();
})();
