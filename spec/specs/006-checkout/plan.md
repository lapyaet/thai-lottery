# Plan: 006-checkout

See `spec.md` for scope. Sequencing: types → lib/store (pure, tested) → components → route + `generateMetadata` → translations (en + my together) → tests → lint/build.

Animation uses shared variants from `src/lib/motion.ts`; forms use react-hook-form with zod schemas from `src/lib/schemas.ts`; copy lives under the namespaces listed in the spec.
