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
    // ---- arena (L1)
    load(0); const a = G.arenas[0]; r.arena = [a.c1, a.c2, a.waves.length]; put(a.c1 + 6, a.r); G.player.inv = 99; run(.3);
    r.locked = { state: a.state, gates: G.drapes.filter(d => d.lock && d.alive).length };
    run(1.6); r.wave1 = a.list.length; r.dropped = G.enemies.filter(e => e.alive && !e.spawnT && !e.dropping).length;
    // kill everything each wave by stomping through damageEnemy
    for (let w = 0; w < 4 && !a.done; w++) { run(2.2); for (const e of G.enemies) if (e.alive && e.arena !== 0 && a.list.includes(e)) { G.damageEnemy(e, 'stomp'); if (e.k === 'green') G.damageEnemy(e, 'sword'); } run(1.5); }
    r.cleared = { done: a.done, gates: G.drapes.filter(d => d.lock && d.alive).length, kills: G.kills, heart: G.items.some(i => i.k === 'heart') };
    // death mid-arena resets it
    load(0); const a2 = G.arenas[0]; put(a2.c1 + 6, a2.r); run(1.0); G.player.inv = 0; G.hurt('pit', { x: 0, y: 0 }, true); run(1.2); r.reset = { state: a2.state, gates: G.drapes.filter(d => d.lock && d.alive).length, lives: G.lives };
    // ---- aimed cannon (L2 yard): bullet should carry vy when player is above/below
    load(1); const cn = G.cannons.find(c => c.aim); r.aimCannon = !!cn; put(cn.c - 6, 6); G.player.y -= 90; G.player.onGround = false; G.player.vy = -1; G.player.inv = 99; Cam.snap(G);
    let sawVy = false; for (let i = 0; i < 6 / DT; i++) { G.player.vy = Math.min(G.player.vy, -10); G.player.y = Math.min(G.player.y, G.world.floorY(cn.c - 6, 6) - 52 - 90); G.update(DT); if (G.bullets.some(b => Math.abs(b.vy || 0) > 20)) { sawVy = true; break; } }
    r.aimed = sawVy; r.burst = cn.burst || 1;
    // ---- score / rank
    load(0); G.starCount = 10; G.kills = 3; G.smashes = 5; G.time = 120; G.finishLevel(); r.score = G.result.score + ':' + G.result.rank + ' max ' + G.rankMax;
    return r;
  });
  console.log(JSON.stringify(out)); console.log(errs); await p.screenshot({ path: '/home/claude/r_done.png' }); await b.close();
})();
