# Retention redesign notes — 2026-10

## Why this pass changes the loop
The previous balance pass mainly moved the sword and eased a moving-platform jump. That does not solve the deeper retention issue: collecting the sword does not create a continuing goal or change how movement feels.

## New player-facing systems
- **Page Quest:** a visible optional objective is chosen from content available on each campaign page. Progress is updated by collecting stars, smashing pottery, defeating enemies, or cutting gates. Completion gives +350 score, +35 ink, celebration effects, and audio feedback.
- **Ink meter:** combo actions charge the meter after the sword is collected.
- **Ink Rush:** press X at full ink to spend it. For a short window, slashes reach farther and recover faster; the sword attack also lunges forward. Successful hits, pottery breaks, and gate cuts extend the rush slightly and grant bonus score, encouraging players to chain actions rather than simply run to the exit.
- **HUD feedback:** objective progress, meter charge, and the rush countdown are visible during play. A red aura indicates the active power window.
- **Asset reuse:** this pass uses the existing sword, paper/ink palette, particles, confetti, and procedural audio instead of introducing external libraries or heavy assets.

## Geometry and syntax checks
- `node tools/validate.js`: 0 reported geometry problems.
- `ENDLESS=1,2,3 node tools/validate.js`: 0 reported geometry problems across tested endless seeds.
- Source and built inline JavaScript syntax checks passed.
- Browser automation did not complete in this environment; the existing test scripts expect Playwright at a machine-specific path. Do not treat this as final QA.

## Recommended playtest
1. Start Page 1 fresh.
2. Check whether the page quest is understandable at a glance and encourages fighting instead of running past the enemies.
3. Collect the sword, chain stars / pottery / enemy hits, and confirm Ink Rush is reachable without grinding.
4. Verify the forward lunge feels controllable on desktop and touch.
5. Check that the quest and ink HUD do not obscure boss bars, prompts, or mobile buttons.
6. Tune meter gain, rush duration, and quest target based on actual player sessions.
