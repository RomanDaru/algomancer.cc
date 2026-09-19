# Changelog

## 2026-09-19

### `feature/performance-homepage`
- Prepared the homepage/performance release: separate physical-game and digital-client homepage links, shared tagged card catalog caching with write invalidation, MongoDB deck search/element filtering before pagination, earlier aggregation limits, and Colorless card search support.
  - Areas: homepage, card catalog/API/search, deck browse API/services/indexes, regression tests
  - Verification: final Jest suite passed 104/104 tests across 18 suites; current production build passed in an isolated directory; live local deck API checks passed for pagination without duplicates, Fire/Dark filtering, and identifier redaction; existing standalone TypeScript blocker and build validation settings remain as documented below
  - Release: user authorized commit and production deployment through the connected `origin/main` Vercel integration; local screenshots excluded from the release
- Added `Colorless` to the shared card search element list, so typing it matches actual colorless cards and the Elements quick filters include a Colorless button in the catalog and deckbuilder.
  - Areas: `app/components/CardSearch.tsx`, `app/components/__tests__/CardSearch.test.tsx`
  - Verification: four component tests passed (case-insensitive search, card-type combination, quick-filter toggle, any/all element matching); targeted ESLint passed; local `/cards` returned HTTP 200 with the Colorless filter and `/decks/create` returned HTTP 200
- Routed bulk card imports through the catalog service so successful writes invalidate the shared card cache; disabled independent HTTP/CDN caching on `/api/cards` while retaining the tagged server data cache. Added explicit `Colorless` support to the card element type without changing filtering behavior.
  - Areas: `app/api/cards/import/route.ts`, `app/api/cards/route.ts`, `app/lib/types/card.ts`, catalog API regression tests
  - Verification: all 100 Jest tests across 17 suites passed; isolated production `pnpm build` passed; targeted ESLint had no errors (one existing unused request warning); local API returned HTTP 200, `Cache-Control: no-store`, 511 cards including 18 Colorless; homepage HTTP 200 with both CTA links
  - Also corrected two admin integration fixtures to respect the two-copy limit and mocked Next's request-scoped cache boundary, with assertions that admin edits invalidate the catalog.
  - Limitation: standalone TypeScript checking still stops at the pre-existing `_tmp_page.tsx:394` syntax error; the existing build config skips type validation and lint. Dev preview remains at `http://127.0.0.1:3000`; no deployment performed.
- Corrected the earlier Colorless review finding after checking actual catalog data: `/api/cards` returns 18 cards explicitly marked `element.type: "Colorless"` out of 511. The new filter can match these cards; the earlier claim that Colorless should mean an unrecognized element was incorrect. The card TypeScript union omits this valid value, and existing deck-element helpers also use it as a fallback; these are separate inconsistencies, not evidence that the new filter is broken.
  - Areas: `docs/CHANGELOG.md`; application code unchanged
  - Verification: read-only local catalog API request and review of card types, MongoDB schema, filter construction, and element helpers
- Reviewed the September 18 hotfix commits and pending homepage/performance changes; started local preview at `http://127.0.0.1:3000` using Next's webpack dev mode because Turbopack rejects the shared `node_modules` junction.
  - Areas: local dev runtime, ignored environment/log files, `docs/CHANGELOG.md`; application code unchanged
  - Verification: homepage HTTP 200 with both new CTA sections; Jest 94/96 passing (two existing admin card fixture failures); TypeScript blocked by tracked `_tmp_page.tsx:394`; `git diff --check` passed
  - Review findings: card import route bypasses catalog invalidation; independently cached `/api/cards` responses can remain stale after tag invalidation; Colorless API filtering no longer follows derived deck-element semantics. Production build and visual browser checks not completed; no deployment performed.

## 2026-09-18

### `hotfix/redact-deck-identifiers`
- Removed `viewedBy` and `likedBy` identifiers from every deck payload sent to the browser while preserving internal view and like behavior.
  - Areas: `app/lib/utils/deckSerialization.ts`, deck API routes, public/profile deck pages, competition entry responses, regression tests
  - Verification: targeted serializer/public deck route tests passed (4/4); `npm run build`; full Jest suite passed 91/93 tests, with two unrelated admin card integration fixture failures

### `hotfix/disable-vercel-image-optimization`
- Disabled Next/Vercel Image Optimization globally so Cloudinary-optimized card images are served directly without redundant paid Vercel transformations.
  - Areas: `next.config.js`, `docs/CHANGELOG.md`
  - Verification: loaded production Next config reports `images.unoptimized: true`; targeted image optimization tests passed; `pnpm build`

## 2026-03-25

### `feature/deck-builder-sideboard`
- Updated the exported `.txt` footer copy to `Generated with ❤️ by Algomancer.cc` while keeping the direct deck URL underneath.
  - Areas: `app/components/DeckOptionsMenu.tsx`, `docs/CHANGELOG.md`
  - Verification: manual code review
- Added Algomancer.cc attribution and direct deck URL footer to exported `.txt` decklists, including sideboard-aware exports.
  - Areas: `app/components/DeckOptionsMenu.tsx`, `docs/CHANGELOG.md`
  - Verification: manual code review
- Added full Sideboard support across deck creation, editing, viewing, exports, copy flows, guest deck persistence, and competition submission validation.
  - Areas: `app/components/DeckBuilder.tsx`, `app/components/DeckCardBrowser.tsx`, `app/components/DeckViewer.tsx`, `app/components/DeckDetailViewer.tsx`, `app/lib/utils/deckSections.ts`, `app/lib/db/models/Deck.ts`, `app/lib/db/services/deckDbService.ts`, `app/lib/services/deckService.ts`, `app/api/decks/route.ts`, `app/api/decks/[id]/route.ts`, `app/api/tts/export/[id]/route.ts`
  - Verification: `pnpm test -- --runInBand app/lib/utils/__tests__/deckSections.test.ts app/lib/services/__tests__/deckService.test.ts`, `pnpm build`, `pnpm exec tsc --noEmit` blocked by pre-existing `_tmp_page.tsx` and `backups/app-decks-id-page.before-refactor.tsx`

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
