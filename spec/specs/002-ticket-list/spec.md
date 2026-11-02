# Spec: 002 — Ticket List (Home)

## User goal
Browse available lottery tickets, search by number, narrow them with a sidebar filter (number-type checkboxes, a recommended toggle, sort by number) and add tickets to the cart. The filter layout follows the reference app's explore page.

## Affected components
`HeroBanner`, `TicketSearchForm` (react-hook-form), `TicketFilters` (sidebar card: heading + reset, number-type checkboxes, featured chip, radio sort; collapsible on phones, always open from `lg`), shadcn `checkbox`/`skeleton`, `TicketGrid`, `TicketCard`, `lib/lottery.ts#filterTickets`.

## Translation keys
`home.*`, `filters.*`, `ticket.*`.

## Route impact
`/[locale]` (page.tsx). Metadata + `WebSite` JSON-LD.

## State and storage
`useFilterStore` (search, categories[], isRecommended, sortBy, reset; session only). `useCartStore` (persisted) for add/remove.

## Data
`getTickets()` from `lib/lottery-data.ts` (mock, 18 tickets).

## SEO
`generateMetadata` for home; JSON-LD `WebSite` with `SearchAction`.

## Animation
Hero fade-up, ticket cards staggered, `layout` animation when filter results change (`AnimatePresence mode="popLayout"`), add button tap spring.

## Tests and validation
`lottery.test.ts` (filters), `TicketCard.test.tsx`, `TicketSearchForm.test.tsx`.
