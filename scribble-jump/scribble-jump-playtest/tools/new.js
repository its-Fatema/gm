const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  const out = await p.evaluate(() => {
    const { G, Input, startLevel, Save, Cam } = __SJ; const T = 64, DT = 1 / 120, r = {};
    const load = i => { startLevel(i, false); G.state = 'play'; G.reveal = 1; Input.reset(); };
    const run = (s, fn) => { for (let i = 0; i < s / DT; i++) { if (fn) fn(i * DT, i); G.update(DT); if (G.state === 'dying') break; } };
    const put = (c, rr) => { const p = G.player; p.x = c * T + 32 - 19; p.y = G.world.floorY(c, rr) - 52; p.vx = p.vy = 0; Cam.snap(G); };
    // 1 curtain blocks, slash opens
    load(0); G.sword = true; put(33, 6); run(1.2, () => { Input.right = true; }); r.blocked = { x: +(G.player.x / T).toFixed(1), gate: G.drapes[0].alive };
    Input.attackEdge = true; run(.4, (t, i) => { Input.right = false; }); r.cut = { alive: G.drapes[0].alive, combo: G.combo };
    run(1.2, () => { Input.right = true; }); r.through = +(G.player.x / T).toFixed(1);
    // 2 guard stomp = stun only, sword = damage
    load(3); const g = G.enemies[0]; g.spd = 0; put(g.c, 10); G.player.y -= 120; run(.5); r.stomp = { hp: g.hp, stun: +g.stun.toFixed(2), alive: g.alive };
    g.stun = 0; put(g.c - 1, 10); G.player.inv = 99; G.player.facing = 1; Input.attackEdge = true; run(.3); r.slash1 = { hp: g.hp };
    g.stun = 0; run(.5); put(g.c - 1, 10); G.player.facing = 1; Input.attackEdge = true; run(.3); r.slash2 = { alive: g.alive, badge: !!Save.data.ach.guard };
    // 3 shield shatters
    load(2); G.player.shield = true; G.player.inv = 0; G.hurt('saw', { x: 0, y: 0, r: 30 }); r.shield = { lives: G.lives, shield: G.player.shield, fx: __SJ.FX.list.filter(f => f.t === 'sprite').length };
    // 4 air hop on slash
    load(0); G.sword = true; put(30, 6); G.pottery.find(q => q.c === 30).alive = true; G.player.y -= 90; G.player.vy = 50; G.player.onGround = false; G.player.facing = 1; Input.attackEdge = true; run(.2); r.hop = { vy: Math.round(G.player.vy) };
    // 5 skins/badges persisted
    r.badges = Object.keys(Save.data.ach);
    return r;
  });
  console.log(JSON.stringify(out));
  // visuals: shield held + curtain + skins/badges
  await p.evaluate(() => { const { G, Cam, startLevel } = __SJ; startLevel(0, false); G.state = 'play'; G.reveal = 1; G.sword = true; G.player.sword = true; G.player.shield = true; const T = 64; G.player.x = 33.5 * T; G.player.y = 7 * T - 52; G.player.facing = 1; Cam.snap(G); __SJ.UI.hideAll(); });
  await p.waitForTimeout(500); await p.screenshot({ path: '/home/claude/n_shield.png' });
  await p.evaluate(() => { __SJ.Save.data.levels = { 1: { stars: [true, true, true], best: 80 }, 2: { stars: [true, true, false], best: 100 } }; __SJ.UI.showSkins(); });
  await p.waitForTimeout(300); await p.screenshot({ path: '/home/claude/n_skins.png' });
  await p.evaluate(() => __SJ.UI.showBadges()); await p.waitForTimeout(300); await p.screenshot({ path: '/home/claude/n_badges.png' });
  console.log(errs); await b.close();
})();
