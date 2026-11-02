## Scene (realistic daylight)
- Meadow with layered ridges, sky, clouds, sun/moon (see Day and night below), the tree right of centre and a small wooden village house on the left with a pitched roof, a door that swings open, windows and a dirt path to the tree.
- **Tree:** tapered bark trunk and curved branches; ~1,500 leaves, each a curved, veined blade that drapes outward and downward in several greens; ~40 glossy fruits with stems. Now and then a single leaf or fruit lets go and drifts down, lies on the grass, fades, and regrows (decorative only; it never affects the ticket).
- **Many golden envelopes** hang on strings among the branches and swing when the tree is shaken. Only one — chosen from those on the camera-facing front — ever comes loose.
- **Boy:** jointed rig with knees, elbows, hands, a face (eyes that blink, brows, nose, mouth, ears), hair with a fringe, a cream long-sleeve shirt with a stand collar and button placket, flat grey-green slippers, brown hair and a smile, and an indigo longyi with subtle wavy lines. The longyi follows the reference image (spec/ reference: indigo wrap skirt): a big folded knot at the front waist with a tab hanging below, a vertical overlap crease down the front that opens at the hem, and it hangs straight like a real cloth tube; and its vertices drape over the legs each frame (a forward leg pushes the front cloth, a backward leg the back cloth, with a ripple down the hem). The walk is driven by distance covered (one footstep per 0.68 m, so feet never skate), eases in and out of speed, and every joint is smoothed so transitions between walking, pushing and standing never snap. Braced two-handed push at the trunk; looks up when the envelope drops.
- **Meadow:** ~14,000 grass blades in clumps, with a dark base fading to a light tip, varied height and colour (including dry patches), bent by the wind on the GPU; wildflowers; the grass is kept short around the trunk, the path and the rabbits' lawn.
- **Rabbits:** three realistic rabbits (brown, grey, cream) with fur texture, long ears, whiskers, cotton tails and jointed legs. Two play chase and swap roles with joyful mid-air leaps; the third nibbles and rears up to look around.
- **Envelope that falls:** metallic gold with a red seal and a flap. It floats down beside the boy, lifts to the middle of the view, grows and opens in a burst of light, then melts away as the ticket card appears.
- Camera pulls back and looks lower on tall/narrow screens so everything fits. Orbit rotation only with a mouse.

## Result card
Exactly one ticket is shown: a card centred on the screen over a soft blurred scrim. Digit tiles flip in one by one; below them serial, price and two buttons: **Add to cart** (primary) and **Generate again** (outline). While the story plays a caption pill at the bottom names the step.

## Motion
Result card spring-in, staggered digit flip, button press scale, caption cross-fade. Reduced motion: no story, the card appears instantly.

## Day and night (follows dark mode)
The scene reads the `dark` class on `<html>` and switches between two procedural skies:
- **Day:** blue sky dome with a warm glow around the sun, a blazing sun (bright core, halo, bloom) and shaded cumulus clouds that drift.
- **Night:** deep navy sky, a cratered moon with dark maria and a halo, ~2,600 twinkling stars, a faint Milky Way, moonlit clouds, fireflies, and warm glowing house windows with a porch light.
- **Hills:** four layered ridge silhouettes; farther layers are taller and bluer, and fog adds aerial perspective.
- Post-processing: subtle bloom and ACES filmic tone mapping. The sun/moon sit inside the camera's view on any screen (`lib/sky.ts`).
