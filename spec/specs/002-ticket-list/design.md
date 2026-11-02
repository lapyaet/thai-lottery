# Design: 002-ticket-list

Follows `spec/DESIGN.md` tokens. Layout and visual structure come from the Myanmar Lottery artifact page for this section; all colors use theme tokens (no literal hex in components), spacing mobile-first.

## Filter sidebar

Ported from the reference explore page: `rounded-[14px]` card with border and soft shadow, "Filters" heading with an underlined "Reset filters" link, sections divided by borders (Number type checkboxes, Featured chip, Sort by radios). From `lg` it is a sticky 288px column left of the grid; on phones it collapses behind a sliders icon. Selected chip uses `bg-primary/10 text-primary`.
