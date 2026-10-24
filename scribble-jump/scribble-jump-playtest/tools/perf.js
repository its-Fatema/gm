const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  for (const L of [0, 1, 2, 3]) {
    const r = await p.evaluate(L => new Promise(res => {
      __SJ.startLevel(L, false); const G = __SJ.G; G.state = 'play'; let n = 0, t0 = performance.now(); const times = [];
      const f = () => { const a = performance.now(); if (n % 90 === 0) { G.player.x += 400; } n++; times.push(performance.now() - a); if (n < 300) requestAnimationFrame(f); else res({ fps: Math.round(300 / ((performance.now() - t0) / 1000)), heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : 0 }); };
      requestAnimationFrame(f);
    }), L);
    console.log('L' + (L + 1), r);
  }
  await b.close();
})();
