# Spec: 004 — Winners and Ticket Checker

## User goal
Enter a 6-digit ticket number to learn whether it won, and browse all winners.

## Affected components
`WinnerHero` (full-bleed header hosting the checker), `CheckTicketForm` (react-hook-form + zod, card), `WinnerList` (first-prize feature card, tier cards, digit prizes, claim location), `lib/lottery.ts#checkTicket`.

## Translation keys
`winners.*`, `errors.*`.

## Route impact
`/[locale]/winners`.

## State and storage
None (form state in react-hook-form).

## Data
`getWinners()`, `checkTicket(num)` matching exact, last 3 and last 2 digits; best prize wins.

## SEO
Metadata for the winners route.

## Animation
Confetti-like emoji bounce on hero; result panel spring-in/out via `AnimatePresence`.

## Validation
zod: required, digits only, exactly 6 digits.

## Tests and validation
`checkTicket` unit tests, `CheckTicketForm.test.tsx` (validation messages, win, lose).
