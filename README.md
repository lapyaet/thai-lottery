# Myanmar Lottery

Mobile-first lottery ticket web app. Next.js (App Router) · Tailwind CSS v4 · shadcn/ui · Framer Motion · react-hook-form + zod · next-intl (`en`, `my`) · Zustand · Jest.

Built spec-first, following the `just-ym-hotel-ticket` flow: read [spec/constitution.md](spec/constitution.md), then the per-feature folders in [spec/specs/](spec/specs/) (`spec.md` → `plan.md` → `tasks.md` → `design.md`).

## Scripts

```bash
npm run dev     # http://localhost:3000 (redirects to /en)
npm run lint
npm test
npm run build
```

Set `NEXT_PUBLIC_SITE_URL` for canonical URLs, sitemap and Open Graph.

Data is mocked in `src/lib/lottery-data.ts` (single seam); auth and payment are mock too.
