# Design: 005-cart

Follows `spec/DESIGN.md` tokens. Layout and visual structure come from the Myanmar Lottery artifact page for this section; all colors use theme tokens (no literal hex in components), spacing mobile-first.

## Layout

Full-bleed page header (title, count badge, subtitle). From `lg`: ticket rows on the left, a sticky order-summary card (quantity, subtotal, total, checkout, continue browsing, secure-payment note) on the right; stacked on phones. Each row is a ticket stub: navy number block, dashed divider, serial, draw date, price and a trash button.
