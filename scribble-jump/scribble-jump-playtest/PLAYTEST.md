# Playtest build — Scribble Jump

This build is for external playtesting, not a final portal submission.

## What's changed in this pass

- Fixed the Page Quest and Ink Rush gameplay methods that the previous prototype referenced but did not define.
- Each campaign page selects one optional objective based on content available on that page: collect stars, smash pottery, defeat enemies, or cut curtain gates.
- Completing a quest awards 350 bonus points, 35 ink, a clear completion callout, particles, a shock ring, confetti and the existing completion sound.
- Combo milestones now award score at 3 / 6 / 10 actions, with increasing reward callouts and stronger effects.
- Ink charges through the existing combo/action loop. At 100%, the next sword input activates a 3.2-second Ink Rush with wider slashes, faster attack cadence, a stronger lunge, and extension from successful combat/destruction.
- Existing licensed sprites and effects are retained; no original PNG assets were removed.

## Quick test path

1. Start a fresh Page 1 run and confirm the Page Quest appears in the HUD.
2. Collect the sword. Smash pottery, collect stars and hit enemies to build combos.
3. Verify the combo reward callouts appear at 3, 6 and 10 chained actions and that the score increases.
4. Fill the ink meter and press X. Confirm Ink Rush activates, the aura appears, slashes feel stronger, and the meter/timer updates.
5. Complete the Page Quest. Confirm the objective stops progressing, the completion reward triggers once, and the score is increased.
6. Smash pottery repeatedly and verify the existing shard, puff, shock-ring, hit-stop and sound effects remain present.
7. Test keyboard and touch controls, death/respawn, pause/resume, restart and level completion.

## Known validation limits

- `node build.js` completes successfully.
- JavaScript syntax check (`node --check` on the concatenated source) passes.
- `node tools/validate.js` reports zero level-geometry problems.
- Automated browser playtesting was not available in the build environment. Please test the attached standalone HTML in a normal browser and report any gameplay bugs, confusing prompts, or moments where you stop wanting to continue.
