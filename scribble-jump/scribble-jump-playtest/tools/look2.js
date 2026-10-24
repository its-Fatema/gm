const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  for (let lvl = 0; lvl < 4; lvl++) {
    const w = await p.evaluate(l => { __SJ.startLevel(l, false); return __SJ.G.world.w; }, lvl);
    let k = 0; for (const f of [.2, .42, .66, .9]) {
      await p.evaluate(([f]) => { const { G, Cam } = __SJ; G.state = 'play'; G.reveal = 1; __SJ.UI.hideAll(); G.sword = true; G.player.sword = true; G.player.inv = 99; G.lives = 3; const col = Math.floor(G.world.w * f); const W = G.world; let c = col; for (; c < W.w - 2; c++) { const t = W.at(c, G.level.spawn[1] + 1); if (t && !'PI'.includes(t)) break; } const r = G.level.spawn[1]; G.player.x = c * 64; G.player.y = W.floorY(c, r) - 52; G.player.vx = G.player.vy = 0; G.enemies.forEach(e => e.alive = e.alive); Cam.snap(G); G.clock += .01; }, [f]);
      await p.waitForTimeout(500); await p.screenshot({ path: `/home/claude/v_${lvl + 1}_${k++}.png` });
    }
  }
  console.log(errs); await b.close();
})();
