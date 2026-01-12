import {
  DECK_CREATE_DAILY_CAP,
  DECK_CREATE_XP,
  LIKE_XP,
  LOG_CREATE_XP,
} from "@/app/lib/constants";

type DeckCountEntry = { count?: number };

export const getMaxDecksPerDay = (
  dailyCap: number = DECK_CREATE_DAILY_CAP,
  deckXp: number = DECK_CREATE_XP
) => {
  if (dailyCap <= 0 || deckXp <= 0) return 0;
  return Math.floor(dailyCap / deckXp);
};

export const calculateLikeXp = (
  totalLikes: number,
  likeXp: number = LIKE_XP
) => {
  if (typeof totalLikes !== "number" || totalLikes <= 0 || likeXp <= 0) {
    return 0;
  }
  return totalLikes * likeXp;
};

export const calculateLogXp = (
  totalLogs: number,
  logXp: number = LOG_CREATE_XP
) => {
  if (typeof totalLogs !== "number" || totalLogs <= 0 || logXp <= 0) {
    return 0;
  }
  return totalLogs * logXp;
};

export const calculateDeckCreateXp = (
  deckCounts: DeckCountEntry[],
  deckXp: number = DECK_CREATE_XP,
  dailyCap: number = DECK_CREATE_DAILY_CAP
) => {
  const maxDecksPerDay = getMaxDecksPerDay(dailyCap, deckXp);
  if (maxDecksPerDay <= 0) return 0;

  return (deckCounts || []).reduce((sum, entry) => {
    const count = typeof entry?.count === "number" ? entry.count : 0;
    return sum + Math.min(count, maxDecksPerDay) * deckXp;
  }, 0);
};

export const calculateBonusXp = (input: {
  totalLikes: number;
  totalLogs?: number;
  deckCounts: DeckCountEntry[];
  likeXp?: number;
  deckXp?: number;
  dailyCap?: number;
  logXp?: number;
}) => {
  const likeXpValue = calculateLikeXp(
    input.totalLikes,
    input.likeXp ?? LIKE_XP
  );
  const logXpValue = calculateLogXp(
    input.totalLogs ?? 0,
    input.logXp ?? LOG_CREATE_XP
  );
  const deckXpValue = calculateDeckCreateXp(
    input.deckCounts,
    input.deckXp ?? DECK_CREATE_XP,
    input.dailyCap ?? DECK_CREATE_DAILY_CAP
  );

  return {
    likeXp: likeXpValue,
    deckXp: deckXpValue,
    logXp: logXpValue,
    totalBonusXp: likeXpValue + deckXpValue + logXpValue,
  };
};
