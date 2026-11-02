# Spec: 003 — Draw Results

## User goal
See the latest draw: first prize number and all other prize tiers, with a link to winners.

## Affected components
`ResultHero` (full-bleed, six animated digit tiles), `PrizeTabs` (Top prizes / Digit prizes tabs with prize rows).

## Translation keys
`results.*`.

## Route impact
`/[locale]/results`.

## State and storage
None.

## Data
`getLatestDraw()` (mock).

## SEO
Metadata; JSON-LD `Event`-style `WebPage` with draw date (`datePublished`).

## Animation
Digit tiles flip in one after another; tab underline slides via shared `layoutId`; panel cross-fades on tab change.

## Tests and validation
`PrizeGrid.test.tsx`, `ResultBanner.test.tsx`.
