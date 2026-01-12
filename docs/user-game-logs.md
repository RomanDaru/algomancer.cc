# User Game Logs - Spec and Task List

## Summary
Goal: let players log a game with structured fields (title, date/time, duration, outcome, format, opponents, deck/elements, MVP cards, notes), with data ready for future stats (user + global).

## Core Fields
- Title (editable, default: "Untitled Game")
- Date + time played
- Duration (minutes)
- Outcome (Win / Loss / Draw)
- Format (Constructed or Live Draft)
- Opponents (free-text name + elements played; future: autocomplete users)
- Match type (explicit: 1v1, 2v2, FFA, custom)
- Notes (free text)
- Visibility (default private, toggle to public)

## Constructed Mode
- Choose a deck from the user's profile
- Or paste a link to an external deck (one or the other)
- External deck link disabled when a deck is selected

## Live Draft Mode
- Pick elements played (multi-select from all elements)
- Best card(s) of the game (optional, up to Top 3, used for future card stats)

## Open Questions
- Where do we store logs (DB model + collection name)?
- Deck picker: single deck for constructed; if 2v2 then also choose teammate deck.
- Draft elements: multi-select from all elements.
- Do we need export/share link now, or later? (Not needed for MVP.)

## Task List (Draft)
## Implementation Task List (Step-by-Step)

Phase 1: Data + API foundation
- [x] 1. Add `GameLog` types in `app/lib/types` (shared UI + API shapes).
- [x] 2. Create Mongoose model `app/lib/db/models/GameLog.ts` with indexes.
- [x] 3. Create DB service `app/lib/db/services/gameLogDbService.ts` (create/list/get/update/delete).
- [x] 4. Add API route `app/api/game-logs/route.ts` for GET (list) + POST (create).
- [x] 5. Add API route `app/api/game-logs/[id]/route.ts` for GET/PATCH/DELETE.
- [x] 6. Add basic validation layer (server-side) for payloads.

Phase 2: Create UI (incremental)
- [x] 7. Create `/game-logs/create` page shell + layout (no fields wired yet).
- [x] 8. Add core fields (title, playedAt, duration, outcome, matchType, visibility).
- [x] 9. Add format selector + conditional sections.
- [x] 10. Add constructed section (deck picker + external URL + teammate deck URL).
- [x] 11. Add live draft section (elements multi-select + MVP picker).
- [x] 12. Add opponents editor (name + elements per opponent).
- [x] 13. Wire submit to POST API + show success/error state.

Phase 3: List + detail + edit
- [x] 14. Create `/game-logs` list view + filters (format/outcome).
- [x] 15. Create `/game-logs/[id]` detail view.
- [x] 16. Add edit mode + PATCH wiring for owner.
- [x] 17. Add delete action + confirmation.

Phase 4: Polish + QA
- [x] 18. Add loading + empty states, minor UI polish.
- [x] 19. Add tests (model + API validation + UI smoke).

## Engineering Notes
- Session polling reduced: `SessionProvider` now uses `refetchInterval={0}` and `refetchOnWindowFocus={false}` to minimize `/api/auth/session` spam. Restore polling by setting a non-zero interval if needed.

## Proposed Data Model (Draft)
Collection: `gameLogs`

Top-level fields:
- _id: ObjectId
- userId: ObjectId (ref User, required, index)
- title: string (default "Untitled Game", trim)
- playedAt: Date (required)
- durationMinutes: number (required, min 0)
- outcome: "win" | "loss" | "draw" (required)
- format: "constructed" | "live_draft" (required)
- matchType: "1v1" | "2v2" | "ffa" | "custom" (required)
- matchTypeLabel: string (optional, required if matchType = custom)
- isPublic: boolean (default false)
- opponents: Opponent[] (optional, default [])
- notes: string (optional)
- constructed: ConstructedLog (required when format = constructed)
- liveDraft: LiveDraftLog (required when format = live_draft)
- createdAt / updatedAt

Opponent:
- name: string (required)
- userId: ObjectId (optional, for future autocomplete)
- elements: string[] (optional, from known element list)
- externalDeckUrl: string (optional, constructed only)
- mvpCardIds: string[] (optional, live draft opponents)

ConstructedLog:
- deckId: ObjectId (optional)
- externalDeckUrl: string (optional)
- teammateDeckId: ObjectId (optional, 2v2 only)
- teammateExternalDeckUrl: string (optional)

LiveDraftLog:
- elementsPlayed: string[] (required, from known element list)
- mvpCardIds: string[] (optional, max 3, unique)

Suggested indexes:
- { userId: 1, playedAt: -1 } (user list)
- { isPublic: 1, playedAt: -1 } (public list, future)
- { outcome: 1, playedAt: -1 } (optional, stats)
- { "liveDraft.mvpCardIds": 1 } (optional, stats)

## Proposed API (Draft)
Routes (authenticated unless noted):

- `GET /api/game-logs`
  - Query: `page`, `pageSize`, `format`, `outcome`
  - Returns: current user's logs (sorted by playedAt desc)

- `POST /api/game-logs`
  - Creates a new log (owner = session user)
  - Payload (core):
    - title, playedAt, durationMinutes, outcome, format, matchType, matchTypeLabel?, isPublic?
    - opponents[]
    - notes?
    - constructed? OR liveDraft?

- `GET /api/game-logs/[id]`
  - Returns single log if owner (or public if isPublic)

- `PATCH /api/game-logs/[id]`
  - Partial update (owner only)

- `DELETE /api/game-logs/[id]`
  - Delete log (owner only)

Validation rules:
- title default "Untitled Game" if empty
- playedAt required, valid ISO date
- durationMinutes >= 0
- outcome in {win, loss, draw}
- format in {constructed, live_draft}
- matchType in {1v1, 2v2, ffa, custom}; if custom then matchTypeLabel required
- opponents[].name required, opponents[].elements from element list
- constructed:
  - deckId optional, externalDeckUrl optional
  - if matchType == 2v2, teammateDeckId or teammateExternalDeckUrl allowed
- liveDraft:
  - elementsPlayed required (min 1, max 5)
  - mvpCardIds optional (max 3, unique, from card DB)
- isPublic default false

## UI Flow (Draft)
Page: `/game-logs/create`

Layout (top → bottom):
1) Header
   - Editable title (default "Untitled Game")
   - Save status (draft/unsaved, future)

2) Core Details
   - Date/time picker
   - Duration (minutes)
   - Outcome (Win/Loss/Draw)
   - Match type (1v1 / 2v2 / FFA / Custom + label input)
   - Visibility toggle (private/public)

3) Opponents
   - List editor: add/remove opponent
   - Each opponent: name + element multi-select
   - Constructed: optional external deck URL per opponent
   - Live Draft: optional MVP cards per opponent (up to 3)
   - (Future) autocomplete by user name

4) Format
   - Radio: Constructed / Live Draft

5) Constructed Section (if selected)
   - Deck picker (user decks)
   - External deck URL (optional, always available)
   - If matchType == 2v2:
     - Teammate deck picker
     - Teammate external deck URL (optional)

6) Live Draft Section (if selected)
   - Elements played (multi-select from all elements)
   - MVP cards (search + select up to 3)

7) Notes
   - Multiline text

8) Actions
   - Save log
   - Cancel/back

List Page: `/game-logs`
- Table/cards with title, date, outcome, format, match type, visibility
- Filter by format/outcome

Detail Page: `/game-logs/[id]`
- Read-only view with sections matching create page
- Edit/delete controls for owner
