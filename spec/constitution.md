# Project Constitution

## Purpose and precedence

Highest-priority source of truth for this repository (Myanmar Lottery web app). The delivery flow mirrors the reference app `Digit-House/just-ym-hotel-ticket`.

Precedence: 1. constitution.md → 2. `specs/NNN-*/spec.md` → 3. `plan.md` → 4. `tasks.md` → 5. notes, README, code comments.

## Delivery workflow

1. Confirm the constitution still matches the intended change.
2. Create `spec/specs/NNN-feature-name/spec.md`, `plan.md`, `tasks.md` (+ `design.md` for UI work).
3. Approve spec, plan and tasks before changing product code.
4. Execute tasks in order; close a task only after its validation commands pass.

Absolute ban: no implementation without an approved spec, plan and task set.

Every `spec.md` declares: user goal · affected components · translation keys · route impact · state/storage · data/service changes · SEO · animation · tests and validation commands.

## Stack baseline

- Next.js App Router, locale-scoped routes `src/app/[locale]/...`, React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix) primitives in `src/components/ui`; no second component kit
- Animation: **Framer Motion** only (shared variants in `src/lib/motion.ts`)
- Forms: **react-hook-form** + `@hookform/resolvers` + **zod**; no ad-hoc controlled-input form state
- State: Zustand, one store per domain under `src/store`, default export `use<Domain>Store`; persist only what must survive reload (cart, theme, session)
- i18n: `next-intl`, locales `en` and `my`; `src/proxy.ts` negotiates locale; catalogs in `src/messages/<locale>.json`
- SEO: every route exports `generateMetadata` via `src/lib/seo.ts`; `sitemap.ts`, `robots.ts`, JSON-LD where meaningful; private routes are `noindex`
- Testing: **Jest** + Testing Library (`jest-environment-jsdom`), tests live next to code in `__test__` folders
- Lint: ESLint (`eslint-config-next`); package manager: npm

## Architecture constraints

- `src/app` routes only; feature UI in `src/component/<feature>`; shadcn primitives only in `src/components/ui`
- `src/lib` pure helpers (testable without React), `src/store` Zustand, `src/types` shared types, `src/messages` catalogs
- Domain data goes through `src/lib/lottery-data.ts` (the single data seam; mock now, swappable for a real API)
- Imports use the `@/*` alias; no relative imports across feature folders
- Route access control (cart/checkout/profile need a session) lives in one place: `AuthGate` component, not per page

## Localization

All user-visible strings are localizable. New features add keys to **both** `en.json` and `my.json` in the same change.

## Quality gates

- `npm run lint`
- `npm test`
- `npm run build` when touching routing, metadata, or runtime-critical code

A task is not complete until its acceptance criteria and validation commands pass.

## Change control

Changing this constitution requires documenting which rule changes, why, which specs/code are affected, and new validation requirements.
