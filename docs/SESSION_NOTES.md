# READ ME FIRST – No-Destructive-Edits Pledge (added 2025-09-06)

I will not repeat today’s mistakes. Before editing existing UI/logic I will:
- Snapshot: create a local backup of any large file I refactor.
- Isolate: work on a feature branch, keep PRs small and focused.
- Minimal surface: never remove existing buttons/UX without explicit confirmation.
- Validate early: run a dev build and fix TypeScript errors before pushing.
- Portals/z-index: prefer portals for dropdowns to avoid clipping; don’t hack overflow.
- Typing: keep ElementType and deck types strict; no implicit any.
- Wire, don’t redesign: hook new actions into existing UI elements.
- Commit in steps with clear messages and be ready to revert quickly.

## 2025-09-06 — TTS Export + Deck Options Refactor

- Branch: feature/tts-export; pushed and opened PR.
- TTS: Added builder pp/lib/tts/buildTTSDeck.ts (1x1 sheets, smaller scale), and API pp/api/tts/export/[id]/route.ts returning <deckname>.json as attachment.
- Card back: single Cloudinary URL (override via TTS_CARDBACK_URL).
- Deck page:
  - Restored Options dropdown; moved next to Share; removed duplicate header Edit/Delete.
  - Extracted DeckOptionsMenu component with portal rendering and outside-click close.
  - Wired Export to JSON (TSS) to the new endpoint; added TXT export and icons.
  - Fixed TS types (ElementType[], typed deck card loops), removed leftover broken code, resolved build error.
- Notes: Saved a snapshot before refactor at ackups/app-decks-id-page.before-refactor.tsx.

# Session Notes — algomancer.cc

Date: 2025-08-31

Use this file to quickly recall what we changed, why, and important app context to keep future work consistent and fast.

## What We Shipped

- Decks page (performance + UX)
  - Converted `/decks` to an RSC that fetches initial data on the server (no spinner flash).
  - Awaited dynamic `searchParams` (Next 15 requirement) and JSON-serialized server data before passing to the client.
  - Fixed deck aggregation lookups to use `cards.originalId` and derived `deckElements` from `card.element.type` (supports hybrids like `Fire/Water`).
  - Limited initial payload (first page only) and prepared for pagination/infinite scroll.

- Cards page (view modes)
  - Large is now the default with 6 columns on desktop; Compact shows many columns; List unchanged.
  - Unified the view toggle to exactly three options: List, Compact, Large.
  - Fixed icon mapping and removed auto-resize coercion so the selected view stays stable.
  - Cleaned up a mojibake glyph in the results line.

- Home page
  - Added a promotional banner linking to the official game at https://algomancy.io/ with styling consistent with the site.

- Card details polish
  - Safer token check: `subType?.toLowerCase()?.includes("token")`.
  - Keep robust stats visibility: `!mainType.includes("Spell")` (covers "Spell Token").
  - Image handling uses `onLoadingComplete`; abortable fetch for related decks; layout fixes.

## Branches / PRs (merged)

- `perf/decks-rsc-initial-load`: RSC initial load + aggregation fixes for `/decks`.
- `ui/cards-view-modes`: Large=6-col by default, Compact=many-cols, fixed icons; included home promo originally.
- `feat/home-algomancy-promo`: Promo-only branch for the home banner.

## Important App Context

- Stack: Next.js App Router (v15), React 19, TypeScript 5, NextAuth, MongoDB/Mongoose, Tailwind.
- Card schema:
  - Primary persistent id in Mongo is `originalId` (not `id`).
  - Element lives at `element.type` (string; may be hybrid like `Fire/Water`).
- Deck schema:
  - `cards: { cardId: string; quantity: number }[]`.
  - `likes`, `likedBy`, `views`, `viewedBy`, `isPublic`.
- Aggregations:
  - Use `$lookup` on `cards.originalId`.
  - Compute `deckElements` by splitting `element.type` on `/` and collecting basics.
- Next 15 dynamic APIs:
  - In RSC pages, `searchParams` must be awaited.
  - Pass only plain JSON across the RSC boundary (serialize Mongoose docs / ObjectIds / Dates).

## Pitfalls / Decisions

- Token detection needs optional chaining; otherwise `.toLowerCase()` can throw.
- Spell stats should be hidden for any type containing `Spell` (e.g., "Spell Token").
- Avoid client-fetching the full card list on `/decks`; rely on server-computed `deckElements`.
- Do not auto-switch view modes on viewport resize; preserve user choice.

## High-Value Next Steps

- Add "Copy Deck" flow: add a Copy button on deck detail to duplicate a deck into the current user's account and open in the builder for edits; prefill name/description/cards; reset likes/views; set `userId` to current user; keep optional attribution (e.g., "Cloned from <deck>"); respect privacy (copy only public decks or owner's private decks).
- Export Decks:
  - Add "Export" on deck detail to download a `.txt` decklist (include deck name, element(s), total count, and lines like `2x Card Name (Element)`; include optional URL and set name/version at the bottom).
  - Add "Export to TTS" option. Plan: generate a TTS-compatible JSON package that maps each card to a spawned object (requires image URLs and a consistent GUID; group cards into stacks by name; include front/back images if available). Research: best format for Tabletop Simulator is a saved object/deck JSON with `CustomDeck` + `ContainedObjects`. We may need a small server action to compose and return the JSON as a file; include instructions for importing into TTS (save to `~/Documents/My Games/Tabletop Simulator/Saves/Saved Objects/`).
- `/decks` pagination / infinite scroll via `limit` + `skip`.
- Optional server-side element filtering in `/api/decks/public`.
- Cache headers for unauthenticated public decks responses.
- Persist deck summary fields (`elements[]`, `totalCardCount`) on write.
- Tighten NextAuth / user typings (`username`, `isAdmin`).
- Modal accessibility polish (focus trap, Escape-to-close, `aria-*`).
- Persist card view mode in `localStorage`.

## Quick Test Reminders

- Run dev: `npm run dev`, open http://localhost:3000
- Cards: `/cards` — default Large (6-col), toggle List/Compact/Large.
- Decks: `/decks` — immediate render; `/decks?card=<id>` shows related decks.
- Home: promo banner under feature tiles linking to `algomancy.io`.

## 2025-09-04 — Copy Deck + Options Dropdown

What we did today

- Implemented Copy Deck end-to-end
  - API: `POST /api/decks/[id]/copy` with auth + privacy rules (copy public decks or your own private decks).
  - New deck is private by default, `youtubeUrl` cleared, metrics reset; name attribution appended: `(Copy from {owner})`.
  - Uses owner info via `deckDbService.getDeckUserInfo` (prefers `username`, falls back to `name`).
- Updated deck detail header actions
  - Replaced multiple buttons with a single right-aligned “Options” dropdown.
  - Entries: Copy Deck, Export deck .txt, Export deck .tss; owner-only: Edit, Delete.
  - Fixed layering (no clipping), added stronger hover, outside-click and Escape-to-close.
- Polished auth + redirect flow
  - Sign-in honors `callbackUrl`/`returnTo` across credentials and Google.
  - Unauthed Copy › sign-in › return to deck › auto-copy › redirect to `/decks/{newId}/edit`.
  - Wrapped auth pages using `useSearchParams` in `<Suspense>` to satisfy Next 15 CSR bailout.

Learnings / notes

- Next.js 15: client usage of `useSearchParams` must be inside a Suspense boundary or you get a CSR bailout error during build.
- For dropdowns inside decorated headers, keep rounded/overflow on the background layer only; render content above it with `z-index` and avoid clipping.
- For copy attribution, UI reads better when appended to the name vs. description; keep source owner as `@username` when available.

Branches / PRs (open)

- `feature/copyDecksFunction` › PR #9 (green build): Copy Deck + Options dropdown.

Next session

- Focus on Export functions, especially the TTS export.
  - Flesh out `.txt` export as a server action (content-disposition download).
  - Replace `.tss` placeholder with proper Tabletop Simulator JSON (CustomDeck + ContainedObjects; stable GUIDs; image URLs; stack by card name).
  - Provide brief import instructions for TTS.

