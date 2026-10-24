const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const devs = [
    ['phone-landscape', { viewport: { width: 915, height: 412 }, screen: { width: 915, height: 412 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }],
    ['phone-portrait', { viewport: { width: 412, height: 915 }, screen: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }],
    ['phone-DESKTOP-SITE-landscape', { viewport: { width: 980, height: 441 }, screen: { width: 915, height: 412 }, deviceScaleFactor: 2.4, isMobile: false, hasTouch: true }],
    ['phone-DESKTOP-SITE-portrait', { viewport: { width: 980, height: 2176 }, screen: { width: 412, height: 915 }, deviceScaleFactor: 1.1, isMobile: false, hasTouch: true }],
    ['tablet-landscape', { viewport: { width: 1024, height: 768 }, screen: { width: 1024, height: 768 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ['tablet-portrait', { viewport: { width: 768, height: 1024 }, screen: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ['laptop', { viewport: { width: 1366, height: 768 }, screen: { width: 1366, height: 768 }, deviceScaleFactor: 1 }],
    ['touch-laptop', { viewport: { width: 1366, height: 768 }, screen: { width: 1366, height: 768 }, deviceScaleFactor: 1, hasTouch: true }],
    ['ultrawide', { viewport: { width: 2560, height: 1080 }, screen: { width: 2560, height: 1080 }, deviceScaleFactor: 1 }],
  ];
  for (const [name, opt] of devs) {
    const ctx = await b.newContext(opt); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1300);
    const info = await p.evaluate(() => { const st = document.getElementById('stage'), r = st.getBoundingClientRect(), tj = document.getElementById('tj'); const tr = tj.getBoundingClientRect(); const cs = getComputedStyle(st);
      return { touchClass: st.classList.contains('touch'), portraitOverlay: getComputedStyle(document.getElementById('rotate') || document.body).display, bodyPortrait: document.body.classList.contains('portrait'), stage: [Math.round(r.width), Math.round(r.height)], zo: +(cs.getPropertyValue('--zo') || 1), jumpBtnCssPx: Math.round(tr.width), vp: [innerWidth, innerHeight], phys: +(r.width * (Math.max(screen.width, screen.height) / Math.max(innerWidth, innerHeight)) / (1)).toFixed(0) }; });
    await p.click('#t-play').catch(() => { }); await p.waitForTimeout(2300);
    const st = await p.evaluate(() => __SJ.G.state); await p.screenshot({ path: '/home/claude/d_' + name + '.png' });
    console.log(name.padEnd(30), JSON.stringify(info), 'state:', st, errs.length ? errs : '');
    await ctx.close();
  }
  await b.close();
})();
