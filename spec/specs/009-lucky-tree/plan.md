# Plan: 009 — Lucky Tree

## Sequencing
1. `lib/story.ts` (+ tests): house/door/path geometry, `boyPose`, `doorOpen`, `shakeAmount`, durations.
2. `lib/envelope.ts` (+ tests): `floatPose`, `createEnvelope`, `stepEnvelope`.
3. `lib/tree.ts`: leaf orientation (droop, face outward); remove the unused falling-particle physics.
4. Scene pieces: `TreeModel` (curved veined leaves, bark, fruit), `House`, `Boy`, `Envelope`.
5. `LuckyScene`: a story hook (`useFrame` at negative priority) advances phase time, calls `onPhaseEnd`, and shares a `story` ref with the pieces; remove wind streaks (the tree is shaken by the boy, not the wind).
6. `LuckyStage`: new phases (`walking → shaking → dropping → opening → done`), per-phase safety timeouts, status caption, live region.
7. Translations, nav, sitemap (already done), docs.
8. Lint, tests, build, browser check at each phase, day and night.

## Notes
- The scene reads time from a shared `story` ref so pure functions in `lib/story.ts` stay the single source of truth for what the boy, door and tree do at time `t` in a phase.
- Leaves stay attached; only the envelope falls.

## Revision plan
1. `lib/envelope.ts` → many hanging envelopes + pick one + swing physics; tests.
2. `lib/rabbit.ts` → pure behaviour (wander, play/chase, rear up, nibble, binky leap); tests.
3. Scene: `HangingEnvelopes`, simplified `Envelope`, jointed `Boy`, `Meadow` (instanced tufts; wind bend in the vertex shader so thousands of blades cost nothing per frame in JS), `Rabbits`.
4. Stage: centred result card with a scrim.
5. Verify all phases in the browser at day/night and phone width.
