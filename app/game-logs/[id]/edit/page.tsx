"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Card } from "@/app/lib/types/card";
import { BASIC_ELEMENTS } from "@/app/lib/types/card";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const OUTCOME_OPTIONS = [
  { value: "win", label: "Win" },
  { value: "loss", label: "Loss" },
  { value: "draw", label: "Draw" },
];

const MATCH_TYPE_OPTIONS = [
  { value: "1v1", label: "1v1" },
  { value: "2v2", label: "2v2" },
  { value: "ffa", label: "Free-for-all" },
  { value: "custom", label: "Custom" },
];

const FORMAT_OPTIONS = [
  { value: "constructed", label: "Constructed" },
  { value: "live_draft", label: "Live Draft" },
];

function getLocalDateTimeValue(date: Date) {
  const offsetMinutes = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offsetMinutes * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EditGameLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const logId = typeof params?.id === "string" ? params.id : "";

  const [isLoadingLog, setIsLoadingLog] = useState(true);
  const [logError, setLogError] = useState<string | null>(null);
  const [logOwnerId, setLogOwnerId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [opponents, setOpponents] = useState<
    {
      id: string;
      name: string;
      elements: string[];
      externalDeckUrl: string;
      mvpCardIds: string[];
    }[]
  >([
    {
      id: crypto.randomUUID(),
      name: "",
      elements: [],
      externalDeckUrl: "",
      mvpCardIds: [],
    },
  ]);
  const [decks, setDecks] = useState<{ _id: string; name: string }[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [isSearchingCards, setIsSearchingCards] = useState(false);
  const [cardQuery, setCardQuery] = useState("");
  const [opponentCardQueries, setOpponentCardQueries] = useState<
    Record<string, string>
  >({});

  const [title, setTitle] = useState("Untitled Game");
  const [playedAt, setPlayedAt] = useState(() =>
    getLocalDateTimeValue(new Date())
  );
  const [durationMinutes, setDurationMinutes] = useState("");
  const [outcome, setOutcome] = useState("win");
  const [matchType, setMatchType] = useState("1v1");
  const [matchTypeLabel, setMatchTypeLabel] = useState("");
  const [format, setFormat] = useState("constructed");
  const [isPublic, setIsPublic] = useState(false);
  const [deckId, setDeckId] = useState("");
  const [externalDeckUrl, setExternalDeckUrl] = useState("");
  const [teammateDeckId, setTeammateDeckId] = useState("");
  const [teammateExternalDeckUrl, setTeammateExternalDeckUrl] = useState("");
  const [elementsPlayed, setElementsPlayed] = useState<string[]>([]);
  const [mvpCardIds, setMvpCardIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isCustomMatch = matchType === "custom";
  const isTeamMatch = matchType === "2v2";
  const isConstructed = format === "constructed";
  const isLiveDraft = format === "live_draft";
  const isAuthenticated = status === "authenticated";
  const elementOptions = useMemo(() => Object.values(BASIC_ELEMENTS), []);

  const cardLookup = useMemo(() => {
    return cards.reduce<Record<string, Card>>((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {});
  }, [cards]);

  const saveLabel = useMemo(() => {
    if (status === "unauthenticated") {
      return "Sign in to save";
    }
    if (isSubmitting) {
      return "Saving...";
    }
    return "Save Changes";
  }, [isSubmitting, status]);

  useEffect(() => {
    if (!logId) return;
    let isMounted = true;

    const fetchLog = async () => {
      try {
        setIsLoadingLog(true);
        setLogError(null);
        const response = await fetch(`/api/game-logs/${logId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Game log not found");
          }
          if (response.status === 403) {
            throw new Error("You do not have permission to edit this log");
          }
          throw new Error("Failed to load game log");
        }
        const data = await response.json();
        if (!isMounted) return;

        setLogOwnerId(data.userId?.toString?.() || String(data.userId || ""));
        setTitle(data.title || "Untitled Game");
        setPlayedAt(getLocalDateTimeValue(new Date(data.playedAt)));
        setDurationMinutes(
          typeof data.durationMinutes === "number"
            ? String(data.durationMinutes)
            : ""
        );
        setOutcome(data.outcome || "win");
        setMatchType(data.matchType || "1v1");
        setMatchTypeLabel(data.matchTypeLabel || "");
        setFormat(data.format || "constructed");
        setIsPublic(!!data.isPublic);
        setNotes(data.notes || "");

        setDeckId(data.constructed?.deckId ? data.constructed.deckId.toString() : "");
        setExternalDeckUrl(data.constructed?.externalDeckUrl || "");
        setTeammateDeckId(
          data.constructed?.teammateDeckId
            ? data.constructed.teammateDeckId.toString()
            : ""
        );
        setTeammateExternalDeckUrl(
          data.constructed?.teammateExternalDeckUrl || ""
        );

        setElementsPlayed(data.liveDraft?.elementsPlayed || []);
        setMvpCardIds(data.liveDraft?.mvpCardIds || []);

        if (Array.isArray(data.opponents) && data.opponents.length > 0) {
          setOpponents(
            data.opponents.map((opponent: any) => ({
              id: crypto.randomUUID(),
              name: opponent?.name || "",
              elements: opponent?.elements || [],
              externalDeckUrl: opponent?.externalDeckUrl || "",
              mvpCardIds: opponent?.mvpCardIds || [],
            }))
          );
        } else {
          setOpponents([
            {
              id: crypto.randomUUID(),
              name: "",
              elements: [],
              externalDeckUrl: "",
              mvpCardIds: [],
            },
          ]);
        }
        setOpponentCardQueries({});
      } catch (error) {
        console.error("Error loading game log:", error);
        if (isMounted) {
          setLogError(
            error instanceof Error ? error.message : "Unable to load game log"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingLog(false);
        }
      }
    };

    fetchLog();
    return () => {
      isMounted = false;
    };
  }, [logId]);

  useEffect(() => {
    if (!logOwnerId) return;
    if (status === "authenticated" && session?.user?.id) {
      if (session.user.id !== logOwnerId) {
        setPermissionError("You do not have permission to edit this log.");
      } else {
        setPermissionError(null);
      }
    }
  }, [logOwnerId, session?.user?.id, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let isMounted = true;

    const fetchDecks = async () => {
      try {
        setIsLoadingDecks(true);
        setDeckError(null);
        const response = await fetch("/api/decks");
        if (!response.ok) {
          throw new Error("Failed to load decks");
        }
        const data = await response.json();
        if (isMounted) {
          const normalized = Array.isArray(data)
            ? data.map((deck) => ({ _id: deck._id, name: deck.name }))
            : [];
          setDecks(normalized);
        }
      } catch (error) {
        console.error("Error loading decks:", error);
        if (isMounted) {
          setDeckError("Unable to load your decks.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingDecks(false);
        }
      }
    };

    fetchDecks();
    return () => {
      isMounted = false;
    };
  }, [status]);

  useEffect(() => {
    if (!isLiveDraft || cards.length > 0) return;
    let isMounted = true;

    const fetchCards = async () => {
      try {
        setIsLoadingCards(true);
        setCardsError(null);
        const response = await fetch("/api/cards");
        if (!response.ok) {
          throw new Error("Failed to load cards");
        }
        const data = await response.json();
        if (isMounted) {
          setCards(data);
          setFilteredCards(data);
        }
      } catch (error) {
        console.error("Error loading cards:", error);
        if (isMounted) {
          setCardsError("Unable to load card list.");
        }
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
  }, [isLiveDraft, cards.length]);

  useEffect(() => {
    const trimmedQuery = cardQuery.trim().toLowerCase();
    if (!trimmedQuery) {
      setFilteredCards(cards);
      setIsSearchingCards(false);
      return;
    }

    setIsSearchingCards(true);
    setFilteredCards(
      cards.filter((card) => card.name.toLowerCase().includes(trimmedQuery))
    );
  }, [cardQuery, cards]);

  const toggleElement = (element: string) => {
    setElementsPlayed((prev) =>
      prev.includes(element)
        ? prev.filter((item) => item !== element)
        : [...prev, element]
    );
  };

  const addOpponent = () => {
    setOpponents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        elements: [],
        externalDeckUrl: "",
        mvpCardIds: [],
      },
    ]);
  };

  const removeOpponent = (id: string) => {
    setOpponents((prev) => prev.filter((opponent) => opponent.id !== id));
    setOpponentCardQueries((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateOpponentName = (id: string, value: string) => {
    setOpponents((prev) =>
      prev.map((opponent) =>
        opponent.id === id ? { ...opponent, name: value } : opponent
      )
    );
  };

  const updateOpponentDeckUrl = (id: string, value: string) => {
    setOpponents((prev) =>
      prev.map((opponent) =>
        opponent.id === id ? { ...opponent, externalDeckUrl: value } : opponent
      )
    );
  };

  const updateOpponentQuery = (id: string, value: string) => {
    setOpponentCardQueries((prev) => ({ ...prev, [id]: value }));
  };

  const toggleOpponentElement = (id: string, element: string) => {
    setOpponents((prev) =>
      prev.map((opponent) => {
        if (opponent.id !== id) return opponent;
        const hasElement = opponent.elements.includes(element);
        return {
          ...opponent,
          elements: hasElement
            ? opponent.elements.filter((item) => item !== element)
            : [...opponent.elements, element],
        };
      })
    );
  };

  const addOpponentMvpCard = (id: string, cardId: string) => {
    setOpponents((prev) =>
      prev.map((opponent) => {
        if (opponent.id !== id) return opponent;
        if (opponent.mvpCardIds.includes(cardId) || opponent.mvpCardIds.length >= 3) {
          return opponent;
        }
        return { ...opponent, mvpCardIds: [...opponent.mvpCardIds, cardId] };
      })
    );
    setOpponentCardQueries((prev) => ({ ...prev, [id]: "" }));
  };

  const removeOpponentMvpCard = (id: string, cardId: string) => {
    setOpponents((prev) =>
      prev.map((opponent) =>
        opponent.id === id
          ? {
              ...opponent,
              mvpCardIds: opponent.mvpCardIds.filter((value) => value !== cardId),
            }
          : opponent
      )
    );
  };

  const addMvpCard = (cardId: string) => {
    setMvpCardIds((prev) => {
      if (prev.includes(cardId) || prev.length >= 3) return prev;
      return [...prev, cardId];
    });
    setCardQuery("");
  };

  const removeMvpCard = (cardId: string) => {
    setMvpCardIds((prev) => prev.filter((id) => id !== cardId));
  };

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      errors.title = "Title must be at least 3 characters.";
    } else if (trimmedTitle.length > 80) {
      errors.title = "Title must be 80 characters or less.";
    }

    const duration = Number(durationMinutes);
    if (Number.isNaN(duration) || duration < 0) {
      errors.durationMinutes = "Duration must be 0 or greater.";
    } else if (duration > 1440) {
      errors.durationMinutes = "Duration looks too long (max 1440).";
    }

    if (matchType === "custom") {
      const trimmedLabel = matchTypeLabel.trim();
      if (trimmedLabel.length < 2) {
        errors.matchTypeLabel = "Custom match label is required.";
      } else if (trimmedLabel.length > 40) {
        errors.matchTypeLabel = "Custom match label is too long.";
      }
    }

    if (isConstructed) {
      const trimmedExternal = externalDeckUrl.trim();
      if (!deckId && !trimmedExternal) {
        errors.constructed = "Choose a deck or paste a deck link.";
      }
      if (!deckId && trimmedExternal && !isValidUrl(trimmedExternal)) {
        errors.externalDeckUrl = "Deck link is invalid.";
      }
      const trimmedMateExternal = teammateExternalDeckUrl.trim();
      if (!teammateDeckId && trimmedMateExternal && !isValidUrl(trimmedMateExternal)) {
        errors.teammateExternalDeckUrl = "Teammate deck link is invalid.";
      }
    }

    if (isLiveDraft && elementsPlayed.length === 0) {
      errors.elementsPlayed = "Select at least one element.";
    }

    if (notes.trim().length > 1000) {
      errors.notes = "Notes must be 1000 characters or less.";
    }

    opponents.forEach((opponent) => {
      const name = opponent.name.trim();
      const hasDetails =
        opponent.elements.length > 0 ||
        opponent.externalDeckUrl.trim() ||
        opponent.mvpCardIds.length > 0;

      if (hasDetails && name.length < 2) {
        errors[`opponents.${opponent.id}.name`] =
          "Opponent name is required.";
      } else if (name.length > 40) {
        errors[`opponents.${opponent.id}.name`] =
          "Opponent name is too long.";
      }

      const opponentUrl = opponent.externalDeckUrl.trim();
      if (opponentUrl && !isValidUrl(opponentUrl)) {
        errors[`opponents.${opponent.id}.externalDeckUrl`] =
          "Opponent deck link is invalid.";
      }
    });

    return errors;
  };

  const opponentsSection = (
    <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-darker p-6 space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-white mb-2'>Opponents</h2>
          <p className='text-sm text-gray-400'>
            Add opponents and the elements they played.
          </p>
        </div>
        <button
          type='button'
          onClick={addOpponent}
          className='px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-200 text-sm transition-colors'>
          Add Opponent
        </button>
      </div>

      <div className='space-y-4'>
        {opponents.map((opponent, index) => (
          <div
            key={opponent.id}
            className='rounded-lg border border-white/10 bg-black/30 p-4 space-y-3'>
            {opponents.length > 1 && (
              <div className='flex items-center justify-end'>
                <button
                  type='button'
                  onClick={() => removeOpponent(opponent.id)}
                  className='text-xs text-gray-400 hover:text-white transition-colors'>
                  Remove
                </button>
              </div>
            )}
            <div className='space-y-3'>
              <input
                type='text'
                value={opponent.name}
                onChange={(event) =>
                  updateOpponentName(opponent.id, event.target.value)
                }
                placeholder='Opponent name'
                className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white'
              />
              {fieldErrors[`opponents.${opponent.id}.name`] && (
                <p className='text-xs text-red-300'>
                  {fieldErrors[`opponents.${opponent.id}.name`]}
                </p>
              )}
              {isConstructed && (
                <div className='space-y-2'>
                  <input
                    type='url'
                    value={opponent.externalDeckUrl}
                    onChange={(event) =>
                      updateOpponentDeckUrl(opponent.id, event.target.value)
                    }
                    placeholder='Opponent deck link (optional)'
                    className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white'
                  />
                  {fieldErrors[`opponents.${opponent.id}.externalDeckUrl`] && (
                    <p className='text-xs text-red-300'>
                      {fieldErrors[`opponents.${opponent.id}.externalDeckUrl`]}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className='flex flex-wrap gap-2'>
              {elementOptions.map((element) => {
                const isSelected = opponent.elements.includes(element);
                return (
                  <button
                    key={`${opponent.id}-${element}`}
                    type='button'
                    onClick={() => toggleOpponentElement(opponent.id, element)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      isSelected
                        ? "border-algomancy-gold bg-algomancy-gold/20 text-white"
                        : "border-white/10 text-gray-300 hover:border-white/30"
                    }`}>
                    {element}
                  </button>
                );
              })}
            </div>
            {isLiveDraft && (
              <div className='space-y-3 pt-2 border-t border-white/10'>
                <label className='block text-sm text-gray-300'>
                  Opponent MVP Cards (optional)
                </label>
                {isLoadingCards ? (
                  <div className='text-sm text-gray-400'>Loading cards...</div>
                ) : (
                  <>
                    <div className='relative'>
                      <MagnifyingGlassIcon className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
                      <input
                        type='text'
                        value={opponentCardQueries[opponent.id] || ""}
                        onChange={(event) =>
                          updateOpponentQuery(opponent.id, event.target.value)
                        }
                        placeholder='Search cards by name'
                        className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 pl-9 pr-3 py-2 text-sm text-white'
                      />
                    </div>
                    {cardsError && (
                      <p className='text-xs text-red-300 mt-2'>{cardsError}</p>
                    )}
                    {opponentCardQueries[opponent.id]?.trim() && (
                      <div className='mt-3 space-y-2 max-h-[200px] overflow-y-auto pr-1'>
                        {cards
                          .filter((card) =>
                            card.name
                              .toLowerCase()
                              .includes(
                                opponentCardQueries[opponent.id]
                                  .trim()
                                  .toLowerCase()
                              )
                          )
                          .slice(0, 8)
                          .map((card) => (
                            <button
                              key={`${opponent.id}-${card.id}`}
                              type='button'
                              onClick={() => addOpponentMvpCard(opponent.id, card.id)}
                              disabled={
                                opponent.mvpCardIds.includes(card.id) ||
                                opponent.mvpCardIds.length >= 3
                              }
                              className='w-full text-left flex items-center justify-between gap-2 text-sm text-gray-200 bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors disabled:opacity-50'>
                              <span className='truncate'>{card.name}</span>
                              <span className='text-xs text-gray-400'>
                                {opponent.mvpCardIds.includes(card.id) ? "Added" : "Add"}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                )}

                {opponent.mvpCardIds.length > 0 && (
                  <div className='flex flex-wrap gap-3'>
                    {opponent.mvpCardIds.map((cardId) => (
                      <button
                        key={`${opponent.id}-selected-${cardId}`}
                        type='button'
                        onClick={() => removeOpponentMvpCard(opponent.id, cardId)}
                        className='group relative rounded-lg overflow-hidden border border-white/10 hover:border-algomancy-gold/60 transition-colors'>
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
                        <span className='absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100'>
                          Remove
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const liveDraftSection = (
    <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-darker p-6 space-y-4'>
      <div>
        <h2 className='text-lg font-semibold text-white mb-2'>
          Live Draft Details
        </h2>
        <p className='text-sm text-gray-400'>
          Select the elements you played and add MVP cards (optional).
        </p>
      </div>

      <div className='space-y-2'>
        <label className='block text-sm text-gray-300'>Elements Played</label>
        <div className='flex flex-wrap gap-2'>
          {elementOptions.map((element) => {
            const isSelected = elementsPlayed.includes(element);
            return (
              <button
                key={element}
                type='button'
                onClick={() => toggleElement(element)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  isSelected
                    ? "border-algomancy-gold bg-algomancy-gold/20 text-white"
                    : "border-white/10 text-gray-300 hover:border-white/30"
                }`}>
                {element}
              </button>
            );
          })}
        </div>
        {fieldErrors.elementsPlayed && (
          <p className='text-xs text-red-300 mt-2'>
            {fieldErrors.elementsPlayed}
          </p>
        )}
      </div>

      <div className='space-y-3'>
        <div>
          <label className='block text-sm text-gray-300 mb-2'>
            MVP Cards (up to 3)
          </label>
          {isLoadingCards ? (
            <div className='text-sm text-gray-400'>Loading cards...</div>
          ) : (
            <>
              <div className='relative'>
                <MagnifyingGlassIcon className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
                <input
                  type='text'
                  value={cardQuery}
                  onChange={(event) => setCardQuery(event.target.value)}
                  placeholder='Search cards by name'
                  className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 pl-9 pr-3 py-2 text-sm text-white'
                />
              </div>
              {cardsError && (
                <p className='text-xs text-red-300 mt-2'>{cardsError}</p>
              )}
              {isSearchingCards && (
                <div className='mt-3 space-y-2 max-h-[240px] overflow-y-auto pr-1'>
                  {filteredCards.slice(0, 10).map((card) => (
                    <button
                      key={card.id}
                      type='button'
                      onClick={() => addMvpCard(card.id)}
                      disabled={
                        mvpCardIds.includes(card.id) || mvpCardIds.length >= 3
                      }
                      className='w-full text-left flex items-center justify-between gap-2 text-sm text-gray-200 bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors disabled:opacity-50'>
                      <span className='truncate'>{card.name}</span>
                      <span className='text-xs text-gray-400'>
                        {mvpCardIds.includes(card.id) ? "Added" : "Add"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {mvpCardIds.length > 0 && (
          <div className='rounded-md border border-white/10 bg-black/30 p-3'>
            <div className='text-xs text-gray-400 mb-2'>
              Selected MVP cards
            </div>
            <div className='flex flex-wrap gap-3'>
              {mvpCardIds.map((cardId) => (
                <button
                  key={cardId}
                  type='button'
                  onClick={() => removeMvpCard(cardId)}
                  className='group relative rounded-lg overflow-hidden border border-white/10 hover:border-algomancy-gold/60 transition-colors'>
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
                  <span className='absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100'>
                    Remove
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const buildPayload = () => {
    const basePayload: Record<string, any> = {
      title,
      playedAt,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 0,
      outcome,
      format,
      matchType,
      matchTypeLabel: matchTypeLabel || undefined,
      isPublic,
      notes: notes || undefined,
      opponents: opponents
        .filter((opponent) => opponent.name.trim())
        .map((opponent) => ({
          name: opponent.name.trim(),
          elements: opponent.elements,
          externalDeckUrl: opponent.externalDeckUrl.trim() || undefined,
          mvpCardIds: opponent.mvpCardIds,
        })),
    };

    if (format === "constructed") {
      basePayload.constructed = {
        deckId: deckId || undefined,
        externalDeckUrl: deckId ? undefined : externalDeckUrl || undefined,
        teammateDeckId: matchType === "2v2" ? teammateDeckId || undefined : undefined,
        teammateExternalDeckUrl:
          matchType === "2v2"
            ? teammateDeckId
              ? undefined
              : teammateExternalDeckUrl || undefined
            : undefined,
      };
    }

    if (format === "live_draft") {
      basePayload.liveDraft = {
        elementsPlayed,
        mvpCardIds,
      };
    }

    return basePayload;
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !logId || permissionError) return;
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmitError("Please fix the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await fetch(`/api/game-logs/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await response.json();
      if (!response.ok) {
        const message =
          data?.error ||
          (Array.isArray(data?.details) ? data.details[0] : null) ||
          "Failed to save log";
        throw new Error(message);
      }

      setSubmitSuccess("Changes saved.");
      router.push(`/game-logs/${logId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save log"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoadingLog) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  if (logError || permissionError) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto space-y-4'>
          <p className='text-red-300'>{permissionError || logError}</p>
          <Link
            href={logId ? `/game-logs/${logId}` : "/game-logs"}
            className='inline-flex items-center rounded-md bg-algomancy-purple px-4 py-2 text-sm text-white hover:bg-algomancy-purple-dark transition-colors'>
            Back to log
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto space-y-6'>
        <div className='space-y-2'>
          <Link
            href={logId ? `/game-logs/${logId}` : "/game-logs"}
            className='text-sm text-algomancy-purple hover:text-algomancy-gold transition-colors'>
            Back to log
          </Link>
          <h1 className='text-3xl font-bold text-white'>Edit Game Log</h1>
          <p className='text-gray-300'>
            Update match details and keep your stats accurate.
          </p>
        </div>

        {!isAuthenticated && (
          <div className='rounded-lg border border-algomancy-gold/30 bg-algomancy-darker p-4 text-sm text-gray-200'>
            <p className='mb-3'>Sign in to edit game logs.</p>
            <Link
              href='/auth/signin'
              className='inline-flex items-center rounded-md bg-algomancy-gold px-4 py-2 text-black font-medium hover:bg-algomancy-gold-dark transition-colors'>
              Sign In
            </Link>
          </div>
        )}

        <form
          className='space-y-6'
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-darker p-6 space-y-4'>
            <div>
              <label className='block text-sm text-gray-300 mb-2'>Title</label>
              <input
                type='text'
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white'
              />
              {fieldErrors.title && (
                <p className='text-xs text-red-300 mt-2'>{fieldErrors.title}</p>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm text-gray-300 mb-2'>
                  Date & Time
                </label>
                <input
                  type='datetime-local'
                  value={playedAt}
                  onChange={(event) => setPlayedAt(event.target.value)}
                  className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white'
                />
              </div>
              <div>
                <label className='block text-sm text-gray-300 mb-2'>
                  Duration (minutes)
                </label>
                <input
                  type='number'
                  min={0}
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white'
                />
                {fieldErrors.durationMinutes && (
                  <p className='text-xs text-red-300 mt-2'>
                    {fieldErrors.durationMinutes}
                  </p>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm text-gray-300 mb-2'>
                  Outcome
                </label>
                <select
                  value={outcome}
                  onChange={(event) => setOutcome(event.target.value)}
                  className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white'>
                  {OUTCOME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm text-gray-300 mb-2'>
                  Match Type
                </label>
                <select
                  value={matchType}
                  onChange={(event) => setMatchType(event.target.value)}
                  className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white'>
                  {MATCH_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isCustomMatch && (
              <div>
                <label className='block text-sm text-gray-300 mb-2'>
                  Custom Match Label
                </label>
                <input
                  type='text'
                  value={matchTypeLabel}
                  onChange={(event) => setMatchTypeLabel(event.target.value)}
                  className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white'
                />
                {fieldErrors.matchTypeLabel && (
                  <p className='text-xs text-red-300 mt-2'>
                    {fieldErrors.matchTypeLabel}
                  </p>
                )}
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-center'>
              <div>
                <label className='block text-sm text-gray-300 mb-2'>
                  Format
                </label>
                <div className='flex flex-wrap gap-3'>
                  {FORMAT_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                        format === option.value
                          ? "border-algomancy-purple bg-algomancy-purple/20 text-white"
                          : "border-white/10 text-gray-300 hover:border-white/30"
                      }`}>
                      <input
                        type='radio'
                        name='format'
                        value={option.value}
                        checked={format === option.value}
                        onChange={(event) => setFormat(event.target.value)}
                        className='accent-algomancy-purple'
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <input
                  id='isPublic'
                  type='checkbox'
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                  className='h-4 w-4 accent-algomancy-gold'
                />
                <label htmlFor='isPublic' className='text-sm text-gray-300'>
                  Make this log public
                </label>
              </div>
            </div>
          </div>

          {isConstructed && (
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
              <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-darker p-6 space-y-4'>
                <div>
                  <h2 className='text-lg font-semibold text-white mb-2'>
                    Constructed Decks
                  </h2>
                  <p className='text-sm text-gray-400'>
                    Pick one of your decks or paste a deck link.
                  </p>
                </div>

                {!isAuthenticated && (
                  <div className='rounded-md border border-white/10 bg-black/30 p-4 text-sm text-gray-300'>
                    Sign in to load your decks.
                  </div>
                )}

                <div className='space-y-3'>
                  <div className='space-y-2'>
                    <label className='block text-sm text-gray-300'>
                      Your Deck
                    </label>
                    <select
                      value={deckId}
                      onChange={(event) => setDeckId(event.target.value)}
                      className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white'
                      disabled={isLoadingDecks || !isAuthenticated}>
                      <option value=''>
                        {isAuthenticated
                          ? isLoadingDecks
                            ? "Loading decks..."
                            : "Select a deck"
                          : "Sign in to load decks"}
                      </option>
                      {decks.map((deck) => (
                        <option key={deck._id} value={deck._id}>
                          {deck.name}
                        </option>
                      ))}
                    </select>
                    {deckError && (
                      <p className='text-xs text-red-300'>{deckError}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <label className='block text-sm text-gray-300'>
                      Paste deck link (optional)
                    </label>
                    <input
                      type='url'
                      value={externalDeckUrl}
                      onChange={(event) => setExternalDeckUrl(event.target.value)}
                      placeholder='https://...'
                      disabled={!!deckId}
                      className={`w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white ${
                        deckId ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    />
                    {deckId && (
                      <p className='text-xs text-gray-500'>
                        Clear your deck selection to paste a link.
                      </p>
                    )}
                    {fieldErrors.externalDeckUrl && (
                      <p className='text-xs text-red-300'>
                        {fieldErrors.externalDeckUrl}
                      </p>
                    )}
                    {fieldErrors.constructed && (
                      <p className='text-xs text-red-300'>
                        {fieldErrors.constructed}
                      </p>
                    )}
                  </div>
                </div>

                {isTeamMatch && (
                  <div className='space-y-3 pt-2 border-t border-white/10'>
                    <h3 className='text-sm font-semibold text-white'>
                      Teammate Deck (2v2)
                    </h3>
                    <div className='space-y-3'>
                      <div>
                        <label className='block text-sm text-gray-300 mb-2'>
                          Teammate Deck
                        </label>
                        <select
                          value={teammateDeckId}
                          onChange={(event) =>
                            setTeammateDeckId(event.target.value)
                          }
                          className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white'
                          disabled={isLoadingDecks || !isAuthenticated}>
                          <option value=''>
                            {isAuthenticated
                              ? isLoadingDecks
                                ? "Loading decks..."
                                : "Select a deck"
                              : "Sign in to load decks"}
                          </option>
                          {decks.map((deck) => (
                            <option key={`mate-${deck._id}`} value={deck._id}>
                              {deck.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='block text-sm text-gray-300 mb-2'>
                          Paste teammate deck link (optional)
                        </label>
                        <input
                          type='url'
                          value={teammateExternalDeckUrl}
                          onChange={(event) =>
                            setTeammateExternalDeckUrl(event.target.value)
                          }
                          placeholder='https://...'
                          disabled={!!teammateDeckId}
                          className={`w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white ${
                            teammateDeckId ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                        />
                        {teammateDeckId && (
                          <p className='text-xs text-gray-500'>
                            Clear teammate deck to paste a link.
                          </p>
                        )}
                        {fieldErrors.teammateExternalDeckUrl && (
                          <p className='text-xs text-red-300'>
                            {fieldErrors.teammateExternalDeckUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {opponentsSection}
            </div>
          )}

          {isLiveDraft && (
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
              {liveDraftSection}
              {opponentsSection}
            </div>
          )}

          <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-darker p-6 space-y-4'>
            <div>
              <h2 className='text-lg font-semibold text-white mb-2'>Notes</h2>
              <p className='text-sm text-gray-400'>
                Add any context or memorable moments from the match.
              </p>
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder='Write your notes here...'
              className='w-full rounded-md bg-algomancy-dark border border-algomancy-purple/30 px-3 py-2 text-white h-32'
            />
            {fieldErrors.notes && (
              <p className='text-xs text-red-300'>{fieldErrors.notes}</p>
            )}
          </div>

          <div className='flex items-center justify-between'>
            <Link
              href={logId ? `/game-logs/${logId}` : "/game-logs"}
              className='text-sm text-algomancy-purple hover:text-algomancy-gold transition-colors'>
              Back to log
            </Link>
            <div className='flex items-center gap-3'>
              {submitError && (
                <span className='text-xs text-red-300'>{submitError}</span>
              )}
              {submitSuccess && (
                <span className='text-xs text-algomancy-gold'>
                  {submitSuccess}
                </span>
              )}
              <button
                type='submit'
                disabled={!isAuthenticated || isSubmitting}
                className={`rounded-md px-4 py-2 text-white transition-colors ${
                  !isAuthenticated || isSubmitting
                    ? "bg-algomancy-purple/60 opacity-60 cursor-not-allowed"
                    : "bg-algomancy-purple hover:bg-algomancy-purple-dark"
                }`}>
                {saveLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
