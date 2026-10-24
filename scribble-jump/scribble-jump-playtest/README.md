# Scribble Jump
A hand-drawn notebook platformer — 4 pages, 3 lives per attempt, checkpoints, stars, hidden bags, cannons, sawblades, shield, sword.
Art: Kenney "Scribble Platformer Expansion" (CC0, see assets/License.txt).

## Run / deploy
* `index.html` + `assets/` is the deployable portal build (static files, no dependencies). Serve over http(s).
* `dist/scribble-jump-standalone.html` is the same game with every sprite inlined (one file, works from file://).

## Rebuild
`node build.js` → writes `index.html` and `dist/scribble-jump-standalone.html` from `src/`.
`node build.js --dev` → `index.dev.html` with a `window.__SJ` debug hook (stripped from release).

## Source layout
* `src/levels.js`   all four levels as data (terrain rects, stars, hazards, enemies, cannons, checkpoints, notes, decor)
* `src/01_core.js`  utils, save (localStorage), procedural audio + music, asset loader/tints, input
* `src/02_world.js` tiles, collision, physics constants, particles, camera, level loading
* `src/03_game.js`  gameplay rules: lives, death/respawn, hazards, enemies, cannons, pickups, win
* `src/04_render.js` paper background, tiles, objects, player, HUD, effects
* `src/05_ui.js`    screens, page-turn transition, input wiring, main loop, boot

## Level QA tools (node + playwright, dev only)
* `node tools/validate.js` – physics-derived jump reachability + overlap/safety audit of every level (spawn, checkpoints, stars vs hazards, enemy floors, saw paths, cannon lanes)
* `tools/run.sh tools/edges.js` – replays every hop of the route in the real engine
* `tools/run.sh tools/test.js | bot.js | ui.js | perf.js | snd.js` – mechanics, autopilot, UI flow, perf and audio smoke tests

## Portal SDK hooks (empty, ready to fill)
All calls go through the `Portal` object in `src/01_core.js` (init, loadingStart/Done, gameplayStart/Stop, levelComplete, gameOver, adBreak, rewarded, muteAudio). The game already calls them at the right moments.

## Where to hang ads
Insert ad/SDK calls in `src/05_ui.js`: `UI.showGameOver()` (revive / interstitial), `UI.showComplete()` (post-level break), `startLevel()` / `pauseGame()` (gameplay start/stop events).

## Gameplay systems (v1.1)
* **Sword** (found in Page 1, kept forever): slash curtain gates open, break pottery, kill blobs, bat cannonballs back (they then kill blobs and smash pottery), hit-hop when you slash in mid-air. Armored guards can only be *stunned* by stomping — slash them to win.
* **Shield:** the real shield sprite on your arm; absorbs exactly one hit, then shatters.
* **Combo chain** (smash / stomp / slash / star), juice (hit-stop, camera punch, kill spin, flying stars, trails, confetti), **skins** (unlock with stars), **14 badges**.
* **Rewarded revive:** set `Portal.hasRewarded = true` and implement `Portal.rewarded(done)`; a REVIVE button then appears on the out-of-lives card.

## Mobile & performance
* Landscape-first: a "rotate your device" card appears in portrait and the game auto-pauses. Touch buttons (sliding d-pad, jump, slash) appear only on touch devices and only during play; UI scales up on small screens; fullscreen buttons hide where the browser can't do fullscreen (iPhone).
* Pixel budget is capped on touch devices and quality drops automatically (ambient bits → glows/second doodle layer → fewer particles) if frame time stays high. Verified ~55 fps at 4× CPU throttle on phone-size and tablet viewports (`tools/run.sh tools/mobile.js`).

## Submission checklist
* Upload `index.html` + `assets/` (or the standalone file). No external requests, ~250 KB total, saves to localStorage with graceful fallback.
* `marketing/` holds 1280×720 screenshots and a 512×512 icon.
* Analytics events are emitted through `Portal.track(...)` (level_start, level_complete, death with cause + column) — hook them to your portal's analytics.

## Retention features (v1.2)
* **Endless Dash** (`buildEndless(seed)` in `src/levels.js`): ~590 columns of seeded, chunk-built level that never repeats — gaps, pottery, cactus, curtain gates, blobs, saws, cannons, armored guards, rest stops with a checkpoint + shield + heart, and a twist every 7th chunk (smash room, eraser chase, crumbling planks, star shower). The theme flips every few chunks ("NEW PAGE"). Scored by distance; best saved. `ENDLESS=1,2,3 node tools/validate.js` audits any seeds.
* **Page twists:** P1 the Eraser chase · P2 Big Blob boss (only a batted-back cannonball hurts it) · P3 collapsing planks · P4 the Headmaster boss (slash him, jump the slam waves). The exit door stays sealed until a boss is down.
* **Mobile:** landscape rotate prompt, big touch buttons, adaptive quality (auto-drops effects on slow devices).

## Playful mechanics (v1.4)
* **Moving planks** (`movers` in level data): ride them across pits; a dotted rail shows the path. **Glass trampolines** (`G` tile): land on one to launch up to hidden star ledges. **Pot party** (`rain`): shadows appear, pottery rains down, smash them all for a bonus.
* **Chargers** (yellow, dash at you after a "!") and **flyers** (winged, hover at head height) join the purple blobs and armored guards.
* **Teaching prompts:** a key cap appears over curtains/guards that need the slash button, and a banner appears after you pick up the sword (a sword icon on touch devices).
* **Page looks:** each page has its own paper, ground, sky, weather and living background (see `THEMES`, `drawScenery`, `drawAmbient` in `src/04_render.js`).

## Controls
Arrows / A D move · W / ↑ / Space jump · X (J, K) sword · Esc / P pause · R restart · M mute · F fullscreen. Touch buttons appear automatically on touch devices.

## Retention and balance pass (2026-10)
* The main **PLAY** button now starts the first available page immediately. The interactive tutorial remains available from **HOW TO PLAY**, so new players can choose to learn first instead of being forced through a long tutorial before reaching the game.
* Page 1's arena is moved away from the opening route so the player can collect the sword early, learn the slash mechanic at the first curtain, and meet the first enemy soon afterward.
* The moving-plank set-piece has a closer landing platform, reducing the most demanding required hop from about 91% to about 57% of estimated jump reach in the level audit.
* Validation: `node tools/validate.js` and `ENDLESS=1,2,3 node tools/validate.js` both report zero problems.


## Retention redesign (2026-10, v1.5)
* **Page Quest:** each campaign page now surfaces a clear optional objective in the HUD. Completing it awards +350 score, bonus ink, celebratory effects and a sound cue.
* **Ink meter / Ink Rush:** active play (collecting, smashing, slashing and defeating enemies through the existing combo system) charges a meter. At 100%, press **X** to spend it on a 3.2-second power window with wider, faster slashes. String together hits to extend the rush and earn extra score.
* **Forward slash lunge:** every sword swing now carries a short forward burst, making combat and breakable-object interaction feel active instead of stationary. During Ink Rush, the lunge and attack cadence are stronger.
* **Feedback:** quest progress, ink percentage, rush timer, and a temporary red ink aura are shown in play. The existing licensed scribble sprites, sword, particles, confetti, and sound system are reused rather than adding heavy external assets.
* **QA:** `node tools/validate.js` reports zero geometry issues. Browser automation could not be run in this environment because the bundled test scripts expect Playwright at a machine-specific path; manual playtesting is still required before release.
