const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1300);
  await p.evaluate(() => { const { G, Cam, startLevel } = __SJ; startLevel(0, false); G.state = 'play'; G.reveal = 1; __SJ.UI.hideAll(); const a = G.arenas[0]; G.player.x = (a.c1 + 7) * 64; G.player.y = G.world.floorY(a.c1 + 7, a.r) - 52; G.player.inv = 99; Cam.snap(G); });
  await p.waitForTimeout(1900); await p.screenshot({ path: '/home/claude/s_arena.png' });
  await p.evaluate(() => { const { G, Cam, startLevel } = __SJ; startLevel(1, false); G.state = 'play'; G.reveal = 1; __SJ.UI.hideAll(); const cn = G.cannons.find(c => c.aim && c.size === 'large'); G.player.x = (cn.c - 8) * 64; G.player.y = G.world.floorY(cn.c - 8, 6) - 52; G.player.inv = 99; Cam.snap(G); });
  for (let i = 0; i < 60; i++) { const w = await p.evaluate(() => __SJ.G.cannons.some(c => c.aim && c.warned && c.t > c.interval - .25)); if (w) break; await p.waitForTimeout(100); }
  await p.screenshot({ path: '/home/claude/s_aim.png' });
  await p.evaluate(() => { const { G } = __SJ; startLevelNo = 0; G.load(0); G.state = 'play'; G.starCount = 14; G.kills = 6; G.smashes = 9; G.bestCombo = 7; G.time = 140; G.lives = 3; G.finishLevel(); });
  await p.waitForTimeout(2200); await p.screenshot({ path: '/home/claude/s_rank.png' });
  console.log(errs); await b.close();
})();
