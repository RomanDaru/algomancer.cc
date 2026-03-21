# Changelog

## 2026-03-21

### `feat/decks-followups`
- Fixed `/decks` element filtering for `Dark` and `Light` by correcting the shared primary element source-of-truth and by filtering element-selected browse results from hydrated card data instead of stale stored `deckElements`.
  - Areas: `app/lib/utils/elements.ts`, `app/lib/db/services/deckDbService.ts`, `app/lib/services/deckService.ts`, `app/lib/utils/__tests__/elements.test.ts`, `app/lib/services/__tests__/deckService.test.ts`
  - Verification: targeted Jest deck browse tests plus targeted lint
- Added browser-level Playwright coverage for `/decks` multi-page browsing, sort changes, and search results spanning more than one page.
  - Areas: `playwright.config.ts`, `e2e/decks.spec.ts`, `package.json`, `jest.config.js`
  - Verification: `pnpm test:e2e`
- Corrected the `/decks` result summary so it reports the number of visibly rendered deck cards instead of the larger client-side preload count, and added stable a11y selectors for deck browse controls.
  - Areas: `app/decks/PublicDecksClient.tsx`, `app/decks/__tests__/PublicDecksClient.test.tsx`
  - Verification: `pnpm test -- --runInBand`, `pnpm build`
- Refactored `/decks` browsing to use cursor pagination for both public decks and `/decks?card=...` card-specific browsing.
  - Areas: `app/decks/PublicDecksClient.tsx`, `app/decks/page.tsx`, `app/api/decks/public/route.ts`, `app/api/decks/card/[id]/route.ts`, `app/lib/services/deckService.ts`, `app/lib/db/services/deckDbService.ts`, `app/lib/types/deckBrowse.ts`, `app/lib/utils/deckPagination.ts`
  - Verification: full Jest suite plus isolated production `next build`
- Moved element and deck badge filtering to the server-driven browse flow and added API metadata/guardrails (`total`, `warnings`, invalid cursor `400` handling).
  - Areas: `app/api/decks/public/route.ts`, `app/lib/services/deckService.ts`, `app/lib/db/services/deckDbService.ts`
  - Verification: route unit test plus targeted lint
- Added repo workflow for keeping a running change log automatically.
  - Areas: `AGENTS.md`, `docs/CHANGELOG.md`
  - Verification: manual review

### `main`
- Fixed the public decks page so users can browse beyond the first 36 decks instead of stopping at the initial server slice.
  - Areas: `app/decks/PublicDecksClient.tsx`, `app/decks/page.tsx`, `app/api/decks/public/route.ts`, `app/lib/constants/index.ts`, `app/decks/__tests__/PublicDecksClient.test.tsx`
  - Verification: Jest deck pagination test, full Jest suite, isolated production `next build`
