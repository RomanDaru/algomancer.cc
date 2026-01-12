import type { GameLog } from "../types/gameLog";

type UpdatePayload = {
  $set: Record<string, any>;
  $unset: Record<string, "" | 1>;
};

const setIfDefined = (target: Record<string, any>, key: string, value: any) => {
  if (value !== undefined) {
    target[key] = value;
  }
};

export const buildGameLogUpdate = (log: Partial<GameLog>): UpdatePayload => {
  const $set: Record<string, any> = {};
  const $unset: Record<string, "" | 1> = {};

  setIfDefined($set, "title", log.title);
  setIfDefined($set, "playedAt", log.playedAt);
  setIfDefined($set, "durationMinutes", log.durationMinutes);
  setIfDefined($set, "outcome", log.outcome);
  setIfDefined($set, "format", log.format);
  setIfDefined($set, "matchType", log.matchType);
  setIfDefined($set, "matchTypeLabel", log.matchTypeLabel);
  setIfDefined($set, "isPublic", log.isPublic);
  setIfDefined($set, "includeInCommunityStats", log.includeInCommunityStats);
  setIfDefined($set, "notes", log.notes);

  if (log.opponents !== undefined) {
    $set.opponents = log.opponents;
  }

  if (log.constructed !== undefined) {
    $set.constructed = log.constructed;
  }

  if (log.liveDraft !== undefined) {
    $set.liveDraft = log.liveDraft;
  }

  if (log.matchType && log.matchType !== "custom") {
    $unset.matchTypeLabel = "";
  }

  if (log.format === "constructed") {
    $unset.liveDraft = "";
  }

  if (log.format === "live_draft") {
    $unset.constructed = "";
  }

  return { $set, $unset };
};
