"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LinkIcon } from "@heroicons/react/24/outline";
import type { Card } from "@/app/lib/types/card";
import type { GameLog } from "@/app/lib/types/gameLog";
import type { ElementType } from "@/app/lib/utils/elements";
import ElementIcons from "@/app/components/ElementIcons";

type GameLogDetail = Omit<
  GameLog,
  "playedAt" | "createdAt" | "updatedAt"
> & {
  playedAt: string;
  createdAt: string;
  updatedAt: string;
};

const extractDeckIdFromUrl = (value: string) => {
  const match = value.match(/\/decks\/([a-f0-9]{24})/i);
  return match ? match[1] : null;
};

export default function GameLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [log, setLog] = useState<GameLogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [deckLookup, setDeckLookup] = useState<Record<string, string>>({});

  const logId = typeof params?.id === "string" ? params.id : "";

  useEffect(() => {
    if (!logId) return;
    let isMounted = true;

    const fetchLog = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/game-logs/${logId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Game log not found");
          }
          if (response.status === 403) {
            throw new Error("You don't have permission to view this log");
          }
          throw new Error("Failed to load game log");
        }
        const data = await response.json();
        if (isMounted) {
          setLog(data);
        }
      } catch (err) {
        console.error("Error loading game log:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load log.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLog();
    return () => {
      isMounted = false;
    };
  }, [logId]);

  useEffect(() => {
    if (!log) return;
    const cardIds = new Set<string>();

    log.liveDraft?.mvpCardIds?.forEach((cardId) => cardIds.add(cardId));
    log.opponents?.forEach((opponent) => {
      opponent.mvpCardIds?.forEach((cardId) => cardIds.add(cardId));
    });

    if (cardIds.size === 0) return;
    let isMounted = true;

    const fetchCards = async () => {
      try {
        setIsLoadingCards(true);
        const response = await fetch("/api/cards");
        if (!response.ok) {
          throw new Error("Failed to load cards");
        }
        const data = await response.json();
        if (isMounted) {
          setCards(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error loading cards:", err);
      } finally {
        if (isMounted) {
          setIsLoadingCards(false);
        }
      }
    };

    fetchCards();
    return () => {
      isMounted = false;
    };
  }, [log]);

  useEffect(() => {
    if (!log?.constructed) return;
    const ids = [log.constructed.deckId, log.constructed.teammateDeckId]
      .filter(Boolean)
      .map((id) => id!.toString());

    log.opponents?.forEach((opponent) => {
      if (!opponent.externalDeckUrl) return;
      const deckId = extractDeckIdFromUrl(opponent.externalDeckUrl);
      if (deckId) ids.push(deckId);
    });

    if (ids.length === 0) return;
    const uniqueIds = Array.from(new Set(ids)).filter(
      (id) => !deckLookup[id]
    );
    if (uniqueIds.length === 0) return;

    let isMounted = true;

    const fetchDeckName = async (deckId: string) => {
      try {
        const response = await fetch(`/api/decks/${deckId}`);
        if (!response.ok) {
          throw new Error("Failed to load deck");
        }
        const data = await response.json();
        if (isMounted && data?.deck?.name) {
          setDeckLookup((prev) => ({ ...prev, [deckId]: data.deck.name }));
        }
      } catch (err) {
        console.warn("Unable to load deck details for log:", err);
      }
    };

    uniqueIds.forEach((deckId) => {
      fetchDeckName(deckId);
    });

    return () => {
      isMounted = false;
    };
  }, [log, deckLookup]);

  const cardLookup = useMemo(() => {
    return cards.reduce<Record<string, Card>>((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {});
  }, [cards]);

  const formatPlayedAt = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-5xl mx-auto space-y-4'>
          <p className='text-red-300'>{error}</p>
          <button
            type='button'
            onClick={() => router.push("/game-logs")}
            className='inline-flex items-center rounded-md bg-algomancy-purple px-4 py-2 text-sm text-white hover:bg-algomancy-purple-dark transition-colors'>
            Back to logs
          </button>
        </div>
      </div>
    );
  }

  if (!log) return null;

  const isOwner = session?.user?.id === log.userId.toString();
  const sectionClass =
    "rounded-xl border border-algomancy-purple/20 bg-gradient-to-br from-algomancy-purple/20 via-algomancy-darker/70 to-black/30 p-6";
  const outcomeClass =
    log.outcome === "win"
      ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
      : log.outcome === "loss"
        ? "border-red-400/40 bg-red-500/20 text-red-200"
        : "border-amber-400/40 bg-amber-500/20 text-amber-200";

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-5xl mx-auto space-y-8'>
        <div className='space-y-3'>
          <Link
            href='/game-logs'
            className='text-sm text-algomancy-purple hover:text-algomancy-gold transition-colors'>
            Back to logs
          </Link>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-2xl font-bold text-white'>{log.title}</h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                log.isPublic
                  ? "bg-algomancy-gold/20 text-algomancy-gold"
                  : "bg-white/10 text-gray-300"
              }`}>
              {log.isPublic ? "Public" : "Private"}
            </span>
          </div>
          <p className='text-sm text-gray-400'>{formatPlayedAt(log.playedAt)}</p>
        </div>

        <div className={sectionClass}>
          <h2 className='text-lg font-semibold text-white mb-4'>Overview</h2>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-1'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>Outcome</p>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${outcomeClass}`}>
                {log.outcome}
              </span>
            </div>
            <div className='space-y-1'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>Format</p>
              <p className='text-white'>
                {log.format === "constructed" ? "Constructed" : "Live Draft"}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>
                Match Type
              </p>
              <p className='text-white'>
                {log.matchType === "custom" ? log.matchTypeLabel : log.matchType}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>Duration</p>
              <p className='text-white'>
                {log.durationMinutes > 0 ? `${log.durationMinutes} min` : "—"}
              </p>
            </div>
          </div>
        </div>

        {log.format === "constructed" && log.constructed && (
          <div className={sectionClass}>
            <h2 className='text-lg font-semibold text-white mb-4'>Constructed Decks</h2>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-1'>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  Your Deck
                </p>
                {log.constructed.deckId ? (
                  deckLookup[log.constructed.deckId.toString()] ? (
                    <Link
                      href={`/decks/${log.constructed.deckId}`}
                      className='inline-flex items-center gap-2 text-white hover:text-algomancy-gold transition-colors'>
                      <LinkIcon className='h-4 w-4 text-algomancy-gold/80' />
                      <span>{deckLookup[log.constructed.deckId.toString()]}</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/decks/${log.constructed.deckId}`}
                      className='inline-flex items-center gap-2 text-white hover:text-algomancy-gold transition-colors'>
                      <LinkIcon className='h-4 w-4 text-algomancy-gold/80' />
                      <span>Saved deck</span>
                    </Link>
                  )
                ) : log.constructed.externalDeckUrl ? (
                  <a
                    href={log.constructed.externalDeckUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-2 text-sm text-algomancy-purple hover:text-algomancy-gold transition-colors'>
                    <LinkIcon className='h-4 w-4 shrink-0' />
                    <span className='break-all'>{log.constructed.externalDeckUrl}</span>
                  </a>
                ) : (
                  <p className='text-white'>—</p>
                )}
              </div>
              <div className='space-y-1'>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  Teammate Deck
                </p>
                {log.constructed.teammateDeckId ? (
                  deckLookup[log.constructed.teammateDeckId.toString()] ? (
                    <Link
                      href={`/decks/${log.constructed.teammateDeckId}`}
                      className='inline-flex items-center gap-2 text-white hover:text-algomancy-gold transition-colors'>
                      <LinkIcon className='h-4 w-4 text-algomancy-gold/80' />
                      <span>
                        {deckLookup[log.constructed.teammateDeckId.toString()]}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href={`/decks/${log.constructed.teammateDeckId}`}
                      className='inline-flex items-center gap-2 text-white hover:text-algomancy-gold transition-colors'>
                      <LinkIcon className='h-4 w-4 text-algomancy-gold/80' />
                      <span>Saved deck</span>
                    </Link>
                  )
                ) : log.constructed.teammateExternalDeckUrl ? (
                  <a
                    href={log.constructed.teammateExternalDeckUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-2 text-sm text-algomancy-purple hover:text-algomancy-gold transition-colors'>
                    <LinkIcon className='h-4 w-4 shrink-0' />
                    <span className='break-all'>
                      {log.constructed.teammateExternalDeckUrl}
                    </span>
                  </a>
                ) : (
                  <p className='text-white'>—</p>
                )}
              </div>
            </div>
          </div>
        )}

        {log.format === "live_draft" && log.liveDraft && (
          <div className={sectionClass}>
            <h2 className='text-lg font-semibold text-white mb-5'>Live Draft</h2>
            <div className='space-y-5'>
              <div className='space-y-3'>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  Elements Played
                </p>
                <ElementIcons
                  elements={log.liveDraft.elementsPlayed as ElementType[]}
                  size={24}
                  showTooltips={true}
                />
              </div>
              <div className='space-y-3'>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  MVP Cards
                </p>
              {log.liveDraft.mvpCardIds?.length ? (
                <div className='flex flex-wrap gap-3'>
                  {log.liveDraft.mvpCardIds.map((cardId) => (
                    <div key={cardId} className='relative group'>
                      <div className='rounded-lg overflow-hidden border border-white/10 bg-black/30'>
                        {cardLookup[cardId]?.imageUrl ? (
                          <img
                            src={cardLookup[cardId]?.imageUrl}
                            alt={cardLookup[cardId]?.name || cardId}
                            className='w-24 h-[134px] object-cover'
                            loading='lazy'
                          />
                        ) : (
                          <div className='w-24 h-[134px] flex items-end px-2 pb-2 text-[10px] text-white'>
                            {cardLookup[cardId]?.name || cardId}
                          </div>
                        )}
                      </div>
                      <div className='pointer-events-none absolute left-1/2 top-0 z-20 w-56 -translate-x-1/2 -translate-y-[110%] rounded-xl border border-white/20 bg-black/90 opacity-0 shadow-xl transition duration-150 group-hover:opacity-100'>
                        {cardLookup[cardId]?.imageUrl ? (
                          <img
                            src={cardLookup[cardId]?.imageUrl}
                            alt={cardLookup[cardId]?.name || cardId}
                            className='w-56 h-[312px] object-cover'
                            loading='lazy'
                          />
                        ) : (
                          <div className='w-56 h-[312px] flex items-end px-3 pb-3 text-xs text-white'>
                            {cardLookup[cardId]?.name || cardId}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-gray-400'>—</p>
              )}
              {isLoadingCards && (
                <p className='text-xs text-gray-500 mt-2'>Loading card names…</p>
              )}
              </div>
            </div>
          </div>
        )}

        <div className={sectionClass}>
          <h2 className='text-lg font-semibold text-white mb-5'>Opponents</h2>
          {log.opponents.length === 0 ? (
            <p className='text-sm text-gray-400'>No opponents recorded.</p>
          ) : (
            <div className='space-y-8'>
              {log.opponents.map((opponent, index) => (
                <div key={`${opponent.name}-${index}`} className='space-y-4'>
                  <p className='text-white font-medium'>{opponent.name}</p>
                  {log.format === "live_draft" && (
                    opponent.elements?.length ? (
                      <ElementIcons
                        elements={opponent.elements as ElementType[]}
                        size={22}
                        showTooltips={true}
                      />
                    ) : (
                      <p className='text-sm text-gray-400'>No elements listed.</p>
                    )
                  )}
                  {opponent.externalDeckUrl && (
                    <div className='space-y-1'>
                      <p className='text-xs uppercase tracking-wide text-gray-500'>
                        Opponent deck
                      </p>
                      {(() => {
                        const deckId = extractDeckIdFromUrl(opponent.externalDeckUrl);
                        if (deckId) {
                          return (
                            <Link
                              href={`/decks/${deckId}`}
                              className='inline-flex items-center gap-2 text-white hover:text-algomancy-gold transition-colors'>
                              <LinkIcon className='h-4 w-4 text-algomancy-gold/80' />
                              <span>{deckLookup[deckId] || "Saved deck"}</span>
                            </Link>
                          );
                        }
                        return (
                          <a
                            href={opponent.externalDeckUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center gap-2 text-sm text-algomancy-purple hover:text-algomancy-gold transition-colors'>
                            <LinkIcon className='h-4 w-4 shrink-0' />
                            <span className='break-all'>
                              {opponent.externalDeckUrl}
                            </span>
                          </a>
                        );
                      })()}
                    </div>
                  )}
                  {log.format === "live_draft" && opponent.mvpCardIds?.length ? (
                    <div className='flex flex-wrap gap-3'>
                      {opponent.mvpCardIds.map((cardId) => (
                        <div key={`${opponent.name}-${cardId}`} className='relative group'>
                          <div className='rounded-lg overflow-hidden border border-white/10 bg-black/30'>
                            {cardLookup[cardId]?.imageUrl ? (
                              <img
                                src={cardLookup[cardId]?.imageUrl}
                                alt={cardLookup[cardId]?.name || cardId}
                                className='w-20 h-[112px] object-cover'
                                loading='lazy'
                              />
                            ) : (
                              <div className='w-20 h-[112px] flex items-end px-2 pb-2 text-[10px] text-white'>
                                {cardLookup[cardId]?.name || cardId}
                              </div>
                            )}
                          </div>
                          <div className='pointer-events-none absolute left-1/2 top-0 z-20 w-52 -translate-x-1/2 -translate-y-[110%] rounded-xl border border-white/20 bg-black/90 opacity-0 shadow-xl transition duration-150 group-hover:opacity-100'>
                            {cardLookup[cardId]?.imageUrl ? (
                              <img
                                src={cardLookup[cardId]?.imageUrl}
                                alt={cardLookup[cardId]?.name || cardId}
                                className='w-52 h-[292px] object-cover'
                                loading='lazy'
                              />
                            ) : (
                              <div className='w-52 h-[292px] flex items-end px-3 pb-3 text-xs text-white'>
                                {cardLookup[cardId]?.name || cardId}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={sectionClass}>
          <h2 className='text-lg font-semibold text-white mb-3'>Notes</h2>
          {log.notes?.trim() ? (
            <p className='text-sm text-gray-200 whitespace-pre-wrap'>{log.notes}</p>
          ) : (
            <p className='text-sm text-gray-400'>No notes yet.</p>
          )}
        </div>

        {isOwner && (
          <div className='text-xs text-gray-500'>
            Edit and delete controls will be added next.
          </div>
        )}
      </div>
    </div>
  );
}
