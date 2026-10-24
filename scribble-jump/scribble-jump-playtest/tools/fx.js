const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  const T = 64;
  // sword swing vs guard
  await p.evaluate(() => { __SJ.startLevel(3, false); const { G, Cam } = __SJ; G.state = 'play'; G.sword = true; G.player.sword = true; const e = G.enemies[1]; e.x = 63 * 64; e.spd = 0; G.player.x = 60 * 64; G.player.y = G.world.floorY(60, 10) - 52; G.player.inv = 99; Cam.snap(G); __SJ.Input.attackEdge = true; });
  await p.waitForTimeout(110); await p.screenshot({ path: '/home/claude/f_sword.png' });
  // shield + saw
  await p.evaluate(() => { __SJ.startLevel(2, false); const { G, Cam } = __SJ; G.state = 'play'; G.player.shield = true; G.player.x = 38 * 64; G.player.y = G.world.floorY(38, 8) - 52; Cam.snap(G); });
  await p.waitForTimeout(250); await p.screenshot({ path: '/home/claude/f_shield.png' });
  // death by saw: red circle
  await p.evaluate(() => { const { G } = __SJ; G.player.shield = false; G.player.inv = 0; const s = G.saws[0]; G.player.x = s.x - 19; G.player.y = s.y - 30; });
  await p.waitForTimeout(330); await p.screenshot({ path: '/home/claude/f_death.png' });
  await b.close();
})();
