# Spec: 005 — Cart

## User goal
Review, remove, and total selected tickets, then continue to checkout.

## Affected components
`PageHeader` (shared full-bleed title band), `CartList` (ticket-stub rows), `CartSummary` (sticky order summary), `EmptyState`.

## Translation keys
`cart.*`.

## Route impact
`/[locale]/cart` (noindex).

## State and storage
`useCartStore` (persisted key `cart`): `items`, `add`, `remove`, `toggle`, `clear`, selectors `total`, `count`, `has`.

## SEO
`noindex`.

## Animation
Items exit with height collapse; total animates on change.

## Tests and validation
`useCartStore.test.ts`, `CartList.test.tsx`.
