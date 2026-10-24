const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1300);
  await p.evaluate(() => { __SJ.Save.data.tut = false; });
  await p.click('#t-play'); await p.waitForTimeout(2600);
  console.log('after PLAY:', await p.evaluate(() => [__SJ.G.state, __SJ.G.level.name, __SJ.G.tutorial]));
  await p.screenshot({ path: '/home/claude/tu_1.png' });
  const log = await p.evaluate(() => {
    const { G, Input, Cam } = __SJ; const DT = 1 / 120, T = 64, out = []; Input.reset();
    const run = (s, fn) => { for (let i = 0; i < s / DT; i++) { if (fn) fn(i * DT, i); G.update(DT); if (G.state !== 'play') break; } };
    const step = () => G.tut.i;
    // 1 walk right
    run(2.5, () => { Input.right = true; }); Input.right = false; out.push('after walk: step ' + step());
    // 2 jump the gap
    G.player.x = 22 * T; run(2, (t) => { Input.right = true; if (G.player.onGround && G.player.x / T > 24.2 && !G._j) { G._j = 1; Input.jumpEdge = true; } Input.jump = G.player.x / T < 26.5; }); Input.right = false; Input.jump = false; out.push('after jump: step ' + step() + ' x=' + (G.player.x / T).toFixed(1));
    // 3 smash: drop onto the pottery from above
    G.player.x = 34 * T + 32 - 19; G.player.y = G.world.floorY(34, 6) - 52 - 140; G.player.vy = 0; G.player.vx = 0; G.player.onGround = false; Cam.snap(G); run(1.2); out.push('after smash: step ' + step() + ' smashes ' + G.smashes + ' pot ' + JSON.stringify(G.pottery.map(q => q.alive)) + ' p=' + (G.player.x / T).toFixed(1) + ',' + Math.round(G.player.y) + ' state ' + G.state + ' dyn ' + G.dyn.length);
    // 4 sword
    G.player.x = 41 * T; G.player.y = G.world.floorY(41, 6) - 52; run(1.5, () => { Input.right = true; }); Input.right = false; out.push('after sword: step ' + step() + ' sword ' + G.sword);
    // 5 slash curtain
    G.player.x = 50 * T; run(.6, () => { Input.right = true; }); Input.right = false; G.player.facing = 1; Input.attackEdge = true; run(.4); out.push('after slash: step ' + step() + ' cuts ' + G.cuts);
    // 6 fight
    G.player.x = 65 * T; G.player.y = G.world.floorY(65, 6) - 52; G.player.inv = 99; run(1.0); Input.right = false; run(2, () => { }); for (const e of G.enemies) if (e.alive) G.damageEnemy(e, 'stomp'); run(1.2); out.push('after fight: step ' + step() + ' kills ' + G.kills);
    // 7 door
    G.player.x = 96 * T; G.player.y = G.world.floorY(96, 6) - 52; run(3, () => { Input.right = true; }); out.push('end state: ' + G.state + ' level ' + G.level.name + ' tut saved ' + __SJ.Save.data.tut);
    return out;
  });
  console.log(log.join('\n'));
  await p.waitForTimeout(2500); console.log('now:', await p.evaluate(() => [__SJ.G.state, __SJ.G.level.name]));
  console.log(errs); await b.close();
})();
