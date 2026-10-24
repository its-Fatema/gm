const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const devs = [['phone-land', 844, 390, 3], ['phone-small', 640, 360, 2], ['tablet', 1024, 768, 2], ['phone-portrait', 390, 844, 3]];
  for (const [name, w, h, dpr] of devs) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(m.text()); });
    await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1500);
    await p.screenshot({ path: `/home/claude/mb_${name}_title.png` });
    if (name === 'phone-portrait') { console.log(name, 'rotate overlay:', await p.evaluate(() => getComputedStyle(document.getElementById('rotate')).display)); await ctx.close(); continue; }
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.tap('#t-play'); await p.waitForTimeout(2300);
    // drive the d-pad + jump with real pointer events
    const r = await p.evaluate(async () => {
      const pad = document.getElementById('tpad'), jb = document.getElementById('tj'), G = __SJ.G; const rc = pad.getBoundingClientRect();
      const ev = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: 1, clientX: x, clientY: y, bubbles: true, buttons: type === 'pointerup' ? 0 : 1, pressure: .5 }));
      const x0 = G.player.x; ev(pad, 'pointerdown', rc.left + rc.width * .8, rc.top + 30); await new Promise(r => setTimeout(r, 900));
      ev(jb, 'pointerdown', 0, 0); await new Promise(r => setTimeout(r, 300)); const air = !G.player.onGround; ev(jb, 'pointerup', 0, 0);
      await new Promise(r => setTimeout(r, 500)); ev(pad, 'pointerup', 0, 0);
      return { moved: Math.round(G.player.x - x0), jumped: air, q: Quality.level, state: G.state };
    });
    const fps = await p.evaluate(() => new Promise(res => { let n = 0, t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(Math.round(n / 2)); }; requestAnimationFrame(f); }));
    await p.screenshot({ path: `/home/claude/mb_${name}_play.png` });
    const sw = await p.evaluate(() => { const o = document.getElementById('stage').getBoundingClientRect(); const t = document.getElementById('touch').getBoundingClientRect(); return { stage: [Math.round(o.width), Math.round(o.height)], touchShown: getComputedStyle(document.getElementById('touch')).display }; });
    console.log(name, JSON.stringify(r), 'fps@4xCPU:', fps, 'quality now:', await p.evaluate(() => Quality.level), JSON.stringify(sw), errs);
    await ctx.close();
  }
  await b.close();
})();
