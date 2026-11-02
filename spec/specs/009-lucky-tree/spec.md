# Spec: 009 — Lucky Tree (Random Ticket Generator)

## User goal
Get a random lucky ticket through a small story in a 3D village scene: a young boy walks out of his house to the tree and shakes it. The tree is full of golden envelopes hanging among the branches; when it is shaken, only one of them comes loose and falls. The envelope opens and the lucky ticket is revealed in one card at the centre of the screen. The user can add the ticket to the cart or play the story again.

## Layout
Full-screen stage (viewport minus header) with the scene edge to edge and floating controls. The scene changes between day and night with the app's dark mode.

## Experience (step by step)
1. **Idle** — the tree sways gently with many golden envelopes hanging among the branches. The boy is inside the house, which has a door and (at night) glowing windows. Rabbits play in the meadow.
2. **Walking** — pressing **Shake the tree** opens the door; the boy steps out and walks along the path to the tree.
3. **Shaking** — the boy pushes the trunk with both hands; the tree shakes, the leaves rustle and all envelopes swing. **No fruit or leaf falls.**
4. **Dropping** — **one** randomly chosen envelope (from those visible on the front of the tree) comes loose and floats down, fluttering, to land beside the boy, who looks up and then at it. The others stay on the tree.
5. **Opening** — the fallen envelope lifts to the centre of the view, grows, and its flap opens in a burst of light.
6. **Done** — the envelope fades and **one** lucky-ticket card appears at the centre of the screen (animated digit tiles, serial, price) with **Add to cart**, **Generate again** and a **close (X) button** (Escape or a click on the dimmed background also close it). There is no second ticket anywhere else on screen.
7. **Again** — *Generate again* keeps the boy at the tree: he shakes it once more and a (possibly different) envelope comes loose.
8. **Returning** — *Close* dismisses the card and the boy walks back along the path; the door opens as he arrives, he goes in, and the door closes. The scene returns to **Idle** with all envelopes back on the tree, ready for the next play.

At night, occasional **shooting stars** streak across the sky (every few seconds, purely decorative).

## Affected components
New: `LuckyLoader` (client wrapper, `next/dynamic` with `ssr: false`), `LuckyStage` (phase machine + overlay UI), `LuckyScene` (react-three-fiber world: sky, ground, hills), `TreeModel` (bark, veined leaves, fruit), `HangingEnvelopes` (instanced envelopes on the tree), `Envelope` (the one that falls and opens), `House`, `Boy` (jointed, with face, clothes and walk cycle), `Meadow` (tufted, wind-bent grass and flowers), `Rabbits` (playing rabbits), `LuckyResult`.
New libs: `lib/tree.ts` (seeded tree layout), `lib/story.ts` (timeline: boy path, door, shake amount; pure and tested), `lib/envelope.ts` (hanging envelope layout, which one falls, swing and fall physics; pure and tested), `lib/rabbit.ts` (rabbit hopping/play behaviour; pure and tested), `lib/litter.ts` (occasional loose leaf/fruit), `lib/meteor.ts` (shooting stars; pure and tested), `lib/lucky.ts` (`generateLuckyTicket`), `lib/sky.ts`, `lib/noise.ts`.
Modified: `MainNav` (new "Lucky" item), `sitemap.ts`.
Dependencies: `three`, `@react-three/fiber`, `@react-three/drei` (OrbitControls only), `@react-three/postprocessing` + `postprocessing` (bloom, tone mapping), `@types/three`.

## Translation keys
`nav.lucky`, `meta.lucky.*`, `lucky.*` (including `lucky.status.*` captions for each phase) in both `en` and `my`.

## Route and middleware impact
New route `/[locale]/lucky`, indexable, added to the sitemap.

## State and storage
Stage state is local (`phase`, `ticket`). Adding to the cart uses the existing `useCartStore`; a toast confirms.

## API and service changes
None. Numbers are generated client-side with `Math.random`; it is a toy picker, not a draw.

## SEO
`generateMetadata` via `buildMetadata`. The 3D canvas is decorative (`aria-hidden`); a text heading, description and the generate button carry the content. A polite live region announces each phase and the final ticket.

## Accessibility and performance
- Code-split: three.js loads only on this route, client-side, with a skeleton while loading.
- `prefers-reduced-motion`: skip the story and reveal the ticket immediately.
- No WebGL: show a plain card with the generate button instead of failing.
- Leaves and fruits are `InstancedMesh`es; pixel ratio capped at 2.

## Animation
Framer Motion for UI (result card spring-in, digit flip, button states, status caption). react-three-fiber `useFrame` drives the 3D story (walk cycle, shaking, envelope fall, flap and ticket).

## Tests and validation
Jest: `tree.test.ts`, `story.test.ts` (boy pose per phase, door, shake), `envelope.test.ts` (layout, which one falls, swing, fall, landing), `rabbit.test.ts` (stays in bounds, hops arc, follows when playing, state changes), `meteor.test.ts`, `litter.test.ts`, story tests for the walk home, `lucky.test.ts`, `sky.test.ts`, `noise.test.ts`, `LuckyResult.test.tsx`. The WebGL canvas is verified manually in a real browser. `npm run lint && npm test && npm run build`.
