const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  const run = (label, off) => p.evaluate(([label, off]) => { const { G } = __SJ; __SJ.startLevel(0, false); G.state = 'play'; G.reveal = 1; __SJ.Quality.level = 3; __SJ.Quality.locked = true;
    const saved = {}; for (const n of off) { saved[n] = window[n]; window[n] = function () { }; }
    let d = 0; for (let i = 0; i < 200; i++) { G.update(1 / 60); const t = performance.now(); render(i / 60); d += performance.now() - t; }
    for (const n in saved) window[n] = saved[n]; return label + ': ' + (d / 200).toFixed(2) + ' ms'; }, [label, off]);
  for (const [l, o] of [['all on', []], ['no scenery', ['drawScenery']], ['no ambient', ['drawAmbient']], ['no doodles', ['drawDoodles']], ['no scenery+ambient', ['drawScenery', 'drawAmbient']], ['no tiles', ['drawTiles']], ['no objects', ['drawObjects']], ['no finish', ['drawPaperFinish']], ['no hud', ['drawHUD']]]) console.log(await run(l, o));
  await b.close();
})();
