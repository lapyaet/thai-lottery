# Spec: 010 — AI Chat Bot (3D Robot)

## User goal
Open a chat page where a friendly 3D robot lives in an animated scene and "talks" with me. I type a message, the robot reacts (listens, thinks, talks) and a reply appears in a chat panel. **This feature is UI only**: the AI API is added later behind a single seam; for now a stub returns a placeholder reply so the whole experience can be built and tested.

## Layout
Full-screen stage (viewport minus header) with **one place for the AI's answer: the robot's speech bubble**. Desktop (lg+): the scene fills the stage, the robot is centred, the bubble sits beside its head, and a slim input bar floats at the bottom centre. Phone / tablet: robot on top, the bubble directly under it at full width (scrolls when long), the input bar at the bottom. There is no separate message list on screen. Scene follows the app's dark mode.

## Experience
1. **Idle** — the robot floats and bobs, blinks, antenna glows softly, head slowly looks around. A greeting bubble appears from the robot.
2. **Typing** — while I type, the robot turns to face the input and its eyes follow (**listening**).
3. **Sending** — pressing Send adds my message to the list; the robot nods once.
4. **Thinking** — antenna pulses, eyes become scanning dots, small orbiting particles; a "thinking" typing-indicator bubble appears in the chat.
5. **Talking** — the reply streams in character by character **inside a speech bubble next to the robot's head** (tail pointing at it), so it reads as the robot speaking; its mouth/eye-bar pulses and arms gesture while text is arriving. While thinking the bubble shows typing dots; at rest it shows the robot's latest reply (or the greeting); on error it shows the error text. The bubble also shows the user's last question as a small line above it. On error the bubble has a **Try again** button. A visually hidden live log (`role="log"`) keeps the full conversation for screen readers.
6. **Back to idle** — robot returns to the idle loop.
7. Quick-reply **suggestion chips** (e.g. "Latest draw result", "How to buy a ticket") fill and send a message.
8. A **Clear chat** button resets the conversation and the robot waves.
9. Error state (the stub/seam rejects): robot shakes head, red antenna flash, an inline error with **Retry**.

## Affected components
New (`src/component/chat`): `ChatLoader` (client wrapper, `next/dynamic`, `ssr: false`), `ChatStage` (layout + state wiring), `ChatScene` (react-three-fiber world: backdrop, floor, lights, particles), `Robot` (procedural jointed robot: body, head, visor/eyes, antenna, arms, hover jets), `RobotBubble` (speech bubble beside the robot; decorative, `aria-hidden`, the sr-only `ChatLog` is the accessible copy), `ChatComposer` (input bar, suggestion chips, clear), `ChatLog` (sr-only live log), `robotColor.ts` (state → light colour).
New libs: `lib/robot.ts` (pure: `robotPose(state, t)` → head/arm/antenna/eye parameters per state, smooth blending, blink schedule; tested), `lib/chat.ts` (pure helpers: message factory, id, `streamChunks` for typing effect; tested), `lib/chat-service.ts` (**the single AI seam**: `sendChatMessage(history, signal): AsyncIterable<string>`, stub now, real API later).
New store: `store/useChatStore.ts` (`useChatStore`: `messages`, `status: idle | thinking | talking | error`, `send`, `retry`, `clear`).
New types: `types/chat.type.ts` (`ChatMessage`, `ChatStatus`).
Modified: `MainNav` (new "Chat" item), `Header` (the mobile nav row scrolls sideways now that it has five items), `sitemap.ts`.
Dependencies: none new (`three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` already installed).

## Translation keys
`nav.chat`, `meta.chat.*`, `chat.*` (title, subtitle, greeting, placeholder, send, clear, retry, thinking, error, suggestions.*, status.*, noWebgl) in both `en` and `my`.

## Route and middleware impact
New route `/[locale]/chat`, indexable, added to the sitemap. No proxy change.

## State and storage
Zustand `useChatStore`. Conversation is **in-memory only** (not persisted) in this version. Robot animation state is a mutable ref derived from `status` + typing flag (not React state) so `useFrame` never triggers re-renders.

## API and service changes
**None in this spec.** `lib/chat-service.ts` exposes the contract below and ships a stub (short delay, then a canned reply streamed in chunks). A later spec replaces the body with a call to a real endpoint; UI, store and robot stay unchanged.
```ts
sendChatMessage(history: ChatMessage[], options?: { signal?: AbortSignal; locale?: string; instant?: boolean }): AsyncIterable<string>
```
No API keys, env vars or route handlers are added.

## SEO
`generateMetadata` via `buildMetadata`. Server-rendered `sr-only` `<h1>` and description; canvas is `aria-hidden`. The conversation is real DOM (sr-only list with `role="log"`, `aria-live="polite"`), so content is accessible without WebGL.

## Accessibility and performance
- Code-split: three.js loads only on this route, client-side, with a skeleton.
- `prefers-reduced-motion`: robot holds a calm static pose with only a slow blink; no particles, no streamed typing delay.
- No WebGL: hide the canvas, chat panel fills the stage.
- Keyboard: Enter sends; the input is labelled; chips are buttons.
- Pixel ratio capped at 2.

## Animation
Robot: react-three-fiber `useFrame` driven by `robotPose` (idle float, blink, nod, think-scan, talk-pulse, wave, head-shake); the camera leans slightly toward the pointer. UI: Framer Motion (message spring-in, typing dots, chips stagger, panel slide on phone) using shared variants from `src/lib/motion.ts`.

## Tests and validation
Jest: `robot.test.ts` (pose per state, continuity of blending, blink schedule bounds), `chat.test.ts` (message factory, `streamChunks`), `chat-service.test.ts` (stub yields text, honours abort), `useChatStore.test.ts` (send → thinking → talking → idle, error + retry, clear), `RobotBubble.test.tsx` (greeting, thinking dots, latest bot reply, user echo, error + retry), `ChatComposer.test.tsx` (send via button/Enter, chips, clear), `ChatLog.test.tsx`. WebGL canvas verified manually in a real browser (idle/listening/thinking/talking/error; day and night; desktop and phone). `npm run lint && npm test && npm run build`.
