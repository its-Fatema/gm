const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  const out = await p.evaluate(() => {
    const { G, Input, startLevel, Save, Cam } = __SJ; const T = 64, DT = 1 / 120, r = {};
    const load = (i, def) => { startLevel(i, false, def); G.state = 'play'; G.reveal = 1; Input.reset(); };
    const run = (s, fn) => { for (let i = 0; i < s / DT; i++) { if (fn) fn(i * DT, i); G.update(DT); if (['gameover', 'complete'].includes(G.state)) break; } };
    const put = (c, rr) => { const p = G.player; p.x = c * T + 32 - 19; p.y = G.world.floorY(c, rr) - 52; p.vx = p.vy = 0; Cam.snap(G); };
    // eraser chase: run => survives; stand still => dies
    load(0); const c1 = G.level.chase[0][0]; put(c1, 6); G.sword = true; run(.3, () => { Input.right = true; }); r.chaseOn = G.chase.active;
    run(1.5, () => { Input.right = false; }); run(3, () => { Input.right = false; }); r.chaseStill = { lives: G.lives, state: G.state };
    // crumble
    load(2); const cx = 191 + 2; put(190, 7); run(.1); const k = [...Array(26).keys()].map(i => G.world.at(191 + i, 9)).join(''); r.crumbleBefore = k.length;
    put(194, 8); run(1.0); r.crumbleAfter = [...Array(26).keys()].filter(i => G.world.at(191 + i, 9) === 'X').length; r.crumbleLives = G.lives + ':' + G.state;
    // blob boss: sword does nothing, deflected bullet hurts
    load(1); const bo = G.enemies.find(e => e.boss); r.boss = bo.hp; put(bo.c - 8, 6); G.player.facing = 1; G.sword = true; bo.x = G.player.x + 90; bo.minX = bo.maxX = bo.x; Input.attackEdge = true; run(.3); r.bossSword = bo.hp;
    G.bullets.push({ x: bo.x - 80, y: bo.base - 30, vx: 300, r: 13, dir: 1, dist: 0, dead: false, friendly: true, maxDist: 900 }); run(.6); r.bossBullet = bo.hp;
    for (let i = 0; i < 3; i++) { bo.stun = 0; G.bullets.push({ x: bo.x - 80, y: bo.base - 30, vx: 300, r: 13, dir: 1, dist: 0, dead: false, friendly: true, maxDist: 900 }); run(.6); }
    r.bossDead = { alive: bo.alive, door: G.enemies.some(e => e.boss && e.alive) };
    // headmaster: sword damages, door locked until dead
    load(3); const hm = G.enemies.find(e => e.boss); r.hm = hm.hp; hm.minX = hm.maxX = hm.x; hm.spd = 0; hm.slamT = 99; put(hm.c - 3, 1); G.player.facing = 1; G.player.inv = 99;
    for (let i = 0; i < 6; i++) { hm.stun = 0; G.player.x = hm.x - 130; G.player.facing = 1; G.player.atkCd = 0; Input.attackEdge = true; run(.35); }
    r.hmAfter = { hp: hm.hp, alive: hm.alive };
    // endless: build + run bot-ish forward, check no throw and score
    load(4, buildEndless(7)); r.endless = { w: G.world.w, stars: G.stars.length, themes: G.level.themeAt.length }; put(3, 6);
    run(6, () => { Input.right = true; if (G.player.onGround && Math.random() < .02) Input.jumpEdge = true; Input.jump = true; }); r.endRun = { dist: G.dist, state: G.state, lives: G.lives };
    return r;
  });
  console.log(JSON.stringify(out)); console.log(errs); await b.close();
})();
