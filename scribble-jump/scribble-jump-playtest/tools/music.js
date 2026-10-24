const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const logs = [];
  p.on('console', m => { if (m.type() !== 'log') logs.push(m.text()); }); p.on('pageerror', e => logs.push('ERR ' + e.message));
  await p.addInitScript(() => { window.__osc = 0; const O = window.AudioContext && AudioContext.prototype.createOscillator; if (O) AudioContext.prototype.createOscillator = function () { window.__osc++; return O.apply(this, arguments); }; });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  await p.click('#t-pages').catch(() => { }); await p.waitForTimeout(500);
  const a = await p.evaluate(() => { __SJ.Sound.resume(); __SJ.Sound.music(0); return window.__osc; }); await p.waitForTimeout(3000);
  const b1 = await p.evaluate(() => window.__osc); console.log('title music: oscillators started in 3s =', b1 - a);
  const r = await p.evaluate(async () => { __SJ.Sound.music(2); __SJ.Sound.intensity(1); const o0 = window.__osc; await new Promise(r => setTimeout(r, 3000)); const calm = window.__osc - o0; __SJ.Sound.intensity(2); const o1 = window.__osc; await new Promise(r => setTimeout(r, 3000)); return { page2_normal: calm, page2_fight: window.__osc - o1 }; });
  console.log(JSON.stringify(r), 'mute test:', await p.evaluate(async () => { __SJ.Sound.mus = false; const o = window.__osc; await new Promise(r => setTimeout(r, 1500)); const n = window.__osc - o; __SJ.Sound.mus = true; return 'oscillators while muted ' + n; }));
  console.log(logs.filter(l => !/404/.test(l))); await b.close();
})();
