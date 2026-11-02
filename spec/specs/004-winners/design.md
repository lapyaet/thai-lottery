# Design: 004-winners

Follows `spec/DESIGN.md` tokens. Layout and visual structure come from the Myanmar Lottery artifact page for this section; all colors use theme tokens (no literal hex in components), spacing mobile-first.

## Layout

Full-bleed hero (same surface as home and results): celebration emoji, title, draw-date chip, and the ticket checker as a centered card (`max-w-xl`). Below, a wide container: a navy first-prize feature card, a 3-column grid of tier cards (2nd, 3rd, neighbor) with a colored header bar and number chips, a "Digit prizes" card with three tiles (front 3, last 3, last 2), and a claim-location card. Everything stacks on phones.
