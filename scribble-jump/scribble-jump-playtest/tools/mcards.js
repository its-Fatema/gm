const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 740, height: 360 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { __SJ.Save.data.unlocked = 4; __SJ.UI.showSelect(); }); await p.waitForTimeout(300); await p.screenshot({ path: '/home/claude/mc_select.png' });
  await p.evaluate(() => { __SJ.startLevel(0, false); __SJ.G.state = 'play'; __SJ.G.reveal = 1; __SJ.G.starCount = 8; __SJ.G.time = 83; __SJ.G.finishLevel(); }); await p.waitForTimeout(1700); await p.screenshot({ path: '/home/claude/mc_done.png' });
  await p.evaluate(() => { __SJ.G.state = 'play'; __SJ.UI.hideAll(); }); await p.evaluate(() => { document.getElementById('b-pause').click(); }); await p.waitForTimeout(300); await p.screenshot({ path: '/home/claude/mc_pause.png' });
  await b.close();
})();
