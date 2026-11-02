# Design System

Source: the "Myanmar Lottery" artifact (https://claude.ai/artifact/R27mZXqR1M9i98EAf8xTzP). Mobile-first single column, sticky top header with navigation, navy/teal lottery palette with matching dark mode.

## Tokens (mapped onto shadcn variables in `globals.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| background | #dae4e8 | #111f29* | page |
| card | #ffffff | #1c3342 | cards, nav |
| muted | #eef3f5* | #182b38* | inputs, hovers |
| foreground | #1c3342 | #dae4e8 | text |
| muted-foreground | #4a6272* | #9fb4bf* | secondary text |
| border | #c3d2d9* | #2d4859* | borders |
| primary | #1c3342 | #5fd1d4 | buttons, active states, prices |
| hero / hero-deep | #1c3342 / #0f202c* | #1c3342 / #142631* | header, banners, ticket tops (white text) |
| highlight | #5fd1d4 | #82d2d5 | prize amounts, badges, cart count |
| success | #0e7f84* | #5fd1d4 | winner states |

Brand palette: `#FFFFFF #DAE4E8 #82D2D5 #5FD1D4 #1C3342`. Values marked `*` are derived tints/shades of it, added only where the brand colors lack the contrast or depth needed.

Radius 14px (cards) / 8px (controls). Shadows: soft `0 2px 12px` card, `0 4px 24px` hover.

## Type

Headings/numbers: Poppins 700–800, tabular numerals for ticket numbers. Body/UI: Padauk / Noto Sans Myanmar. Ticket numbers use wide letter-spacing (0.15em).

## Layout

- App shell: sticky light header (logo, language, theme, cart with count, profile) with the main nav (Tickets, Results, Winners) as a second row on phones and inline from md up. No bottom bar.
- Ticket grid: 2 columns, 3 from 600px. Filter pills scroll horizontally.
- Toast: pill at the bottom of the screen, auto-dismiss.

## Motion (Framer Motion)

Page/section fade-up, nav underline slides between sections, staggered ticket cards, spring tap on buttons, cart badge bump, animated toast, layout animation on filter changes, winner celebration. Honour `prefers-reduced-motion`.
