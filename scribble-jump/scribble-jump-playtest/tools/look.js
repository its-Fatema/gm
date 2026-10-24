const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); });
  await p.goto('file:///home/claude/sj/index.dev.html'); await p.waitForTimeout(1500);       // straight from disk
  await p.evaluate(() => { __SJ.Save.data.unlocked = 3; __SJ.Save.data.levels = { 1: { stars: [true, true, false], best: 90 } }; __SJ.UI.showSelect(); });
  await p.waitForTimeout(400); await p.screenshot({ path: '/home/claude/k_select.png' });
  await p.evaluate(() => __SJ.UI.show('credits')); await p.waitForTimeout(300); await p.screenshot({ path: '/home/claude/k_credits.png' });
  await p.evaluate(() => { __SJ.Save.data.sword = false; __SJ.startLevel(0, false); __SJ.G.state = 'play'; __SJ.G.reveal = 1; __SJ.UI.hideAll(); });
  // play for real: run right, jump onto first pottery, grab stars
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(550); await p.keyboard.press('Space'); await p.waitForTimeout(260); await p.screenshot({ path: '/home/claude/k_smash.png' });
  await p.waitForTimeout(900); await p.keyboard.up('ArrowRight');
  await p.evaluate(() => { const { G, Cam } = __SJ; G.player.x = 23 * 64; G.player.y = 7 * 64 - 52; G.player.vx = 0; Cam.snap(G); });
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(500); await p.keyboard.up('ArrowRight');
  console.log('sword owned:', await p.evaluate(() => __SJ.G.sword));
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(330); await p.keyboard.press('KeyX'); await p.waitForTimeout(90); await p.screenshot({ path: '/home/claude/k_slash.png' }); await p.keyboard.up('ArrowRight');
  console.log(errs.filter(e => !/favicon/.test(e)));
  await b.close();
})();
