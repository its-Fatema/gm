const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1200);
  const out = await p.evaluate(() => {
    const { G, Input, startLevel, Cam } = __SJ; const T = 64, DT = 1 / 120, r = {};
    const run = (s, fn) => { for (let i = 0; i < s / DT; i++) { if (fn) fn(i * DT, i); G.update(DT); if (G.state === 'dying') break; } };
    let seed = 1, D; while (true) { D = buildEndless(seed); if (D.movers.length && D.rain.length && D.terrain.some(t => t[0] === 'G')) break; seed++; if (seed > 400) break; }
    r.seed = seed; startLevel(4, false, D); G.state = 'play'; G.reveal = 1; Input.reset();
    // movers carry
    const m = G.movers[0]; const p = G.player; p.inv = 99; G.clock = 0.0001; Cam.snap(G);
    p.x = m.x + 40; p.y = m.box.y0 - p.h; p.vx = p.vy = 0; p.onGround = true; const x0 = p.x; let maxd = 0; run(2.2, () => { }); r.carry = { moved: Math.round(Math.abs(p.x - x0)), onPlank: Math.abs(p.y + p.h - G.movers[0].box.y0) < 4, state: G.state };
    // trampoline
    const gt = D.terrain.find(t => t[0] === 'G'); const gc = gt[1], gr_ = gt[2]; G.state = 'play'; G.lives = 3;
    p.x = gc * T + 32 - 19; p.y = gr_ * T - p.h - 160; p.vx = p.vy = 0; p.onGround = false; let apex = 1e9; run(1.6, () => { apex = Math.min(apex, p.y + p.h); }); r.bounce = { apexAbovePad: Math.round(gr_ * T - apex) };
    // pot party
    const rn = G.rains[0]; p.x = (rn.c1 + 3) * T; p.y = G.world.floorY(rn.c1 + 3, rn.r) - p.h; p.vx = 0; G.state = 'play'; run(.2); run(7, () => { }); r.rainLanded = rn.pots.filter(o => o.st === 'pot').length + '/' + rn.pots.length;
    for (const q of G.pottery) if (q.alive && q.box && rn.pots.some(o => o.q === q)) potteryBreak(q, false); run(.6); r.rainDone = { done: rn.done, bonus: G.bonusScore };
    return r;
  });
  console.log(JSON.stringify(out)); console.log(errs); await b.close();
})();
