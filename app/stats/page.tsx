"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import CardHoverPreview from "@/app/components/CardHoverPreview";
import type {
  CardPreview,
  GameStatsResponse,
  StatsScope,
} from "@/app/lib/types/gameStats";

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
];

type SortKey = "total" | "winRate";
type SortDirection = "asc" | "desc";

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface StatsTableRow {
  name: string;
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

const EyeIcon = () => (
  <svg
    viewBox='0 0 24 24'
    width='18'
    height='18'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'>
    <path d='M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z' />
    <circle cx='12' cy='12' r='3' />
  </svg>
);

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const HEATMAP_WEEKS = 12;

const toUtcDate = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const toUtcDateKey = (date: Date) => date.toISOString().slice(0, 10);

const startOfWeekUtc = (date: Date) => {
  const start = toUtcDate(date);
  const day = start.getUTCDay();
  const offset = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - offset);
  return start;
};

const buildHeatmapWeeks = (weeks: number) => {
  const startOfCurrentWeek = startOfWeekUtc(new Date());
  const start = new Date(startOfCurrentWeek);
  start.setUTCDate(start.getUTCDate() - (weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + weekIndex * 7 + dayIndex);
      return day;
    })
  );
};

const toggleSort = (config: SortConfig, key: SortKey): SortConfig => {
  if (config.key === key) {
    return {
      key,
      direction: config.direction === "asc" ? "desc" : "asc",
    };
  }
  return { key, direction: "desc" };
};

const sortRows = (rows: StatsTableRow[], config: SortConfig) => {
  const sorted = [...rows].sort((a, b) => {
    const delta =
      config.key === "total" ? a.total - b.total : a.winRate - b.winRate;
    if (delta !== 0) {
      return config.direction === "asc" ? delta : -delta;
    }
    return b.total - a.total;
  });
  return sorted;
};

const getSortIndicator = (config: SortConfig, key: SortKey) => {
  if (config.key !== key) return "";
  return config.direction === "asc" ? "^" : "v";
};

const StatsTable = ({
  rows,
  nameLabel,
  emptyMessage,
  sortConfig,
  onSortChange,
}: {
  rows: StatsTableRow[];
  nameLabel: string;
  emptyMessage: string;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}) => {
  const sortedRows = useMemo(() => sortRows(rows, sortConfig), [rows, sortConfig]);

  if (rows.length === 0) {
    return <p className='text-sm text-gray-400'>{emptyMessage}</p>;
  }

  const renderSortButton = (label: string, key: SortKey) => {
    const indicator = getSortIndicator(sortConfig, key);
    return (
      <button
        type='button'
        onClick={() => onSortChange(toggleSort(sortConfig, key))}
        className='inline-flex items-center gap-1 text-xs uppercase tracking-wide text-gray-400 hover:text-white'>
        <span>{label}</span>
        {indicator && <span className='text-[10px] text-gray-400'>{indicator}</span>}
      </button>
    );
  };

  const getAriaSort = (key: SortKey) => {
    if (sortConfig.key !== key) return "none";
    return sortConfig.direction === "asc" ? "ascending" : "descending";
  };

  return (
    <div className='overflow-x-auto rounded-lg border border-white/10 bg-black/30'>
      <table className='w-full text-sm'>
        <thead className='text-xs uppercase text-gray-500'>
          <tr className='border-b border-white/10'>
            <th className='px-3 py-2 text-left font-medium'>{nameLabel}</th>
            <th
              className='px-3 py-2 text-right font-medium'
              aria-sort={getAriaSort("total")}>
              {renderSortButton("Played", "total")}
            </th>
            <th className='px-3 py-2 text-right font-medium'>W</th>
            <th className='px-3 py-2 text-right font-medium'>L</th>
            <th className='px-3 py-2 text-right font-medium'>D</th>
            <th
              className='px-3 py-2 text-right font-medium'
              aria-sort={getAriaSort("winRate")}>
              {renderSortButton("WR", "winRate")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr
              key={`${row.name}-${index}`}
              className='border-b border-white/5 last:border-none hover:bg-white/5'>
              <td
                className='px-3 py-2 text-left text-gray-200 max-w-[240px] truncate'
                title={row.name}>
                {row.name}
              </td>
              <td className='px-3 py-2 text-right text-gray-200'>{row.total}</td>
              <td className='px-3 py-2 text-right text-gray-200'>{row.wins}</td>
              <td className='px-3 py-2 text-right text-gray-200'>{row.losses}</td>
              <td className='px-3 py-2 text-right text-gray-200'>{row.draws}</td>
              <td className='px-3 py-2 text-right text-gray-200'>
                {formatPercent(row.winRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MvpTable = ({
  rows,
  cardLookup,
  emptyMessage,
}: {
  rows: Array<{ cardId: string; total: number; winRate: number }>;
  cardLookup: Record<string, CardPreview>;
  emptyMessage: string;
}) => {
  if (rows.length === 0) {
    return <p className='text-sm text-gray-400'>{emptyMessage}</p>;
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-white/10 bg-black/30'>
      <table className='w-full text-sm'>
        <thead className='text-xs uppercase text-gray-500'>
          <tr className='border-b border-white/10'>
            <th className='px-3 py-2 text-left font-medium'>Card</th>
            <th className='px-3 py-2 text-right font-medium'>Played</th>
            <th className='px-3 py-2 text-right font-medium'>WR</th>
            <th className='px-3 py-2 text-right font-medium'>View</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => {
            const card = cardLookup[item.cardId];
            const label = card?.name || item.cardId;
            return (
              <tr
                key={`${item.cardId}-${index}`}
                className='border-b border-white/5 last:border-none hover:bg-white/5'>
                <td
                  className='px-3 py-2 text-left text-gray-200 max-w-[240px] truncate'
                  title={label}>
                  {label}
                </td>
                <td className='px-3 py-2 text-right text-gray-200'>{item.total}</td>
                <td className='px-3 py-2 text-right text-gray-200'>
                  {formatPercent(item.winRate)}
                </td>
                <td className='px-3 py-2 text-right'>
                  {card ? (
                    <CardHoverPreview card={card}>
                      <span
                        title={label}
                        className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white'>
                        <EyeIcon />
                      </span>
                    </CardHoverPreview>
                  ) : (
                    <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-600'>
                      -
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default function StatsPage() {
  const { data: session, status } = useSession();
  const [scope, setScope] = useState<StatsScope>("my");
  const [range, setRange] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [stats, setStats] = useState<GameStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formatSort, setFormatSort] = useState<SortConfig>(() => ({
    key: "total",
    direction: "desc",
  }));
  const [matchSort, setMatchSort] = useState<SortConfig>(() => ({
    key: "total",
    direction: "desc",
  }));
  const [elementSort, setElementSort] = useState<SortConfig>(() => ({
    key: "total",
    direction: "desc",
  }));
  const [deckSort, setDeckSort] = useState<SortConfig>(() => ({
    key: "total",
    direction: "desc",
  }));
  const cardLookup: Record<string, CardPreview> = stats?.cardLookup ?? {};
  const deckLookup: Record<string, string> = stats?.deckLookup ?? {};

  useEffect(() => {
    if (status === "unauthenticated") {
      setScope("community");
    }
  }, [status]);

  const dateRange = useMemo(() => {
    if (range === "all") {
      return { from: undefined, to: undefined };
    }
    if (range === "30" || range === "90") {
      const days = range === "30" ? 30 : 90;
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - days);
      return {
        from: toDateInputValue(from),
        to: toDateInputValue(to),
      };
    }
    if (customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return { from: undefined, to: undefined };
  }, [range, customFrom, customTo]);

  useEffect(() => {
    if (scope === "my" && status !== "authenticated") {
      setStats(null);
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set("scope", scope);
        if (dateRange.from) params.set("from", dateRange.from);
        if (dateRange.to) params.set("to", dateRange.to);
        const response = await fetch(`/api/stats?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to load stats");
        }
        const data = (await response.json()) as GameStatsResponse;
        setStats(data);
      } catch (err) {
        console.error("Error loading stats:", err);
        setError("Unable to load stats.");
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [scope, dateRange.from, dateRange.to, status]);

  const formatRows = useMemo<StatsTableRow[]>(() => {
    if (!stats) return [];
    return stats.byFormat.map((item) => ({
      name: item.format.replace("_", " "),
      total: item.total,
      wins: item.wins,
      losses: item.losses,
      draws: item.draws,
      winRate: item.winRate,
    }));
  }, [stats]);

  const matchRows = useMemo<StatsTableRow[]>(() => {
    if (!stats) return [];
    return stats.byMatchType.map((item) => ({
      name: item.matchType.toUpperCase(),
      total: item.total,
      wins: item.wins,
      losses: item.losses,
      draws: item.draws,
      winRate: item.winRate,
    }));
  }, [stats]);

  const elementRows = useMemo<StatsTableRow[]>(() => {
    if (!stats) return [];
    return stats.elements.map((item) => ({
      name: item.element,
      total: item.total,
      wins: item.wins,
      losses: item.losses,
      draws: item.draws,
      winRate: item.winRate,
    }));
  }, [stats]);

  const deckRows = useMemo<StatsTableRow[]>(() => {
    if (!stats) return [];
    const combined = new Map(
      [...stats.decks.mostPlayed, ...stats.decks.highestWinRate].map((item) => [
        item.deckId,
        item,
      ])
    );
    return Array.from(combined.values()).map((item) => ({
      name: deckLookup[item.deckId] || "Unknown deck",
      total: item.total,
      wins: item.wins,
      losses: item.losses,
      draws: item.draws,
      winRate: item.winRate,
    }));
  }, [stats, deckLookup]);

  const heatmapWeeks = useMemo(() => buildHeatmapWeeks(HEATMAP_WEEKS), []);

  const heatmapLookup = useMemo<Record<string, number>>(() => {
    if (!stats) return {};
    return stats.timeSeries.reduce<Record<string, number>>((acc, point) => {
      acc[point.day.slice(0, 10)] = point.total;
      return acc;
    }, {});
  }, [stats]);

  const heatmapMaxTotal = useMemo(() => {
    let max = 0;
    heatmapWeeks.forEach((week) => {
      week.forEach((day) => {
        const total = heatmapLookup[toUtcDateKey(day)] || 0;
        if (total > max) {
          max = total;
        }
      });
    });
    return Math.max(max, 1);
  }, [heatmapWeeks, heatmapLookup]);

  const todayUtc = useMemo(() => toUtcDate(new Date()), []);

  const heatmapLevels = [
    "bg-white/5",
    "bg-algomancy-purple/30",
    "bg-algomancy-purple/50",
    "bg-algomancy-purple/70",
    "bg-algomancy-purple",
  ];

  const getHeatmapLevel = (total: number) => {
    if (total === 0) return 0;
    const ratio = total / heatmapMaxTotal;
    if (ratio >= 0.75) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.25) return 2;
    return 1;
  };

  const showSignInPrompt = scope === "my" && status === "unauthenticated";

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-6xl mx-auto space-y-8'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-start'>
          <div>
            <h1 className='text-3xl font-bold text-white'>Stats</h1>
            <p className='text-gray-300'>
              Track performance trends for you and the community.
            </p>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-3 text-sm'>
          <div className='flex items-center gap-2 rounded-full border border-white/10 p-1'>
            <button
              type='button'
              onClick={() => setScope("my")}
              className={`rounded-full px-4 py-2 transition-colors ${
                scope === "my"
                  ? "bg-algomancy-purple text-white"
                  : "text-gray-300 hover:text-white"
              }`}>
              My Stats
            </button>
            <button
              type='button'
              onClick={() => setScope("community")}
              className={`rounded-full px-4 py-2 transition-colors ${
                scope === "community"
                  ? "bg-algomancy-gold text-black"
                  : "text-gray-300 hover:text-white"
              }`}>
              Community Stats
            </button>
          </div>

          <div className='ml-auto flex flex-wrap items-center gap-3'>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className='rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-sm text-white'>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {range === "custom" && (
              <div className='flex items-center gap-2'>
                <input
                  type='date'
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                  className='rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-sm text-white'
                />
                <span className='text-gray-400'>to</span>
                <input
                  type='date'
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                  className='rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-sm text-white'
                />
              </div>
            )}
          </div>
        </div>

        {showSignInPrompt && (
          <div className='rounded-lg border border-algomancy-gold/30 bg-algomancy-darker p-4 text-sm text-gray-200'>
            <p className='mb-3'>Sign in to view your personal stats.</p>
            <Link
              href='/auth/signin'
              className='inline-flex items-center rounded-md bg-algomancy-gold px-4 py-2 text-black font-medium hover:bg-algomancy-gold-dark transition-colors'>
              Sign In
            </Link>
          </div>
        )}

        {error && (
          <div className='rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200'>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className='flex justify-center items-center min-h-[calc(40vh)]'>
            <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-algomancy-purple'></div>
          </div>
        ) : !stats ? null : (
          <div className='space-y-10'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='rounded-lg border border-white/10 bg-black/30 p-4'>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  Total Logs
                </p>
                <p className='text-2xl font-semibold text-white'>
                  {stats.summary.total}
                </p>
              </div>
              <div className='rounded-lg border border-white/10 bg-black/30 p-4'>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  Win Rate
                </p>
                <p className='text-2xl font-semibold text-white'>
                  {formatPercent(stats.summary.winRate)}
                </p>
                <p className='text-xs text-gray-400 mt-1'>
                  {stats.summary.wins}W · {stats.summary.losses}L
                </p>
              </div>
              <div className='rounded-lg border border-white/10 bg-black/30 p-4'>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  Avg Duration
                </p>
                <p className='text-2xl font-semibold text-white'>
                  {Math.round(stats.summary.avgDurationMinutes)}m
                </p>
              </div>
              <div className='rounded-lg border border-white/10 bg-black/30 p-4'>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  Draws
                </p>
                <p className='text-2xl font-semibold text-white'>
                  {stats.summary.draws}
                </p>
              </div>
            </div>

            <div className='grid gap-6 lg:grid-cols-2'>
              <div className='space-y-4'>
                <h2 className='text-lg font-semibold text-white'>Formats</h2>
                <StatsTable
                  rows={formatRows}
                  nameLabel='Format'
                  emptyMessage='No format data yet.'
                  sortConfig={formatSort}
                  onSortChange={setFormatSort}
                />
              </div>

              <div className='space-y-4'>
                <h2 className='text-lg font-semibold text-white'>Match Types</h2>
                <StatsTable
                  rows={matchRows}
                  nameLabel='Match Type'
                  emptyMessage='No match type data yet.'
                  sortConfig={matchSort}
                  onSortChange={setMatchSort}
                />
              </div>
            </div>

            <div className='grid gap-6 lg:grid-cols-2'>
              <div className='space-y-4'>
                <h2 className='text-lg font-semibold text-white'>
                  Live Draft Elements
                </h2>
                <StatsTable
                  rows={elementRows}
                  nameLabel='Element'
                  emptyMessage='No element data yet.'
                  sortConfig={elementSort}
                  onSortChange={setElementSort}
                />
              </div>

              <div className='space-y-4'>
                <h2 className='text-lg font-semibold text-white'>
                  Constructed Decks
                </h2>
                <StatsTable
                  rows={deckRows}
                  nameLabel='Deck'
                  emptyMessage='No deck data yet.'
                  sortConfig={deckSort}
                  onSortChange={setDeckSort}
                />
              </div>
            </div>

            <div className='grid gap-6 lg:grid-cols-2'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-lg font-semibold text-white'>
                    MVP Cards (Most Played)
                  </h2>
                  <span className='text-xs text-gray-400'>Top 9</span>
                </div>
                {stats.mvpCards.mostPlayed.length === 0 ? (
                  <p className='text-sm text-gray-400'>No MVP cards yet.</p>
                ) : (
                  <MvpTable
                    rows={stats.mvpCards.mostPlayed.slice(0, 9)}
                    cardLookup={cardLookup}
                    emptyMessage='No MVP cards yet.'
                  />
                )}
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-lg font-semibold text-white'>
                    MVP Cards (Highest WR)
                  </h2>
                  <span className='text-xs text-gray-400'>Top 9</span>
                </div>
                {stats.mvpCards.highestWinRate.length === 0 ? (
                  <p className='text-sm text-gray-400'>
                    Not enough samples yet (min {stats.mvpCards.minSampleSize}).
                  </p>
                ) : (
                  <MvpTable
                    rows={stats.mvpCards.highestWinRate.slice(0, 9)}
                    cardLookup={cardLookup}
                    emptyMessage='Not enough MVP data yet.'
                  />
                )}
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex flex-col items-center gap-1 text-center'>

                <h2 className='text-lg font-semibold text-white'>Log Activity</h2>
                <span className='text-xs text-gray-400'>Last 12 weeks</span>
              </div>
              {stats.timeSeries.length === 0 ? (
                <p className='text-sm text-gray-400 text-center'>No data yet.</p>
              ) : (
                <div className='flex justify-center'>
                  <div className='flex items-start gap-3'>
                    <div className='hidden sm:grid grid-rows-7 gap-1 pt-1 text-[11px] text-gray-500'>
                      <span>Mon</span>
                      <span className='text-transparent'>Tue</span>
                      <span>Wed</span>
                      <span className='text-transparent'>Thu</span>
                      <span>Fri</span>
                      <span className='text-transparent'>Sat</span>
                      <span className='text-transparent'>Sun</span>
                    </div>
                    <div className='flex gap-2 overflow-x-auto pb-1'>
                      {heatmapWeeks.map((week, weekIndex) => (
                        <div key={`week-${weekIndex}`} className='flex flex-col gap-1'>
                          {week.map((day) => {
                            const key = toUtcDateKey(day);
                            const total = heatmapLookup[key] || 0;
                            const level = getHeatmapLevel(total);
                            const isFuture = day > todayUtc;
                            const label = day.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "UTC",
                            });
                            return (
                              <div
                                key={key}
                                title={`${label}: ${total} log${total === 1 ? "" : "s"}`}
                                className={`h-3 w-3 rounded-sm transition-transform duration-150 ease-out hover:scale-110 hover:ring-1 hover:ring-white/40 ${
                                  isFuture
                                    ? "bg-white/5 opacity-30"
                                    : heatmapLevels[level]
                                }`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
