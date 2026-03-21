# Changelog

## 2026-03-21

### `feature/card-change-review-admin`
- Added an admin-facing card change review workflow at `/admin/cards` for updating live cards, classifying updates, and previewing impacted deck usage.
- Added card review metadata (`rulesVersion`, `rulesUpdatedAt`, `assetUpdatedAt`, `lastChangeSummary`, `lastChangeScope`) and deck review metadata (`needsReview`, `lastReviewedAt`, `reviewFlags`) to support short-term card iteration safely.
- Added automatic deck flagging for rules changes and automatic review reset when a deck owner saves or edits a deck again.
- Added usage lookup for cards in decks and regression tests covering rules-change flagging plus asset-only updates.

### `feat/decks-followups`
- Standardized deck browse card heights so `/decks` no longer jumps when filtering decks with different title, badge, description, or author lengths.
  - Areas: `app/components/DeckCard.tsx`, `app/components/UserNameWithRank.tsx`
  - Verification: targeted lint plus production build
- Tightened deck browse card density so desktop `/decks` views can fit three rows of cards more comfortably within one viewport.
  - Areas: `app/components/DeckCard.tsx`, `app/components/DeckGrid.tsx`
  - Verification: targeted lint plus production build
- Removed deck description notes and section divider lines from browse cards to keep the `/decks` grid smaller and visually cleaner.
  - Areas: `app/components/DeckCard.tsx`
  - Verification: targeted lint plus production build
- Restored stronger deck title sizing and moved the `/decks` loading state into the summary row so filtering no longer inserts an extra layout-shifting line above the grid.
  - Areas: `app/components/DeckCard.tsx`, `app/decks/PublicDecksClient.tsx`
  - Verification: targeted lint plus isolated production build
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
