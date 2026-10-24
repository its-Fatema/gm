const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.dev.html'); await p.waitForTimeout(1300);
  const go = async (lvl, col, fn) => { await p.evaluate(([lvl, col, fn]) => { const { G, Cam, startLevel } = __SJ; startLevel(lvl, false); G.state = 'play'; G.reveal = 1; __SJ.UI.hideAll(); G.sword = true; G.player.sword = true; const r = G.level.spawn[1]; G.player.x = col * 64; G.player.y = G.world.floorY(Math.floor(col), r) - 52; G.player.inv = 99; Cam.snap(G); if (fn) eval(fn); }, [lvl, col, fn]); };
  // curtain prompt (keyboard) — urgent after standing near it
  await go(0, 0, "const d=G.drapes.find(d=>d.alive&&!d.lock); G.player.x=(d.c-3)*64; G.player.y=G.world.floorY(d.c-3,6)-52; Cam.snap(G);");
  await p.waitForTimeout(600); await p.screenshot({ path: '/home/claude/h_curtain.png' });
  await p.waitForTimeout(2600); await p.screenshot({ path: '/home/claude/h_urgent.png' });
  await p.evaluate(() => document.getElementById('stage').classList.add('touch')); await p.waitForTimeout(400); await p.screenshot({ path: '/home/claude/h_touch.png' });
  await p.evaluate(() => document.getElementById('stage').classList.remove('touch'));
  await go(0, 10, "G.swordT=5; G.swungRun=false;"); await p.waitForTimeout(500); await p.screenshot({ path: '/home/claude/h_sword.png' });
  // four page looks
  await go(0, 24, ""); await p.waitForTimeout(700); await p.screenshot({ path: '/home/claude/t1.png' });
  await go(1, 140, "const e=G.enemies.find(e=>e.k==='flyer'); if(e){G.player.x=(e.c-5)*64; G.player.y=G.world.floorY(e.c-5,6)-52; Cam.snap(G);}"); await p.waitForTimeout(1200); await p.screenshot({ path: '/home/claude/t2.png' });
  await go(2, 60, ""); await p.waitForTimeout(700); await p.screenshot({ path: '/home/claude/t3.png' });
  await go(3, 30, ""); await p.waitForTimeout(700); await p.screenshot({ path: '/home/claude/t4.png' });
  console.log(errs); await b.close();
})();
