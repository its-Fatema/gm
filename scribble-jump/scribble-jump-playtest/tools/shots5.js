const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1300);
  await p.evaluate(() => { __SJ.Save.data.tut = true; const { G, Cam, startLevel } = __SJ; startLevel(1, false); G.state = 'play'; G.reveal = 1; __SJ.UI.hideAll(); G.sword = true; const s = G.level.sections[0]; G.player.x = (s[0] + 4) * 64; G.player.y = G.world.floorY(Math.floor(s[0] + 4), 6) - 52; G.player.inv = 99; Cam.snap(G); });
  await p.waitForTimeout(700); await p.screenshot({ path: '/home/claude/z_banner.png' });
  await p.evaluate(() => { const { G, Cam, startLevel } = __SJ; startLevel(2, false); G.state = 'play'; G.reveal = 1; __SJ.UI.hideAll(); const s = G.level.sections[1]; G.player.x = (s[0] + 6) * 64; G.player.y = G.world.floorY(Math.floor(s[0] + 6), 8) - 52; G.player.inv = 99; Cam.snap(G); });
  await p.waitForTimeout(900); await p.screenshot({ path: '/home/claude/z_p3.png' });
  console.log(errs); await b.close();
})();
