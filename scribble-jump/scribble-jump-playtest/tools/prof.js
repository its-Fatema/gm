const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  for (const lvl of [0, 1, 3]) for (const q of [1, 2, 3]) {
    const r = await p.evaluate(([lvl, q]) => new Promise(res => { __SJ.startLevel(lvl, false); __SJ.G.state = 'play'; __SJ.G.reveal = 1; __SJ.Quality.level = q; __SJ.Quality.locked = true; let n = 0; const t0 = performance.now(); const f = () => { n++; if (n < 240) requestAnimationFrame(f); else res(Math.round(240 / ((performance.now() - t0) / 1000))); }; requestAnimationFrame(f); }), [lvl, q]);
    console.log('L' + (lvl + 1), 'quality', q, 'fps', r);
  }
  await b.close();
})();
