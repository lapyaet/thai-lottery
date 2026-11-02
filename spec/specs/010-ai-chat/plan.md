# Plan: 010 — AI Chat Bot (3D Robot)

## Sequencing
1. Types + pure libs with tests: `types/chat.ts`, `lib/chat.ts`, `lib/robot.ts`.
2. AI seam: `lib/chat-service.ts` stub + test.
3. `store/useChatStore.ts` + test (status machine: idle → thinking → talking → idle, error, retry, clear, abort on clear/unmount).
4. Translations (`chat.*`, `nav.chat`, `meta.chat.*`) in `en.json` and `my.json`.
5. DOM UI: `ChatMessage`, `TypingIndicator`, `ChatPanel` + test.
6. 3D: `robotColor.ts`, `Robot` (procedural parts, `useFrame` applies `robotPose`), `ChatScene` (lights, floor, backdrop, particles, bloom), then `ChatStage` (layout, wires store status/typing into the robot state ref, no-WebGL and reduced-motion paths), `ChatLoader`.
7. Route `src/app/[locale]/chat/page.tsx`, `MainNav` item, `sitemap.ts`.
8. `npm run lint && npm test && npm run build`; browser check of every robot state, day/night, desktop/phone.

## Notes
- Pure `robotPose(state, t)` is the single source of truth for robot motion; the component only applies numbers to meshes, same pattern as `lib/story.ts` for the lucky tree.
- Pose blending uses exponential smoothing per parameter so state changes never snap.
- Swapping in the real AI later touches only `lib/chat-service.ts` (+ a route handler/env in its own spec).
- Constitution says "Framer Motion only" for animation; 3D uses r3f `useFrame`, as already approved for spec 009. No constitution change needed.
