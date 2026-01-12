import type { BasicElementType } from "@/app/lib/types/card";

export type AchievementRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export type AchievementCriteria =
  | { type: "total_logs"; count: number }
  | { type: "wins"; count: number }
  | { type: "constructed_logs"; count: number }
  | { type: "live_draft_logs"; count: number }
  | { type: "public_logs"; count: number }
  | { type: "mvp_logs"; count: number }
  | { type: "element_logs"; element: BasicElementType; count: number }
  | { type: "element_wins"; element: BasicElementType; count: number };

export type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
  rarity: AchievementRarity;
  icon: string;
  color: string;
  criteria: AchievementCriteria;
  seriesKey?: string;
  tier?: number;
};

const RARITY_META: Record<
  AchievementRarity,
  { xp: number; color: string; label: string }
> = {
  common: { xp: 5, color: "#9CA3AF", label: "Common" },
  uncommon: { xp: 10, color: "#A78BFA", label: "Uncommon" },
  rare: { xp: 20, color: "#F59E0B", label: "Rare" },
  epic: { xp: 35, color: "#10B981", label: "Epic" },
  legendary: { xp: 50, color: "#EF4444", label: "Legendary" },
};

export const getAchievementXp = (rarity: AchievementRarity) =>
  RARITY_META[rarity].xp;

export const getAchievementColor = (rarity: AchievementRarity) =>
  RARITY_META[rarity].color;

export const getAchievementRarityLabel = (rarity: AchievementRarity) =>
  RARITY_META[rarity].label;

const BASIC_ELEMENT_LIST: BasicElementType[] = [
  "Fire",
  "Water",
  "Earth",
  "Wood",
  "Metal",
];

const ELEMENT_ICON_PREFIX: Record<BasicElementType, string> = {
  Fire: "Fi",
  Water: "Wa",
  Earth: "Ea",
  Wood: "Wo",
  Metal: "Me",
};

const ELEMENT_TIERS = [
  { count: 5, label: "I" },
  { count: 10, label: "II" },
  { count: 25, label: "III" },
  { count: 50, label: "IV" },
];

const buildElementChain = (
  kind: "element_logs" | "element_wins",
  rarity: AchievementRarity,
  titleBase: string
) =>
  BASIC_ELEMENT_LIST.flatMap((element) =>
    ELEMENT_TIERS.map((tier, index) => {
      const suffix = index === 0 ? "" : ` ${tier.label}`;
      return {
        key: `${element.toLowerCase()}_${kind === "element_logs" ? "played" : "wins"}_${tier.count}`,
        title: `${element} ${titleBase}${suffix}`,
        description:
          kind === "element_logs"
            ? `Log ${tier.count} games with ${element}.`
            : `Win ${tier.count} games with ${element}.`,
        rarity,
        icon: `${ELEMENT_ICON_PREFIX[element]}${tier.count}`,
        color: getAchievementColor(rarity),
        criteria: { type: kind, element, count: tier.count } as AchievementCriteria,
        seriesKey: `${kind}_${element.toLowerCase()}`,
        tier: index + 1,
      };
    })
  );

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "first_log",
    title: "First Log",
    description: "Record your first game log.",
    rarity: "rare",
    icon: "LOG",
    color: getAchievementColor("rare"),
    criteria: { type: "total_logs", count: 1 },
    seriesKey: "total_logs",
    tier: 1,
  },
  {
    key: "constructed_debut",
    title: "Constructed Debut",
    description: "Log your first constructed match.",
    rarity: "common",
    icon: "CON",
    color: getAchievementColor("common"),
    criteria: { type: "constructed_logs", count: 1 },
  },
  {
    key: "draft_debut",
    title: "Draft Debut",
    description: "Log your first live draft match.",
    rarity: "common",
    icon: "DRF",
    color: getAchievementColor("common"),
    criteria: { type: "live_draft_logs", count: 1 },
  },
  {
    key: "first_win",
    title: "First Victory",
    description: "Record your first win.",
    rarity: "epic",
    icon: "W1",
    color: getAchievementColor("epic"),
    criteria: { type: "wins", count: 1 },
    seriesKey: "wins",
    tier: 1,
  },
  {
    key: "wins_5",
    title: "Winning Streak",
    description: "Record 5 wins.",
    rarity: "epic",
    icon: "W5",
    color: getAchievementColor("epic"),
    criteria: { type: "wins", count: 5 },
    seriesKey: "wins",
    tier: 2,
  },
  {
    key: "wins_10",
    title: "Victory Lap",
    description: "Record 10 wins.",
    rarity: "epic",
    icon: "W10",
    color: getAchievementColor("epic"),
    criteria: { type: "wins", count: 10 },
    seriesKey: "wins",
    tier: 3,
  },
  {
    key: "wins_25",
    title: "Relentless",
    description: "Record 25 wins.",
    rarity: "epic",
    icon: "W25",
    color: getAchievementColor("epic"),
    criteria: { type: "wins", count: 25 },
    seriesKey: "wins",
    tier: 4,
  },
  {
    key: "wins_50",
    title: "Unstoppable",
    description: "Record 50 wins.",
    rarity: "epic",
    icon: "W50",
    color: getAchievementColor("epic"),
    criteria: { type: "wins", count: 50 },
    seriesKey: "wins",
    tier: 5,
  },
  {
    key: "public_record",
    title: "Public Record",
    description: "Make a game log public.",
    rarity: "uncommon",
    icon: "PUB",
    color: getAchievementColor("uncommon"),
    criteria: { type: "public_logs", count: 1 },
  },
  {
    key: "mvp_spotlight",
    title: "MVP Spotlight",
    description: "Record at least one MVP card.",
    rarity: "uncommon",
    icon: "MVP",
    color: getAchievementColor("uncommon"),
    criteria: { type: "mvp_logs", count: 1 },
  },
  {
    key: "getting_consistent",
    title: "Getting Consistent",
    description: "Log 5 games.",
    rarity: "rare",
    icon: "5X",
    color: getAchievementColor("rare"),
    criteria: { type: "total_logs", count: 5 },
    seriesKey: "total_logs",
    tier: 2,
  },
  {
    key: "chronicler",
    title: "Chronicler",
    description: "Log 10 games.",
    rarity: "rare",
    icon: "10X",
    color: getAchievementColor("rare"),
    criteria: { type: "total_logs", count: 10 },
    seriesKey: "total_logs",
    tier: 3,
  },
  {
    key: "archivist",
    title: "Archivist",
    description: "Log 25 games.",
    rarity: "rare",
    icon: "25X",
    color: getAchievementColor("rare"),
    criteria: { type: "total_logs", count: 25 },
    seriesKey: "total_logs",
    tier: 4,
  },
  {
    key: "loremaster",
    title: "Loremaster",
    description: "Log 50 games.",
    rarity: "rare",
    icon: "50X",
    color: getAchievementColor("rare"),
    criteria: { type: "total_logs", count: 50 },
    seriesKey: "total_logs",
    tier: 5,
  },
  ...buildElementChain("element_logs", "rare", "Mastery"),
  ...buildElementChain("element_wins", "epic", "Supremacy"),
];
