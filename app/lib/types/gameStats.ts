export type StatsScope = "my" | "community";

export interface StatsRange {
  from?: string;
  to?: string;
}

export interface StatsSummary {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgDurationMinutes: number;
}

export interface StatsBreakdown {
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
}

export interface StatsFormatBreakdown extends StatsBreakdown {
  format: "constructed" | "live_draft";
}

export interface StatsMatchTypeBreakdown extends StatsBreakdown {
  matchType: "1v1" | "2v2" | "ffa" | "custom";
}

export interface StatsTimePoint extends StatsBreakdown {
  day: string;
}

export interface StatsElementBreakdown extends StatsBreakdown {
  element: string;
}

export interface StatsCardBreakdown extends StatsBreakdown {
  cardId: string;
}

export interface StatsDeckBreakdown extends StatsBreakdown {
  deckId: string;
}

export interface CardPreview {
  id: string;
  name: string;
  imageUrl: string;
}

export interface StatsRankedList<T> {
  mostPlayed: T[];
  highestWinRate: T[];
  minSampleSize: number;
}

export interface GameStatsResponse {
  scope: StatsScope;
  range: StatsRange;
  summary: StatsSummary;
  byFormat: StatsFormatBreakdown[];
  byMatchType: StatsMatchTypeBreakdown[];
  timeSeries: StatsTimePoint[];
  elements: StatsElementBreakdown[];
  mvpCards: StatsRankedList<StatsCardBreakdown>;
  decks: StatsRankedList<StatsDeckBreakdown>;
  cardLookup: Record<string, CardPreview>;
  deckLookup: Record<string, string>;
}
