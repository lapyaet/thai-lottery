# Spec: 008-profile

## User goal
See account summary, stats, order history and log out.

## Affected components
`ProfileHeader`, `ProfileStats`, `ProfileMenu`, `OrderHistory`.

## Translation keys
`profile.*`.

## Route impact
`/[locale]/profile` (noindex, `AuthGate`).

## State and storage
Reads `useAuthStore`, `useOrderStore`.

## SEO
`noindex`.

## Animation
Stats count-up; menu rows stagger.

## Tests and validation
`ProfileStats.test.tsx`.
