# Changelog

## 2026-03-21

- Added an admin-facing card change review workflow at `/admin/cards` for updating live cards, classifying updates, and previewing impacted deck usage.
- Added card review metadata (`rulesVersion`, `rulesUpdatedAt`, `assetUpdatedAt`, `lastChangeSummary`, `lastChangeScope`) and deck review metadata (`needsReview`, `lastReviewedAt`, `reviewFlags`) to support short-term card iteration safely.
- Added automatic deck flagging for rules changes and automatic review reset when a deck owner saves or edits a deck again.
- Added usage lookup for cards in decks and regression tests covering rules-change flagging plus asset-only updates.
