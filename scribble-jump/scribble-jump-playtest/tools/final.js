const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  for (const url of ['file:///home/claude/sj/dist/scribble-jump-standalone.html', 'file:///home/claude/sj/index.html']) {
    const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/favicon/.test(m.text())) errs.push(m.text()); });
    await p.goto(url); await p.waitForTimeout(1500);
    if (url.includes('standalone')) await p.screenshot({ path: '/home/claude/final_title.png' });
    await p.click('#t-play'); await p.waitForTimeout(2200); await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1200); await p.keyboard.up('ArrowRight');
    console.log(url.split('/').pop(), errs);
    await p.close();
  }
  await b.close();
})();
