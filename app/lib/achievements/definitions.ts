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
  | { type: "mvp_logs"; count: number };

export type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
  rarity: AchievementRarity;
  icon: string;
  color: string;
  criteria: AchievementCriteria;
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

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "first_log",
    title: "First Log",
    description: "Record your first game log.",
    rarity: "common",
    icon: "LOG",
    color: getAchievementColor("common"),
    criteria: { type: "total_logs", count: 1 },
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
    rarity: "uncommon",
    icon: "WIN",
    color: getAchievementColor("uncommon"),
    criteria: { type: "wins", count: 1 },
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
  },
  {
    key: "chronicler",
    title: "Chronicler",
    description: "Log 10 games.",
    rarity: "epic",
    icon: "10X",
    color: getAchievementColor("epic"),
    criteria: { type: "total_logs", count: 10 },
  },
];

