## Scene
**Layered background (`ChatBackground`)**, back to front: gradient sky; three big soft glow orbs drifting slowly (violet, cyan, pink; additive at night, pastel by day); twinkling stars at night; two HUD-style arc rings rotating slowly behind the robot; floating numbered lottery balls (12, bobbing and turning) on both sides; a glowing perspective grid floor that flows toward the camera and fades into the distance. Rings and grid take the robot's state colour (cyan/amber, red on error, green on wave). Reduced motion: everything static.

Original base: soft gradient backdrop (day: pale sky-to-lavender; night: deep navy-to-indigo) with a glossy circular platform under the robot, a ring of faint light that pulses with the robot state, and slow floating particles (dots/rings). Gentle bloom. Camera frames the whole robot and platform and backs off on narrow screens; it leans slightly toward the pointer and eases back (no orbit controls).

## Robot (procedural, three.js primitives)
- **Body:** rounded capsule torso in white/pearl with a coloured chest panel (the Thai-lottery gold accent) and a small glowing core.
- **Head:** rounded box with a dark glass visor; two glowing eye bars (cyan day, warm amber night) that can blink, squash into a smile, scan as dots (thinking) or flash red (error). Side ear discs.
- **Antenna:** thin stalk with a glowing bulb whose colour/pulse encodes state.
- **Arms:** two jointed arms (shoulder, elbow, hand) for wave, gesture and nod support.
- **Hover:** no legs; a soft jet glow and shadow blob under the body, body bobs on a sine.

## State → motion (`lib/robot.ts`)
| State | Head | Eyes | Arms | Antenna |
|---|---|---|---|---|
| idle | slow look-around | blink every 2–5 s | relaxed sway | soft cyan pulse |
| listening (typing) | turns toward input, slight tilt | wide, follow | still | steady bright |
| sending | one nod | squint | still | flash |
| thinking | slow side-to-side scan | scanning dots | one hand to chin | fast pulse + orbiting particles |
| talking | small bobs | smile bar pulsing with text arrival | alternating gestures | rhythmic glow |
| error | head shake | red | drop | red flash |
| wave (on clear/first load) | tilt | smile | right arm wave | green flash |

## Input bar
A slim glass pill: single-line input, round Send button, small Clear (trash) icon button. Suggestion chips sit above it until the first message. Desktop: floating, bottom-centre, ≤ 560 px wide. Phone: full width under the bubble. It never shows replies; those live only in the robot's bubble.

## Motion
Message spring-in, chip stagger, typing dots, sheet slide. Reduced motion: no particles, static pose with slow blink, reply appears at once.

## Speech bubble
The one place the AI answer is shown. A rounded card bubble with a small tail pointing at the robot. Desktop: beside the head, up to ~340 px wide, scrolls when long, text follows the stream. Phone: a full-width block directly under the robot, scrolling when long, tail pointing up. A small "You: …" line above it echoes the last question; on error it holds a Try again button. Pops in with a scale from the tail side; while thinking it shows three bouncing dots. Reduced motion: no pop animation or bouncing.

