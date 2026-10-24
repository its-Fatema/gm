const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  await p.evaluate(() => { __SJ.startLevel(1, false); const { G, Cam } = __SJ; G.state = 'play'; const T = 64; G.player.x = 73 * T; G.player.y = 7 * T - 52; G.player.inv = 99; Cam.snap(G); });
  for (let i = 0; i < 80; i++) { const w = await p.evaluate(() => __SJ.G.cannons.find(c => c.c === 79).warned); if (w) break; await p.waitForTimeout(100); }
  await p.waitForTimeout(700); await p.screenshot({ path: '/home/claude/u_cannon.png' });
  await p.waitForTimeout(900); await p.screenshot({ path: '/home/claude/u_cannon2.png' });
  await b.close();
})();
