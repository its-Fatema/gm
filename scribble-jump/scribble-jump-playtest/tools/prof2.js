const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  for (const [lvl, q] of [[0, 0], [0, 1], [0, 2], [0, 3], [3, 0], [3, 3]]) {
    const r = await p.evaluate(([lvl, q]) => { const { G } = __SJ; __SJ.startLevel(lvl, false); G.state = 'play'; G.reveal = 1; __SJ.Quality.level = q; __SJ.Quality.locked = true; const DT = 1 / 120; let u = 0, d = 0; for (let i = 0; i < 300; i++) { let t = performance.now(); G.update(DT); G.update(DT); u += performance.now() - t; t = performance.now(); render(i / 60); d += performance.now() - t; } return { updateMs: +(u / 300).toFixed(2), drawMs: +(d / 300).toFixed(2) }; }, [lvl, q]);
    console.log('L' + (lvl + 1), 'q' + q, r);
  }
  await b.close();
})();
