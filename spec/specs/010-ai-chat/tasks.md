# Tasks: 010 — AI Chat Bot (3D Robot)

- [x] `types/chat.type.ts`
- [x] `lib/chat.ts` with `chat.test.ts`
- [x] `lib/robot.ts` (`robotPose`, blink schedule, smoothing) with `robot.test.ts`
- [x] `lib/chat-service.ts` stub seam with `chat-service.test.ts`
- [x] `store/useChatStore.ts` with `useChatStore.test.ts`
- [x] Translations `nav.chat`, `meta.chat.*`, `chat.*` in `en.json` and `my.json`
- [x] `ChatMessage`, `TypingIndicator`, `ChatPanel` with `ChatPanel.test.tsx` (superseded below)
- [x] `RobotBubble` (speech bubble beside the robot) with `RobotBubble.test.tsx`
- [x] `ChatBackground` (orbs, stars, HUD rings, lottery balls, grid floor)
- [x] `Robot` (body, head, visor eyes, antenna, arms, hover jets)
- [x] `ChatScene` (lights, floor, backdrop, particles, bloom, day/night)
- [x] `ChatStage` (layout, status → robot state, reduced-motion, no-WebGL) and `ChatLoader`
- [x] Route `/[locale]/chat` with `generateMetadata`, `MainNav` item, `sitemap.ts`
- [x] `npm run lint`, `npm test`, `npm run build` pass
- [x] Browser check (headless Chrome, software GL): wave, idle, listening, thinking, talking; day and night at desktop, night at phone width
- [ ] Browser check: error state; day mode at phone width
- [ ] Check on a real GPU for frame rate; reduced-motion path

## Revision: one place for the answer
- [x] `ChatComposer` (input bar, chips, clear) replaces `ChatPanel`; delete `ChatPanel`, `ChatMessage`, `TypingIndicator`
- [x] `ChatLog` (sr-only live log)
- [x] `RobotBubble`: larger, user echo line, Try again on error, stacked under the robot below lg
- [x] `ChatStage` layout; translations (placeholder)
- [x] Tests: `ChatComposer`, `ChatLog`, `RobotBubble`; lint, test, build; browser check desktop and phone
