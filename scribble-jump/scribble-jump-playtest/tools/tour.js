const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const lv = +process.argv[2], step = +(process.argv[3] || 960);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  await p.evaluate(i => { __SJ.startLevel(i, false); }, lv - 1); await p.waitForTimeout(300);
  const info = await p.evaluate(() => { const g = __SJ.G; g.state = 'complete'; return [g.world.px, g.world.py]; });
  let n = 0;
  for (let x = 0; x < info[0]; x += step) {
    for (let y = 0; y <= Math.max(0, info[1] - 576); y += Math.max(1, info[1] - 576)) {
      await p.evaluate(([x, y]) => { __SJ.Cam.x = Math.min(x, __SJ.G.world.px - 1024); __SJ.Cam.y = y; __SJ.G.clock += 0; }, [x, y]); await p.waitForTimeout(60);
      await p.screenshot({ path: `/home/claude/t_L${lv}_${String(n++).padStart(2, '0')}.png` });
      if (info[1] <= 576) break;
    }
  }
  console.log('shots', n, errs);
  await b.close();
})();
