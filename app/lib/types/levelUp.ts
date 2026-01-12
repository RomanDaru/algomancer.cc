import type { RankKey } from "@/app/lib/achievements/ranks";

export type LevelUpPayload = {
  previousRankKey: RankKey;
  newRankKey: RankKey;
  previousXp: number;
  newXp: number;
};
