# Spec: 001 — App Shell, i18n, Theme, SEO base

## User goal
Open the app on a phone, see a branded sticky header, switch dark mode and language, and move between the five main sections with a top navigation bar.

## Affected components
New: `Header`, `MainNav`, `ThemeToggle`, `LocaleSwitcher`, `Toast` + `useToastStore`, `AppShell`, shadcn `button`/`input`/`label`/`badge`.

## Translation keys
`common.*`, `nav.*`, `meta.*` (en + my).

## Route and middleware impact
`src/proxy.ts` (next-intl) redirects bare paths to `/en`. `[locale]/layout.tsx` owns `<html lang>`, fonts, `NextIntlClientProvider`, theme boot script.

## State and storage
`useThemeStore` (persisted `light|dark|system`), `useToastStore` (session only), `useCartStore` badge read.

## API and service changes
None.

## SEO
`src/lib/seo.ts` `buildMetadata()` (title, description, canonical, hreflang alternates, Open Graph, Twitter, robots), `metadataBase` from `NEXT_PUBLIC_SITE_URL`, `sitemap.ts`, `robots.ts`.

## Animation
Header cart badge bump on count change; nav underline indicator uses shared `layoutId`; toast enter/exit via `AnimatePresence`.

## Tests and validation
Jest: `seo.test.ts`, `ThemeToggle.test.tsx`, `MainNav.test.tsx`. `npm run lint && npm test && npm run build`.
