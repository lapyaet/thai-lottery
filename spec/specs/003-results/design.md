# Design: 003-results

Follows `spec/DESIGN.md` tokens. Layout and visual structure come from the Myanmar Lottery artifact page for this section; all colors use theme tokens (no literal hex in components), spacing mobile-first.

## Layout

Full-bleed hero (same surface as home): draw-date chip, "1st Prize", six digit tiles (`size-12` on phones up to `size-24` on desktop), prize amount, and two buttons (Check my ticket, See all winners). Below, a wide container with underline tabs: **Top prizes** (2nd, 3rd, neighbor) and **Digit prizes** (front 3, last 3, last 2). Each prize is a row card: tier name and amount per ticket on the left, winning numbers as chips on the right (stacked on phones).
