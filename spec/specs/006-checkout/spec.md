# Spec: 006 — Checkout

## User goal
Provide buyer details, choose a payment method and confirm the order.

## Affected components
`CheckoutForm` (react-hook-form + zod), `OrderSummary`, `PaymentOptions`.

## Translation keys
`checkout.*`, `errors.*`.

## Route impact
`/[locale]/checkout` (noindex, gated by `AuthGate`; empty cart redirects to cart).

## State and storage
Reads `useCartStore`; on success clears cart and appends to `useOrderStore` (persisted `orders`).

## Validation
Full name ≥ 2 chars; phone Myanmar format `^(\+?95|0)9\d{7,9}$`; NRC `^\d{1,2}/[A-Za-z]+\(N\)\d{6}$`; payment method one of `qr | bank | card`.

## SEO
`noindex`.

## Animation
Payment option selection highlight with shared layout; submit button loading state; success toast.

## Tests and validation
`checkoutSchema.test.ts`, `CheckoutForm.test.tsx`.
