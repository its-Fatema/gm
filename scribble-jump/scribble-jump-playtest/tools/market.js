// Marketing screenshots for portal submissions (1280x720 + 512x512 icon)
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
(async () => {
  fs.mkdirSync('/home/claude/market', { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1500);
  await p.screenshot({ path: '/home/claude/market/01_title_1280x720.png' });
  const shot = async (name, fn) => { await p.evaluate(fn); await p.waitForTimeout(700); await p.screenshot({ path: `/home/claude/market/${name}_1280x720.png` }); };
  const setup = (lv, col, row, extra) => `(() => { const { G, Cam, startLevel, Save } = __SJ; Save.data.sword = true; BADGES.forEach(b => Save.data.ach[b[0]] = 1); startLevel(${lv}, false); G.state = 'play'; G.reveal = 1; __SJ.UI.hideAll(); __SJ.UI.hud(true); G.sword = true; G.player.sword = true; G.player.x = ${col} * 64; G.player.y = G.world.floorY(${col}, ${row}) - 52; G.player.inv = 99; ${extra || ''} Cam.snap(G); })()`;
  await shot('02_smash_slash', setup(0, 28, 6, "G.player.facing = 1; G.combo = 4; G.comboT = 1;"));
  await shot('03_cannon', setup(1, 74, 6, "G.player.shield = true;"));
  await shot('04_bridge', setup(2, 60, 8, "G.player.shield = true;"));
  await shot('05_castle', setup(3, 20, 10, "G.player.shield = true;"));
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(300); await p.keyboard.up('ArrowRight');
  await b.close();
})();
