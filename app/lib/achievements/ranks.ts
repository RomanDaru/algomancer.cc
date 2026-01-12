export type RankKey =
  | "awakened"
  | "subject"
  | "catalyst"
  | "architect"
  | "ascendant"
  | "echelon";

export type RankDefinition = {
  key: RankKey;
  name: string;
  minXp: number;
  maxXp: number | null;
  iconPath: string;
};

export const RANKS: RankDefinition[] = [
  {
    key: "awakened",
    name: "Awakened",
    minXp: 0,
    maxXp: 49,
    iconPath: "/icons/ranks/awakened.svg",
  },
  {
    key: "subject",
    name: "Subject",
    minXp: 50,
    maxXp: 149,
    iconPath: "/icons/ranks/subject.svg",
  },
  {
    key: "catalyst",
    name: "Catalyst",
    minXp: 150,
    maxXp: 299,
    iconPath: "/icons/ranks/catalyst.svg",
  },
  {
    key: "architect",
    name: "Architect",
    minXp: 300,
    maxXp: 499,
    iconPath: "/icons/ranks/architect.svg",
  },
  {
    key: "ascendant",
    name: "Ascendant",
    minXp: 500,
    maxXp: 799,
    iconPath: "/icons/ranks/ascendant.svg",
  },
  {
    key: "echelon",
    name: "Echelon",
    minXp: 800,
    maxXp: null,
    iconPath: "/icons/ranks/echelon.svg",
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getRankForXp = (xp: number) => {
  const safeXp = typeof xp === "number" && !Number.isNaN(xp) ? xp : 0;
  const match =
    [...RANKS].reverse().find((rank) => safeXp >= rank.minXp) || RANKS[0];
  return match;
};

export const getRankProgress = (xp: number) => {
  const current = getRankForXp(xp);
  const currentIndex = RANKS.findIndex((rank) => rank.key === current.key);
  const next = currentIndex >= 0 ? RANKS[currentIndex + 1] : undefined;
  const nextXp = next ? next.minXp : null;
  const currentXp = typeof xp === "number" && !Number.isNaN(xp) ? xp : 0;

  if (!next || nextXp === null) {
    return {
      current,
      next: null,
      progress: 1,
      currentXp,
      nextXp: null,
    };
  }

  const span = Math.max(1, nextXp - current.minXp);
  const progress = clamp((currentXp - current.minXp) / span, 0, 1);

  return {
    current,
    next,
    progress,
    currentXp,
    nextXp,
  };
};

