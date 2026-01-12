import {
  DECK_CREATE_DAILY_CAP,
  DECK_CREATE_XP,
  LIKE_XP,
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
  deckCounts: DeckCountEntry[];
  likeXp?: number;
  deckXp?: number;
  dailyCap?: number;
}) => {
  const likeXpValue = calculateLikeXp(
    input.totalLikes,
    input.likeXp ?? LIKE_XP
  );
  const deckXpValue = calculateDeckCreateXp(
    input.deckCounts,
    input.deckXp ?? DECK_CREATE_XP,
    input.dailyCap ?? DECK_CREATE_DAILY_CAP
  );

  return {
    likeXp: likeXpValue,
    deckXp: deckXpValue,
    totalBonusXp: likeXpValue + deckXpValue,
  };
};
