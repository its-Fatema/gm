const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  for (const [name, url] of [['previous', 'file:///mnt/user-data/outputs/scribble-jump-standalone.html'], ['new', 'file:///home/claude/sj/dist/scribble-jump-standalone.html']]) {
    const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); await p.goto(url); await p.waitForTimeout(1500);
    await p.click('#t-play'); await p.waitForTimeout(2600); await p.keyboard.down('ArrowRight');
    const fps = await p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(Math.round(n / 3)); }; requestAnimationFrame(f); }));
    console.log(name, 'fps', fps); await p.close();
  }
  await b.close();
})();
