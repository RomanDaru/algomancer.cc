"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { GameLog } from "@/app/lib/types/gameLog";

type GameLogListItem = Omit<
  GameLog,
  "playedAt" | "createdAt" | "updatedAt"
> & {
  playedAt: string;
  createdAt: string;
  updatedAt: string;
};

const FORMAT_OPTIONS = [
  { value: "", label: "All formats" },
  { value: "constructed", label: "Constructed" },
  { value: "live_draft", label: "Live Draft" },
];

const OUTCOME_OPTIONS = [
  { value: "", label: "All outcomes" },
  { value: "win", label: "Win" },
  { value: "loss", label: "Loss" },
  { value: "draw", label: "Draw" },
];

const PAGE_SIZES = [12, 24, 48, 96];

const FORMAT_COLORS: Record<string, { base: string }> = {
  constructed: { base: "#f9c74f" },
  live_draft: { base: "#7b2cbf" },
};

const OUTCOME_COLORS: Record<string, string> = {
  win: "#00ff86",
  loss: "#ff0033",
  draw: "#f59e0b",
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const OUTCOME_TEXT: Record<string, string> = {
  win: "text-emerald-300",
  loss: "text-red-300",
  draw: "text-amber-300",
};

export default function GameLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<GameLogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchLogs = async () => {
      try {
        if (isFirstLoad.current) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);
        const params = new URLSearchParams();
        if (formatFilter) params.set("format", formatFilter);
        if (outcomeFilter) params.set("outcome", outcomeFilter);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        const response = await fetch(`/api/game-logs?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to load game logs");
        }
        const data = await response.json();
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
        setTotalCount(typeof data?.total === "number" ? data.total : 0);
        setTotalPages(typeof data?.totalPages === "number" ? data.totalPages : 1);
      } catch (err) {
        console.error("Error loading game logs:", err);
        setError("Unable to load your game logs.");
      } finally {
        if (isFirstLoad.current) {
          setIsLoading(false);
          isFirstLoad.current = false;
        } else {
          setIsRefreshing(false);
        }
      }
    };

    fetchLogs();
  }, [status, formatFilter, outcomeFilter, page, pageSize]);

  const isInitialLoading = status === "loading" || isLoading;
  const skeletonCount = Math.min(pageSize, 12);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  const emptyStateText = useMemo(() => {
    if (formatFilter || outcomeFilter) {
      return "No logs match your current filters.";
    }
    return "You haven't logged any games yet.";
  }, [formatFilter, outcomeFilter]);

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-6xl mx-auto space-y-6'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-white'>
              Game Logs
              {totalCount > 0 && (
                <span className='ml-2 text-sm font-medium text-gray-400'>
                  ({totalCount} logs)
                </span>
              )}
            </h1>
            <p className='text-sm text-gray-400'>
              Review your matches and keep stats up to date.
            </p>
          </div>
          <Link
            href='/game-logs/create'
            className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-algomancy-purple text-xl text-white hover:bg-algomancy-purple-dark transition-colors'
            aria-label='New Game Log'>
            +
          </Link>
        </div>

        <div className='flex flex-wrap items-center gap-4'>
          <div className='text-sm text-gray-300'>Filters</div>
          <div className='flex items-center gap-3'>
            <select
              value={formatFilter}
              onChange={(event) => {
                setFormatFilter(event.target.value);
                setPage(1);
              }}
              className='rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-sm text-white'>
              {FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={outcomeFilter}
              onChange={(event) => {
                setOutcomeFilter(event.target.value);
                setPage(1);
              }}
              className='rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-sm text-white'>
              {OUTCOME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className='ml-auto flex items-center gap-2 text-sm text-gray-300'>
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className='rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-2 py-1 text-sm text-white'>
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          {isRefreshing && (
            <div className='flex items-center gap-2 text-xs text-gray-400'>
              <span className='h-3 w-3 animate-spin rounded-full border border-gray-500 border-t-transparent'></span>
              Updating...
            </div>
          )}
        </div>

        {error && (
          <div className='rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200'>
            {error}
          </div>
        )}

        {isInitialLoading ? (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className='relative overflow-hidden rounded-lg border border-white/10 bg-black/20'>
                <div className='absolute inset-x-0 top-0 h-1.5 bg-white/10' />
                <div className='p-4 space-y-3 animate-pulse'>
                  <div className='h-5 w-3/4 rounded bg-white/10' />
                  <div className='h-4 w-1/2 rounded bg-white/10' />
                  <div className='flex flex-wrap gap-2'>
                    <div className='h-6 w-20 rounded-full bg-white/10' />
                    <div className='h-6 w-16 rounded-full bg-white/10' />
                    <div className='h-6 w-14 rounded-full bg-white/10' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className='flex flex-col gap-4 text-gray-300'>
            <p>{emptyStateText}</p>
            <div>
              <Link
                href='/game-logs/create'
                className='inline-flex items-center rounded-md bg-algomancy-gold px-4 py-2 text-sm font-medium text-black hover:bg-algomancy-gold-dark transition-colors'>
                Create your first log
              </Link>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {logs.map((log) => {
              const baseColor = FORMAT_COLORS[log.format]?.base || "#7b2cbf";
              const outcomeColor = OUTCOME_COLORS[log.outcome] || baseColor;
              const stripeStyle = {
                backgroundColor: baseColor,
              };
              const glowStyle = {
                background: `linear-gradient(135deg, ${hexToRgba(
                  baseColor,
                  0.11
                )} 0%, ${hexToRgba(outcomeColor, 0.35)} 100%)`,
              };
              const glowHoverStyle = {
                background: `linear-gradient(135deg, ${hexToRgba(
                  baseColor,
                  0.18
                )} 0%, ${hexToRgba(outcomeColor, 0.45)} 100%)`,
              };
              return (
                <Link
                  key={log._id.toString()}
                  href={`/game-logs/${log._id}`}
                  className='group relative h-[190px] overflow-hidden rounded-lg border border-white/10 bg-black/30 transition-colors'>
                  <div className='absolute inset-0 opacity-70' style={glowStyle} />
                  <div
                    className='absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100'
                    style={glowHoverStyle}
                  />
                  <div className='absolute inset-x-0 top-0 h-1.5' style={stripeStyle} />
                  <div className='relative flex h-full flex-col p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <h2 className='text-lg font-semibold text-white truncate'>
                          {log.title}
                        </h2>
                        <p className='text-sm text-gray-400'>
                          {new Date(log.playedAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className='inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gray-300'>
                        {log.isPublic ? "Public" : "Private"}
                      </span>
                    </div>

                    <div className='mt-auto pt-3 text-xs text-gray-300'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span>
                          {log.format === "constructed"
                            ? "Constructed"
                            : "Live Draft"}
                        </span>
                        <span className='text-gray-500'>|</span>
                        <span className={`font-semibold uppercase ${OUTCOME_TEXT[log.outcome] || ""}`}>
                          {log.outcome}
                        </span>
                        <span className='text-gray-500'>|</span>
                        <span className='uppercase'>{log.matchType}</span>
                        {log.durationMinutes > 0 && (
                          <>
                            <span className='text-gray-500'>|</span>
                            <span>{log.durationMinutes}m</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!isInitialLoading && totalPages > 1 && (
          <div className='grid w-full grid-cols-1 items-center gap-3 text-sm text-gray-300 sm:grid-cols-[1fr_auto_1fr]'>
            <div className='hidden sm:block' />
            <div className='flex items-center justify-center gap-2'>
              <button
                type='button'
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className='rounded-md border border-white/10 px-3 py-1 disabled:opacity-40'>
                Prev
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type='button'
                  onClick={() => setPage(pageNumber)}
                  className={`h-8 w-8 rounded-md border text-sm ${
                    pageNumber === page
                      ? "border-algomancy-purple/60 bg-algomancy-purple/20 text-white"
                      : "border-white/10 text-gray-300 hover:border-white/30"
                  }`}>
                  {pageNumber}
                </button>
              ))}
              <button
                type='button'
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className='rounded-md border border-white/10 px-3 py-1 disabled:opacity-40'>
                Next
              </button>
            </div>
            <div className='hidden sm:block' />
          </div>
        )}
      </div>
    </div>
  );
}
