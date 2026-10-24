const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  const res = await p.evaluate(() => {
    const { G, Input, Cam, startLevel, Save } = __SJ; const out = {}; const DT = 1 / 120;
    const T = 64;
    const load = (i) => { startLevel(i, false); G.state = 'play'; Input.reset(); };
    const put = (c, r, extra = 0) => { const p = G.player; p.x = c * T + 32 - p.w / 2 + extra; p.y = G.world.floorY(c, r) - p.h; p.vx = p.vy = 0; Cam.snap(G); };
    const run = (secs, fn) => { const n = Math.round(secs / DT); for (let i = 0; i < n; i++) { Input.left = Input.right = false; Input.jump = false; if (fn) fn(i * DT, i); const st = G.state; G.update(DT); if (G.state === 'gameover' || G.state === 'complete') break; } Input.left = Input.right = Input.jump = false; };
    const press = () => { Input.jumpEdge = true; };
    // 1. jump metrics
    load(0); put(5, 6); run(.3); let y0 = G.player.y + G.player.h, x0 = G.player.x, apex = 0, landed = null;
    run(1.5, (t, i) => { Input.right = true; Input.jump = t < .4; if (i === 0) press(); apex = Math.max(apex, y0 - (G.player.y + G.player.h)); if (t > .1 && G.player.onGround && landed === null) landed = G.player.x - x0; });
    out.jump = { apex: Math.round(apex), dist: Math.round(landed) };
    // 2. gap A crossing (col 20-21), jump at edge
    load(0); put(17, 6, 0); G.player.y = G.world.floorY(17, 6) - G.player.h; // on block step? use ground
    put(18, 6); run(.2); let jumped = false;
    run(2, (t, i) => { Input.right = true; if (!jumped && G.player.x + G.player.w / 2 > 19.55 * T) { jumped = true; press(); } Input.jump = jumped && t < .6; });
    out.gapA = { x: Math.round(G.player.x / T * 10) / 10, lives: G.lives, state: G.state };
    // 3. cactus kills once; respawn at spawn
    load(0); put(62, 6); run(1.2, () => { Input.right = true; });
    out.cactus = { lives: G.lives, state: G.state, dt: G.deathT.toFixed(2) };
    run(1.2); out.cactusAfter = { lives: G.lives, state: G.state, px: Math.round(G.player.x / T) };
    // 4. pit death decrements once
    load(0); put(19, 6); run(1.5, () => { Input.right = true; });
    out.pit = { lives: G.lives, state: G.state };
    // 5. checkpoint then die: respawn at checkpoint, lives drop by exactly one
    load(0); put(79, 6); run(1.2, () => { Input.right = true; }); out.cp = { on: !!G.cp, x: G.cp && G.cp.c };
    put(85, 5); G.player.y -= 20; run(1.6, () => { Input.right = true; });  // run into cactus at 85
    run(1.2); out.cpRespawn = { lives: G.lives, px: Math.round((G.player.x + G.player.w / 2) / T), state: G.state };
    // 6. out of lives
    load(0); for (let k = 0; k < 3; k++) { put(66 - 1, 6); run(1.6, () => { Input.right = true; }); if (G.state === 'gameover') break; }
    out.gameover = { state: G.state, lives: G.lives };
    // 7. pottery stomp
    load(0); put(36, 6); run(.2); let br = false;
    run(1.6, (t, i) => { Input.right = true; if (i === 0) press(); Input.jump = t < .5; if (G.pottery[0] && !G.pottery[0].alive) br = true; });
    out.pottery = { broken: !G.pottery[0].alive, starRevealed: !G.stars.find(s => s.c === 38 && s.r === 6).hidden, vy: Math.round(G.player.vy) };
    // 8. star pickup
    load(0); put(7, 6); run(.8, () => { Input.right = true; }); out.star = { count: G.starCount };
    // 9. L2 cannon: stand in the lane of small cannon at (79,6), only 1 life lost
    load(1); put(70, 6); G.cannons.forEach(c => c.t = 0); G.cp = null; let guard = 0;
    run(8, (t) => { Input.right = false; }); out.cannon = { lives: G.lives, state: G.state, bullets: G.bullets.length };
    // 10. L2 enemy: stomp from above
    load(1); put(29, 6); G.enemies[0].x = 29 * T + 32; G.enemies[0].spd = 0; put(29, 3); G.player.y = 4 * T; run(.6);
    out.stomp = { alive: G.enemies[0].alive, lives: G.lives, vy: Math.round(G.player.vy) };
    // 11. enemy side hit
    load(1); G.enemies[0].spd = 0; put(26, 6); run(2, () => { Input.right = true; }); out.side = { lives: G.lives, state: G.state };
    // 12. L3 shield absorbs one hit
    load(2); put(76, 8); run(.5); out.shieldGot = G.player.shield; put(41, 8); G.player.shield = true; G.player.inv = 0; run(.9, () => { Input.right = true; });
    out.shield1 = { lives: G.lives, shield: G.player.shield, state: G.state };
    put(61, 8); G.player.shield = false; run(1.4, () => { Input.right = true; }); out.shield2 = { lives: G.lives, state: G.state };
    // 13. L4 sword + guard
    load(3); put(59, 10); run(.4); out.sword = G.sword; const g = G.enemies[0]; g.x = 62 * T; g.spd = 0; put(60, 10); G.player.facing = 1; Input.attackEdge = true; run(.5, (t, i) => { if (i === 0) Input.attackEdge = true; });
    out.swordHit = { hp: g.hp, stun: g.stun > 0 };
    // 14. win flow
    load(0); put(128, 6); run(2, () => { Input.right = true; }); out.win = { state: G.state, result: G.result && G.result.stars, unlocked: Save.data.unlocked, time: G.time.toFixed(1) };
    out.winSaved = JSON.stringify(Save.level(1));
    // 15. fast rapid restarts
    load(0); for (let k = 0; k < 20; k++) { G.load(0); } out.restart = { lives: G.lives, state: G.state, stars: G.starCount };
    return out;
  });
  console.log(JSON.stringify(res, null, 1)); console.log('errors', errs);
  await b.close();
})();
