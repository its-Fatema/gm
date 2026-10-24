const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1300);
  await p.screenshot({ path: '/home/claude/q_title.png' });
  const T = 64;
  await p.evaluate(() => { const { G, Cam, startLevel } = __SJ; startLevel(0, false); G.state = 'play'; G.reveal = 1; __SJ.UI.hideAll(); const c1 = G.level.chase[0][0]; G.player.x = (c1 + 3) * 64; G.player.y = 7 * 64 - 52; Cam.snap(G); });
  await p.waitForTimeout(1300); await p.evaluate(() => { __SJ.Input.right = true; }); await p.waitForTimeout(500); await p.screenshot({ path: '/home/claude/q_eraser.png' }); await p.evaluate(() => { __SJ.Input.right = false; });
  await p.evaluate(() => { const { G, Cam, startLevel } = __SJ; startLevel(3, false); G.state = 'play'; G.reveal = 1; G.sword = true; const e = G.enemies.find(e => e.boss); G.player.x = (e.c - 9) * 64; G.player.y = G.world.floorY(e.c - 9, 1) - 52; G.player.inv = 99; Cam.snap(G); });
  await p.waitForTimeout(1200); await p.screenshot({ path: '/home/claude/q_boss.png' });
  await p.evaluate(() => { const { G, Cam, startLevel } = __SJ; startLevel(4, false, buildEndless(5)); G.state = 'play'; G.reveal = 1; G.player.x = 60 * 64; G.player.y = 7 * 64 - 52; G.theme = 'artillery'; Cam.snap(G); __SJ.UI.hideAll(); });
  await p.waitForTimeout(800); await p.screenshot({ path: '/home/claude/q_endless.png' });
  await b.close();
})();
