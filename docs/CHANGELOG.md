# Changelog

## 2026-09-21

### `main`
- Prepared the approved oracle import and end-to-end support for explicit X costs/stats, Prophecy, Prismite affinity and Augment transfers. Card search, sorting, deck mana curves and admin edits retain these fields; Spell Units retain combat stats. The pinned 340-entry review preserves stable IDs/artwork and the user's Animated Spark edit; known source notation is rendered without stripping costs/choices. Import uses baseline/concurrency checks, BSON backups, a transaction for cards/deck review flags and idempotence guards.
  - Areas: card model/types, card/admin/deck components, oracle utilities, `scripts/apply-oracle-review.cjs`, shared maintenance loader, approved JSON and documentation. Also includes the previously reviewed personal-copy wording, deck tabs and Oracle review page.
  - Verification: 115 Jest tests and 7 Mongo replica-set import tests passed, including stale input, rollback, backup failure and repeat import. Live read-only preflight: 340 writes, 285 rules revisions, 174 affected decks. Production build passed in an isolated local copy (the original `.next/trace` has a Windows access error); Chrome desktop/mobile checks passed with fixture data, separate X/0 curve buckets, working tabs and no page errors or settled-layout overflow. Changed production TypeScript files report no errors; the repository-wide check still reports existing unrelated route/model/test errors. Deployment/database completion will be recorded separately after verification.
- Audited the user-supplied `app/cards/oracle-approved-drafts.json` against the pinned oracle source and current local/public catalogs. All 340 approved entries validate with unchanged baselines; the other 171 catalog cards already match the review proposals. Found one deliberate spelling edit (Animated Spark), retained all Prophecy/X data, and documented remaining model/rendering requirements and source notation. The 340 drafts are still not imported into live cards.
  - Areas: `docs/oracle-review.md`; read-only audit snapshots/differences under ignored `backups/oracle-review-audit-2026-09-21/`. User export preserved byte-for-byte.
  - Verification: duplicate-key/schema/batch/ID checks, all 511 matched cards compared, zero stale approvals, matching local/public catalog fields/images/revisions, `git diff --check`. No application code or database writes; no build required for this audit.
- Completed the local Google sign-in fix by running the dev server on `http://localhost:3000`, matching `NEXTAUTH_URL` and Google's callback, instead of the earlier `127.0.0.1:3210` preview. The user confirmed login works; existing authentication and admin permissions are unchanged.
  - Areas: local dev runtime, local access instructions in `docs/oracle-review.md`.
  - Verification: `/api/auth/providers` returns the matching localhost:3000 sign-in/callback URLs; user completed the card review through the authenticated page.
- Added an admin-only Oracle review page for the supplied 2026-09-21 snapshot: one-card comparison with the current image/catalog, editable proposals, approve/keep/defer decisions, notes, search and filters. Reviews persist per admin/source batch in browser storage, with backup/restore and approved-only export; stale catalog baselines invalidate approval. Prophecy stays a separate alternative cost/condition; X, Augment transfers and source attribution are retained. This is draft review only and does not write to the live catalog.
  - Areas: `app/admin/oracle-review`, `AdminTabs`, `app/lib/utils/oracleReview.ts`, supplied `data/oracle` snapshot/notices, `docs/oracle-review.md`.
  - Verification: 15 targeted Jest tests, scoped TypeScript check, validation of all 511 matched proposals, desktop/mobile browser checks of approval/edit/refresh/backup/restore, no horizontal overflow or browser errors and no Card API writes; anonymous admin route redirects to sign-in. Temporary local preview fixture removed after QA; `git diff --check`.
- Updated ten existing cards from the supplied images: Sarcophage, Stalwart Sentinel, Debt Plant, Deathcoil Construct, Blob of the Dark Order, Greed Angel, Feed to Hooba, Deferral Drone, Tithe Enforcer and Proph. Uploaded immutable Cloudinary originals and replaced gameplay fields while preserving card IDs/indices; rules versions advanced to 2 and 12 affected decks received review flags. Source dates and image hashes are recorded, with unknown years left unset.
  - Areas: `scripts/card-updates/2026-09-21.json`, transactional import CLI and tests, configured MongoDB card/deck data, Cloudinary images, `docs/card-image-updates.md`. Added `Complex` to card types/admin choices and exposed separate attributes in card details.
  - Verification: 3 MongoDB replica-set tests cover atomic rollback, stale/missing records, preserved identities, sideboards and idempotence; 11 targeted Jest tests passed, with the admin round-trip rerun after adding Complex assertions. Local and public catalog APIs matched all 10 entries; all 10 downloaded Cloudinary originals matched source SHA-256 hashes. Database readback verified unchanged decklists/visibility and one current review flag per changed card. Browser review verified all ten card details/images/abilities, Flying attributes, mobile width and no page errors; `git diff --check`.
  - Runtime: backed up originals and transaction inputs under ignored `backups/2026-09-21-card-images-1789962223831/`; restarted local preview at `http://127.0.0.1:3210` with a fresh fetch cache. Card data is visible online; application code changes are local and have not been deployed.

## 2026-09-20

### `main`
- Added Dark and Light affinity to the card model, admin editor, shared calculations and deck affinity curves (including the 10+ cost bucket). Affinity edits retain rules-version/deck-review behavior and now have a specific change summary. Documented image symbols, Augment 1x versus Graft 1, and the confirmed Sarcophage source timestamp (2025-12-30 11:26, timezone unspecified).
  - Areas: card types/schema, card admin, affinity utilities, `DeckStats`, card-change summaries, regression tests, `docs/card-image-updates.md`. Also corrected Augment/once replacement order in the existing local, git-ignored `scripts/convert-creator-cards.js`.
  - Verification: 11 targeted Jest tests passed (including temporary MongoDB and admin-form round trips); local Chrome fixture review of desktop/mobile Dark/Light curves, including 10+ costs, passed without page errors or mobile overflow; isolated converter checks preserve Augment 1X versus Graft1; `git diff --check`.
  - Existing card data was not imported or backfilled. The local dev server was restarted to load the schema change; production was not changed.
- Removed the Main Deck/Sideboard switch from deck details. Both sections now render once, stacked on desktop and mobile, using the existing view and sort controls.
  - Areas: `app/components/DeckDetailViewer.tsx`
  - Verification: local Chrome fixture checks at 1440px and 390px confirmed both sections in compact, list and large views, no switch or duplicate sections, no page errors or horizontal overflow; `git diff --check`.
- Reduced the default deck card grid to five columns on desktop, four on tablets and two on phones. Card-type pie charts now use the deck's most represented element colors, including hybrid elements, with distinct shades for mono-element decks; card counts and percentages are unchanged.
  - Areas: `app/components/DeckDetailViewer.tsx`, `app/components/DeckStats.tsx`
  - Verification: local Chrome fixture review confirmed five desktop columns, mobile layout without horizontal overflow, and deck-derived chart colors; no page errors; `git diff --check`.
- Added Deck/Stats/Results tabs to deck details. Deck uses the full content width, Stats retains the existing composition calculations in a responsive grid, and Results clearly states tracking is not available yet. Added keyboard tab navigation and preserved card-view settings and image export across tabs; mobile viewer controls can wrap.
  - Areas: `app/decks/[id]/page.tsx`, `app/components/DeckStats.tsx`, `app/components/DeckDetailViewer.tsx`, `app/components/DeckOptionsMenu.tsx`, `app/decks/__tests__/DeckPage.test.tsx`, integration plan
  - Verification: 4 targeted Jest tests passed; local Chrome review with fixture API responses at desktop (1440px) and mobile (390px) widths, with no page errors or mobile horizontal overflow; `git diff --check`. Targeted ESLint blocked by missing local `eslint-plugin-react-hooks`. No results backend, account linking, or statistics calculations changed.
- Clarified the tab layout: Stats contains only the existing Deck Statistics component; moving it out gives Deck more room for card images. Game outcomes belong in Results.
  - Areas: `docs/integrations/algomancy-online.md`, `docs/CHANGELOG.md`
  - Verification: checked against the user's correction; `git diff --check`; documentation only
- Recorded the revised deck-centric results design: Deck/Stats/Results tabs, no pilot-view toggle, anonymous public-deck results independent of account linking, and private-copy isolation. Flagged the required model change because existing Game Logs require a user ID.
  - Areas: `docs/integrations/algomancy-online.md`, `docs/CHANGELOG.md`
  - Verification: reviewed against the user's latest decisions; `git diff --check`; no application changes
- Renamed the deck action to "Make a personal copy", clarified the pending/success messages, and added visible guidance that the copy is private and excludes existing game results. Copy behavior remains unchanged.
  - Areas: `app/components/DeckOptionsMenu.tsx`, `docs/integrations/algomancy-online.md`, `docs/CHANGELOG.md`
  - Verification: reviewed the focused UI diff; `git diff --check` passed; targeted ESLint blocked by missing local `eslint-plugin-react-hooks`; no new tests for wording-only changes
- Verified the existing Copy Deck UI creates a private deck under the signed-in user with a fresh ID, both card zones, and no copied game history; documented its differences from the separate copy endpoint and proposed clearer personal-copy wording.
  - Areas: `docs/integrations/algomancy-online.md`, `docs/CHANGELOG.md`
  - Verification: static trace through UI, create/copy routes, database creation and deck-stat grouping; `git diff --check`; no runtime changes
- Reviewed partner repository commit `473866987bd9201535afdc209f05abe494831436`; documented server-side import fields, name mapping, maybeboard semantics, editable imported copies, UUID accounts/Discord linking, saved game data, historical identity attribution, and result-finality/delivery gaps. Updated integration questions and TODOs.
  - Areas: `docs/integrations/algomancy-online.md`, `docs/CHANGELOG.md`
  - Verification: static source inspection with commit-pinned references; `git diff --check`; partner code/dependencies not executed and production behavior not tested
- Recorded the partner's confirmation that deck imports extract the ID from the URL and fetch `/api/decks/<id>`; updated remaining questions and TODOs to preserve the existing API consumer's compatibility.
  - Areas: `docs/integrations/algomancy-online.md`, `docs/CHANGELOG.md`
  - Verification: checked against the supplied partner message; `git diff --check`; documentation only, no live import test or application changes
- Documented the agreed Algomancy.online integration behavior, repository findings, unresolved partner contracts, proposed architecture, and ordered implementation TODOs. No application changes or implementation started.
  - Areas: `docs/integrations/algomancy-online.md`, `docs/CHANGELOG.md`
  - Verification: reviewed against user decisions and inspected repository code; local documentation links checked; `git diff --check`; no application tests required for documentation-only changes

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
