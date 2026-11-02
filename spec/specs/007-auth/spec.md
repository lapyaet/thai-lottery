# Spec: 007 — Log In / Sign Up

## User goal
Log in (or sign up) with phone/email and password to buy tickets and view the profile.

## Affected components
`AuthForm` (split layout: brand panel + form card; login/signup tabs, password show/hide, react-hook-form + zod), `AuthGate`.

## Translation keys
`auth.*`, `errors.*`.

## Route impact
`/[locale]/auth` (noindex). `AuthGate` redirects unauthenticated users from cart checkout/profile to `/auth?next=`.

## State and storage
`useAuthStore` (persisted `session`): `user`, `login`, `logout`. Mock auth: any valid credentials succeed. Social buttons are placeholders (toast "coming soon").

## SEO
`noindex`.

## Animation
Tab switch cross-fade; form field error slide-down.

## Tests and validation
`authSchema.test.ts`, `AuthForm.test.tsx`.
