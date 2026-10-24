const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const logs = []; p.on('console', m => { if (m.type() !== 'log') logs.push(m.text()); }); p.on('pageerror', e => logs.push('ERR ' + e.message));
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(async () => { const { Sound } = __SJ; Sound.resume(); await new Promise(r => setTimeout(r, 300)); const names = 'jump land star pot stomp defeat hurt death warn fire shield shieldBreak swordGet swing hit check door complete page click bag'.split(' '); for (const n of names) { Sound.play(n); await new Promise(r => setTimeout(r, 60)); } Sound.music(1); await new Promise(r => setTimeout(r, 1500)); Sound.music(4); await new Promise(r => setTimeout(r, 800)); return Sound.ready; });
  console.log('audio ready', r, logs.filter(l => !/404/.test(l))); await b.close();
})();
