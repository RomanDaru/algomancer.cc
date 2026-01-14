/**
 * Central constants file for Algomancer.gg
 * This file contains all shared constants to avoid magic strings throughout the codebase
 */

// Competition Status Constants
export const COMPETITION_STATUS = {
  UPCOMING: "upcoming",
  ACTIVE: "active",
  VOTING: "voting",
  COMPLETED: "completed",
} as const;

// Competition Type Constants
export const COMPETITION_TYPE = {
  CONSTRUCTED: "constructed",
  DRAFT: "draft",
} as const;

// Winner Place Constants
export const WINNER_PLACE = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
} as const;

// Badge Type Constants
export const BADGE_TYPE = {
  BEST_CONSTRUCTED_MONTHLY: "best_constructed_monthly",
  BEST_DRAFT_MONTHLY: "best_draft_monthly",
  HALL_OF_FAME: "hall_of_fame",
} as const;

export const LEVEL_UP_STORAGE_KEY = "algomancy-level-up";
export const LEVEL_UP_EVENT = "algomancy-level-up";

export const LIKE_XP = 5;
export const DECK_CREATE_XP = 10;
export const DECK_CREATE_DAILY_CAP = 50;
export const LOG_CREATE_XP = 5;

export const DECK_BADGES = {
  CASUAL: "Casual",
  COMPETITIVE: "Competitive",
  FUN: "Fun",
  AGGRO: "Aggro",
  MIDRANGE: "Midrange",
  CONTROL: "Control",
  COMBO: "Combo",
} as const;

// Export types for TypeScript
export type CompetitionStatus =
  (typeof COMPETITION_STATUS)[keyof typeof COMPETITION_STATUS];
export type CompetitionType =
  (typeof COMPETITION_TYPE)[keyof typeof COMPETITION_TYPE];
export type WinnerPlace = (typeof WINNER_PLACE)[keyof typeof WINNER_PLACE];
export type BadgeType = (typeof BADGE_TYPE)[keyof typeof BADGE_TYPE];
export type DeckBadge = (typeof DECK_BADGES)[keyof typeof DECK_BADGES];

// Arrays for validation and iteration
export const COMPETITION_STATUS_VALUES = Object.values(COMPETITION_STATUS);
export const COMPETITION_TYPE_VALUES = Object.values(COMPETITION_TYPE);
export const WINNER_PLACE_VALUES = Object.values(WINNER_PLACE);
export const BADGE_TYPE_VALUES = Object.values(BADGE_TYPE);
export const DECK_BADGE_VALUES = Object.values(DECK_BADGES) as DeckBadge[];
