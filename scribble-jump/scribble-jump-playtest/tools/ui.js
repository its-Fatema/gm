const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  const st = () => p.evaluate(() => __SJ.G.state);
  await p.click('#t-play'); await p.waitForTimeout(2600); console.log('after play:', await st());
  // real keyboard: run right + jump
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(700); await p.keyboard.press('Space'); await p.waitForTimeout(400); await p.keyboard.up('ArrowRight');
  console.log('pos', await p.evaluate(() => Math.round(__SJ.G.player.x)), 'stars', await p.evaluate(() => __SJ.G.starCount));
  // pause freeze
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); console.log('paused:', await st());
  const t0 = await p.evaluate(() => __SJ.G.time); await p.waitForTimeout(600); const t1 = await p.evaluate(() => __SJ.G.time); console.log('timer frozen:', t0 === t1);
  await p.screenshot({ path: '/home/claude/u_pause.png' });
  await p.keyboard.press('Escape'); console.log('resumed:', await st());
  // blur pauses
  await p.evaluate(() => window.dispatchEvent(new Event('blur'))); await p.waitForTimeout(100); console.log('blur ->', await st());
  await p.click('#p-resume'); 
  // rapid R
  for (let i = 0; i < 12; i++) await p.keyboard.press('KeyR'); await p.waitForTimeout(300); console.log('after R x12:', await st(), await p.evaluate(() => [__SJ.G.lives, Math.round(__SJ.G.player.x)]));
  // out of lives
  await p.evaluate(() => { const G = __SJ.G; G.cacti = []; G.lives = 1; G.player.inv = 0; G.hurt('cactus', { x: G.player.x, y: G.player.y, r: 40 }); });
  await p.waitForTimeout(1300); console.log('state:', await st()); await p.screenshot({ path: '/home/claude/u_over.png' });
  await p.click('#o-retry'); await p.waitForTimeout(300); console.log('retry ->', await st(), await p.evaluate(() => __SJ.G.lives));
  // complete card
  await p.evaluate(() => { const { G } = __SJ; G.starCount = 8; G.bag && (G.bag.taken = true); G.time = 83.4; G.finishLevel(); });
  await p.waitForTimeout(1600); await p.screenshot({ path: '/home/claude/u_done.png' });
  await p.click('#d-next'); await p.waitForTimeout(500); await p.screenshot({ path: '/home/claude/u_flip2.png' }); await p.waitForTimeout(2200); console.log('next ->', await st(), await p.evaluate(() => __SJ.G.level.name));
  // cannon warning screenshot on L2
  await p.evaluate(() => { const { G, Cam } = __SJ; const T = 64; const c = G.cannons[1]; G.player.x = 70 * T; G.player.y = 7 * T - 52; Cam.snap(G); G.cp = null; });
  await p.waitForTimeout(2100); await p.screenshot({ path: '/home/claude/u_cannon.png' });
  // final screen
  await p.evaluate(() => { __SJ.Save.data.levels = { 1: { stars: [true, true, true], best: 70 }, 2: { stars: [true, true, false], best: 140 }, 3: { stars: [true, false, false], best: 190 }, 4: { stars: [true, true, true], best: 220 } }; __SJ.Save.data.unlocked = 4; __SJ.UI.showFinal(); });
  await p.waitForTimeout(600); await p.screenshot({ path: '/home/claude/u_final.png' });
  await p.evaluate(() => __SJ.UI.showSelect()); await p.waitForTimeout(400); await p.screenshot({ path: '/home/claude/u_select.png' });
  // touch layout
  const t = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  await t.goto('http://localhost:8123/index.dev.html'); await t.waitForTimeout(1200); await t.evaluate(() => { window.dispatchEvent(new Event('touchstart')); __SJ.startLevel(0, false); __SJ.G.state = 'play'; __SJ.UI.hideAll(); }); await t.waitForTimeout(600); await t.screenshot({ path: '/home/claude/u_touch.png' });
  console.log(errs); await b.close();
})();
