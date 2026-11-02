# Tasks: 009 — Lucky Tree

- [x] Dependencies (`three`, r3f, drei, postprocessing)
- [x] Realistic day/night sky: sun, moon, stars, Milky Way, clouds, layered hills
- [x] `lib/story.ts` with `story.test.ts`
- [x] `lib/envelope.ts` with `envelope.test.ts`
- [x] `lib/tree.ts`: leaf orientation; drop falling particles and their tests
- [x] `TreeModel` (curved veined leaves, bark, fruit)
- [x] `House` (door, windows, path, night lights)
- [x] `Boy` (walk, push, look up)
- [x] `Envelope` (gold, flap, glow, sparkles)
- [x] `LuckyScene` story hook and wiring; remove wind streaks
- [x] `LuckyStage` new phases, captions, safety timeouts
- [x] Translations (`lucky.status.*`), docs
- [x] `npm run lint`, `npm test`, `npm run build` pass
- [x] Browser check (headless Chrome + WebGL, software rendering): walking, shaking, dropping, opening, done; day and night at desktop width
- [ ] Phone-width check of the full story
- [ ] Check on a real GPU for frame rate; reduced-motion path

## Revision: many envelopes, one ticket, realism, animals
- [x] `lib/envelope.ts`: `buildEnvelopes`, `pickFallingIndex`, `hangPose` (+ tests); drop the single floating envelope
- [x] `HangingEnvelopes` (instanced body, flap, string); chosen one hides when it falls
- [x] `Envelope`: starts from the chosen envelope, grows toward the centre, opens in a burst, then fades; remove the 3D ticket
- [x] `LuckyStage`: one centred result card (with a soft scrim); no ticket anywhere else
- [x] `Boy`: jointed rebuild (knees, elbows, face, hair, plaid longyi, shirt details)
- [x] `Meadow`: tufted grass blades with a base-to-tip gradient, varied height/colour, GPU wind bend; flowers
- [x] `lib/rabbit.ts` (+ tests) and `Rabbits`: three rabbits hopping, chasing, rearing up, nibbling and leaping
- [x] Lint, tests, build, browser check (day and night, desktop and phone)
- [x] `lib/litter.ts` (+ tests) and loose leaf/fruit in `TreeModel`: occasional drops that regrow; decorative only
- [ ] Check on a real GPU for frame rate; phone-width pass of the full story after the rebuild

## Revision: close button, going home, a more real boy, shooting stars
- [x] `story.ts`: `returning` phase (walk back, door opens, he goes in, door closes) + tests
- [x] `LuckyResult`: close (X icon) button, Escape, click on the scrim; `LuckyStage` returning flow; *Generate again* keeps the boy at the tree
- [x] `Boy`: fingers and thumbs, sandals with toes, eyelids, nostrils, lips, ears, hair clumps, pleated longyi, textured skin and cloth, idle glances and weight shift
- [x] `lib/meteor.ts` (+ tests) and `ShootingStars` at night
- [ ] Check on a real GPU; phone-width pass of the full story including the walk home

## Revision: realistic longyi and smooth walking
- [x] `story.ts`: distance-driven walk (`walkDistance`/`walkSpeed` with eased start and stop, `stridePhase`), start/end inside the doorway, turn to face the trunk while arriving; tests for continuity
- [x] `Boy`: cloth longyi draped over the legs, joint smoothing, stride from distance; door re-centred on the boy's path
- [ ] Check on a real GPU: the walk at full frame rate
- [x] Boy restyled to the user's reference: indigo wavy-line longyi with front knot and overlap crease, cream long-sleeve stand-collar shirt, slippers, brown hair, smile
