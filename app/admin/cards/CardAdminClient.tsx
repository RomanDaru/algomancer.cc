"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";
import AdminTabs from "@/app/components/admin/AdminTabs";
import {
  Card,
  CardChangeMode,
  CardChangeScope,
  CARD_TYPES,
  TIMING,
} from "@/app/lib/types/card";
import { resolveCardChangeScope } from "@/app/lib/utils/cardChange";

interface CardUsageSummary {
  totalDecks: number;
  publicDecks: number;
  privateDecks: number;
  sampleDecks: Array<{ id: string; name: string; isPublic: boolean }>;
}

interface CardUpdateResponse {
  card: Card;
  changeScope: CardChangeScope;
  changeSummary: string;
  flaggedDecksCount: number;
  flaggedPublicDecksCount: number;
}

interface CardFormState {
  id: string;
  name: string;
  manaCost: string;
  imageUrl: string;
  flavorText: string;
  currentIndex: string;
  elementType: string;
  elementSymbol: string;
  elementSecondarySymbol: string;
  power: string;
  defense: string;
  affinityFire: string;
  affinityWater: string;
  affinityEarth: string;
  affinityWood: string;
  affinityMetal: string;
  timingType: string;
  timingDescription: string;
  mainType: string;
  subType: string;
  attributesText: string;
  abilitiesText: string;
  setSymbol: string;
  setName: string;
  setComplexity: string;
}

const COMPLEXITY_OPTIONS = ["Common", "Uncommon", "Rare", "Mythic"];

function toFormState(card: Card): CardFormState {
  return {
    id: card.id,
    name: card.name,
    manaCost: String(card.manaCost ?? 0),
    imageUrl: card.imageUrl || "",
    flavorText: card.flavorText || "",
    currentIndex:
      typeof card.currentIndex === "number" ? String(card.currentIndex) : "",
    elementType: card.element.type || "",
    elementSymbol: card.element.symbol || "",
    elementSecondarySymbol: card.element.secondarySymbol || "",
    power: String(card.stats.power ?? 0),
    defense: String(card.stats.defense ?? 0),
    affinityFire:
      typeof card.stats.affinity.fire === "number"
        ? String(card.stats.affinity.fire)
        : "",
    affinityWater:
      typeof card.stats.affinity.water === "number"
        ? String(card.stats.affinity.water)
        : "",
    affinityEarth:
      typeof card.stats.affinity.earth === "number"
        ? String(card.stats.affinity.earth)
        : "",
    affinityWood:
      typeof card.stats.affinity.wood === "number"
        ? String(card.stats.affinity.wood)
        : "",
    affinityMetal:
      typeof card.stats.affinity.metal === "number"
        ? String(card.stats.affinity.metal)
        : "",
    timingType: card.timing.type || "Standard",
    timingDescription: card.timing.description || "",
    mainType: card.typeAndAttributes.mainType || "Unit",
    subType: card.typeAndAttributes.subType || "",
    attributesText: (card.typeAndAttributes.attributes || []).join(", "),
    abilitiesText: (card.abilities || []).join("\n"),
    setSymbol: card.set.symbol || "",
    setName: card.set.name || "",
    setComplexity: card.set.complexity || "Common",
  };
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function fromFormState(form: CardFormState, originalCard: Card): Card {
  return {
    ...originalCard,
    id: form.id.trim(),
    name: form.name.trim(),
    manaCost: Number(form.manaCost || 0),
    imageUrl: form.imageUrl.trim(),
    flavorText: form.flavorText.trim() || undefined,
    currentIndex: parseOptionalNumber(form.currentIndex),
    element: {
      type: form.elementType.trim() as Card["element"]["type"],
      symbol: form.elementSymbol.trim(),
      secondarySymbol: form.elementSecondarySymbol.trim() || undefined,
    },
    stats: {
      power: Number(form.power || 0),
      defense: Number(form.defense || 0),
      affinity: {
        fire: parseOptionalNumber(form.affinityFire),
        water: parseOptionalNumber(form.affinityWater),
        earth: parseOptionalNumber(form.affinityEarth),
        wood: parseOptionalNumber(form.affinityWood),
        metal: parseOptionalNumber(form.affinityMetal),
      },
    },
    timing: {
      type: form.timingType as Card["timing"]["type"],
      description: form.timingDescription.trim(),
    },
    typeAndAttributes: {
      mainType: form.mainType as Card["typeAndAttributes"]["mainType"],
      subType: form.subType.trim(),
      attributes: form.attributesText
        .split(",")
        .map((attribute) => attribute.trim())
        .filter(Boolean),
    },
    abilities: form.abilitiesText
      .split("\n")
      .map((ability) => ability.trim())
      .filter(Boolean),
    set: {
      symbol: form.setSymbol.trim(),
      name: form.setName.trim(),
      complexity: form.setComplexity as Card["set"]["complexity"],
    },
  };
}

function formatDate(date?: Date | string) {
  if (!date) {
    return "Never";
  }

  return new Date(date).toLocaleString();
}

function getPreviewMessage(
  scope: CardChangeScope,
  usage?: CardUsageSummary | null
) {
  if (scope === "rules") {
    const totalDecks = usage?.totalDecks || 0;
    return totalDecks > 0
      ? `${totalDecks} deck${totalDecks === 1 ? "" : "s"} using this card will be flagged for review.`
      : "This is a rules change. There are no existing decks to flag right now.";
  }

  if (scope === "asset") {
    return "This will update visuals or text only. Existing decks will not be flagged.";
  }

  return "No meaningful card change detected yet.";
}

function FieldLabel({
  htmlFor,
  label,
  hint,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className='block text-sm font-medium text-white'>
      {label}
      {hint && <span className='ml-2 text-xs font-normal text-gray-400'>{hint}</span>}
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className='rounded-xl border border-algomancy-purple/20 bg-algomancy-darker p-4'>
      <div className='mb-4'>
        <h2 className='text-base font-semibold text-white'>{title}</h2>
        {description && <p className='mt-1 text-sm text-gray-400'>{description}</p>}
      </div>
      <div className='space-y-4'>{children}</div>
    </section>
  );
}

export default function CardAdminClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [form, setForm] = useState<CardFormState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [changeMode, setChangeMode] = useState<CardChangeMode>("auto");
  const [changeSummary, setChangeSummary] = useState("");
  const [usage, setUsage] = useState<CardUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveResult, setLastSaveResult] = useState<CardUpdateResponse | null>(
    null
  );

  const selectedCard =
    cards.find((card) => card.id === selectedCardId) || null;
  const filteredCards = cards.filter((card) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      card.name.toLowerCase().includes(query) ||
      card.id.toLowerCase().includes(query)
    );
  });

  const previewCard =
    form && selectedCard ? fromFormState(form, selectedCard) : null;
  const previewScope =
    previewCard && selectedCard
      ? resolveCardChangeScope(selectedCard, previewCard, changeMode)
      : "none";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [router, status]);

  useEffect(() => {
    async function loadCards() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/cards");
        if (!response.ok) {
          throw new Error("Failed to load cards");
        }

        const data = (await response.json()) as Card[];
        setCards(data);
        if (data.length > 0) {
          setSelectedCardId((current) =>
            current && data.some((card) => card.id === current)
              ? current
              : data[0].id
          );
        }
      } catch (error) {
        console.error("Error loading cards:", error);
        toast.error("Failed to load cards");
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && session?.user?.isAdmin) {
      loadCards();
    }
  }, [session?.user?.isAdmin, status]);

  useEffect(() => {
    if (!selectedCard) {
      setForm(null);
      setChangeSummary("");
      setLastSaveResult(null);
      return;
    }

    setForm(toFormState(selectedCard));
    setChangeMode("auto");
    setChangeSummary("");
    setLastSaveResult(null);
  }, [selectedCard]);

  useEffect(() => {
    async function loadUsage(cardId: string) {
      try {
        setIsUsageLoading(true);
        const response = await fetch(`/api/cards/${cardId}/usage`);
        if (!response.ok) {
          throw new Error("Failed to load card usage");
        }

        const data = (await response.json()) as CardUsageSummary;
        setUsage(data);
      } catch (error) {
        console.error("Error loading card usage:", error);
        setUsage(null);
      } finally {
        setIsUsageLoading(false);
      }
    }

    if (selectedCardId && status === "authenticated" && session?.user?.isAdmin) {
      loadUsage(selectedCardId);
    }
  }, [selectedCardId, session?.user?.isAdmin, status]);

  if (status === "loading" || isLoading) {
    return (
      <div className='flex min-h-[calc(100vh-64px)] items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-algomancy-purple'></div>
      </div>
    );
  }

  if (status === "authenticated" && !session?.user?.isAdmin) {
    router.push("/");
    return null;
  }

  if (!session) {
    return null;
  }

  const updateField = (key: keyof CardFormState, value: string) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSave = async () => {
    if (!form || !selectedCard) {
      return;
    }

    const nextCard = fromFormState(form, selectedCard);

    if (!nextCard.name || !nextCard.id || !nextCard.imageUrl) {
      toast.error("Card ID, name, and image URL are required.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/cards/${selectedCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card: nextCard,
          changeMode,
          changeSummary,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save card");
      }

      const result = data as CardUpdateResponse;
      setLastSaveResult(result);
      setCards((current) =>
        current.map((card) => (card.id === result.card.id ? result.card : card))
      );
      setSelectedCardId(result.card.id);
      toast.success(
        result.changeScope === "rules"
          ? `Saved. Flagged ${result.flaggedDecksCount} impacted deck${result.flaggedDecksCount === 1 ? "" : "s"}.`
          : "Card saved."
      );
    } catch (error) {
      console.error("Error saving card:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save card"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <Toaster position='top-right' />
      <div className='mx-auto max-w-7xl'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-white'>Card Change Review</h1>
          <p className='mt-2 max-w-3xl text-sm text-gray-300'>
            Update live cards, classify the change, and automatically flag decks
            that need a re-check after balance changes.
          </p>
        </div>

        <AdminTabs />

        <div className='grid gap-6 lg:grid-cols-[320px,minmax(0,1fr)]'>
          <aside className='rounded-xl border border-algomancy-purple/20 bg-algomancy-darker p-4'>
            <div className='mb-4'>
              <label
                htmlFor='card-search'
                className='mb-2 block text-sm font-medium text-white'>
                Find card
              </label>
              <input
                id='card-search'
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder='Search by name or ID'
                className='w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-algomancy-purple'
              />
            </div>

            <div className='max-h-[70vh] space-y-2 overflow-y-auto pr-1'>
              {filteredCards.map((card) => {
                const isActive = card.id === selectedCardId;

                return (
                  <button
                    key={card.id}
                    type='button'
                    onClick={() => setSelectedCardId(card.id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                      isActive
                        ? "border-algomancy-gold/40 bg-algomancy-gold/10"
                        : "border-transparent bg-algomancy-dark hover:border-algomancy-purple/30"
                    }`}>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium text-white'>
                          {card.name}
                        </p>
                        <p className='mt-1 truncate text-xs text-gray-400'>
                          {card.id}
                        </p>
                      </div>
                      <span className='rounded-full bg-black/25 px-2 py-1 text-xs text-gray-300'>
                        v{card.rulesVersion || 1}
                      </span>
                    </div>
                    {card.lastChangeSummary && (
                      <p className='mt-2 line-clamp-2 text-xs text-gray-400'>
                        {card.lastChangeSummary}
                      </p>
                    )}
                  </button>
                );
              })}
              {filteredCards.length === 0 && (
                <p className='py-6 text-center text-sm text-gray-400'>
                  No cards matched your search.
                </p>
              )}
            </div>
          </aside>

          {!form || !selectedCard ? (
            <div className='rounded-xl border border-algomancy-purple/20 bg-algomancy-darker p-6 text-gray-300'>
              Select a card to start editing.
            </div>
          ) : (
            <div className='space-y-6'>
              <Section
                title='Change Control'
                description='One save can update the card and optionally flag all impacted decks for review.'>
                <div className='grid gap-4 xl:grid-cols-[220px,minmax(0,1fr)]'>
                  <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-dark/70 p-3'>
                    <div className='relative mx-auto aspect-[3/4] w-full max-w-[180px] overflow-hidden rounded-md border border-algomancy-purple/15 bg-black/20'>
                      <Image
                        src={form.imageUrl || selectedCard.imageUrl}
                        alt={form.name || selectedCard.name}
                        fill
                        className='object-cover'
                        sizes='180px'
                      />
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                      <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-dark/70 p-3'>
                        <div className='text-xs uppercase tracking-wide text-gray-500'>
                          Rules version
                        </div>
                        <div className='mt-2 text-lg font-semibold text-white'>
                          {selectedCard.rulesVersion || 1}
                        </div>
                      </div>
                      <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-dark/70 p-3'>
                        <div className='text-xs uppercase tracking-wide text-gray-500'>
                          Rules updated
                        </div>
                        <div className='mt-2 text-sm text-white'>
                          {formatDate(selectedCard.rulesUpdatedAt)}
                        </div>
                      </div>
                      <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-dark/70 p-3'>
                        <div className='text-xs uppercase tracking-wide text-gray-500'>
                          Asset updated
                        </div>
                        <div className='mt-2 text-sm text-white'>
                          {formatDate(selectedCard.assetUpdatedAt)}
                        </div>
                      </div>
                      <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-dark/70 p-3'>
                        <div className='text-xs uppercase tracking-wide text-gray-500'>
                          Current usage
                        </div>
                        <div className='mt-2 text-lg font-semibold text-white'>
                          {isUsageLoading ? "..." : usage?.totalDecks || 0}
                        </div>
                      </div>
                    </div>

                    <div className='grid gap-4 md:grid-cols-2'>
                      <div>
                        <FieldLabel
                          htmlFor='change-mode'
                          label='Change classification'
                          hint='Auto is the safest default'
                        />
                        <select
                          id='change-mode'
                          value={changeMode}
                          onChange={(event) =>
                            setChangeMode(event.target.value as CardChangeMode)
                          }
                          className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'>
                          <option value='auto'>Auto-detect</option>
                          <option value='rules'>Rules / balance change</option>
                          <option value='asset'>Image / text only</option>
                        </select>
                      </div>

                      <div>
                        <FieldLabel
                          htmlFor='change-summary'
                          label='Change summary'
                          hint='Optional, but recommended'
                        />
                        <textarea
                          id='change-summary'
                          value={changeSummary}
                          onChange={(event) =>
                            setChangeSummary(event.target.value)
                          }
                          rows={3}
                          placeholder='Example: Stats changed from 10/5 to 10/3 and art refreshed.'
                          className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-algomancy-purple'
                        />
                      </div>
                    </div>

                    <div className='rounded-lg border border-algomancy-purple/20 bg-algomancy-dark/70 p-4'>
                      <div className='flex flex-wrap items-center gap-3'>
                        <span className='rounded-full bg-black/25 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-gray-300'>
                          Preview
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            previewScope === "rules"
                              ? "bg-amber-500/10 text-amber-300"
                              : previewScope === "asset"
                              ? "bg-sky-500/10 text-sky-300"
                              : "bg-white/5 text-gray-400"
                          }`}>
                          {previewScope === "rules"
                            ? "Rules change"
                            : previewScope === "asset"
                            ? "Asset-only change"
                            : "No significant change"}
                        </span>
                      </div>
                      <p className='mt-3 text-sm text-gray-300'>
                        {getPreviewMessage(previewScope, usage)}
                      </p>
                      {usage?.sampleDecks?.length ? (
                        <div className='mt-3 text-xs text-gray-400'>
                          Recent affected decks:{" "}
                          {usage.sampleDecks
                            .map((deck) =>
                              `${deck.name}${deck.isPublic ? "" : " (private)"}`
                            )
                            .join(", ")}
                        </div>
                      ) : null}
                    </div>

                    {lastSaveResult && (
                      <div className='rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100'>
                        <p>{lastSaveResult.changeSummary}</p>
                        <p className='mt-2 text-green-200/80'>
                          {lastSaveResult.changeScope === "rules"
                            ? `Flagged ${lastSaveResult.flaggedDecksCount} deck${lastSaveResult.flaggedDecksCount === 1 ? "" : "s"}, including ${lastSaveResult.flaggedPublicDecksCount} public deck${lastSaveResult.flaggedPublicDecksCount === 1 ? "" : "s"}.`
                            : "No deck review flags were created for this save."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              <Section title='Core Card Data'>
                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                  <div>
                    <FieldLabel
                      htmlFor='card-id'
                      label='Card ID'
                      hint='Stable identifier'
                    />
                    <input
                      id='card-id'
                      value={form.id}
                      readOnly
                      className='mt-2 w-full cursor-not-allowed rounded-md border border-algomancy-purple/15 bg-black/20 px-3 py-2 text-sm text-gray-300 outline-none'
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <FieldLabel htmlFor='card-name' label='Name' />
                    <input
                      id='card-name'
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor='mana-cost' label='Mana Cost' />
                    <input
                      id='mana-cost'
                      type='number'
                      value={form.manaCost}
                      onChange={(event) =>
                        updateField("manaCost", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                  <div className='xl:col-span-2'>
                    <FieldLabel htmlFor='image-url' label='Image URL' />
                    <input
                      id='image-url'
                      value={form.imageUrl}
                      onChange={(event) =>
                        updateField("imageUrl", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor='current-index'
                      label='Current Index'
                    />
                    <input
                      id='current-index'
                      type='number'
                      value={form.currentIndex}
                      onChange={(event) =>
                        updateField("currentIndex", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor='set-complexity'
                      label='Complexity'
                    />
                    <select
                      id='set-complexity'
                      value={form.setComplexity}
                      onChange={(event) =>
                        updateField("setComplexity", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'>
                      {COMPLEXITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor='flavor-text' label='Flavor Text' />
                  <textarea
                    id='flavor-text'
                    value={form.flavorText}
                    onChange={(event) =>
                      updateField("flavorText", event.target.value)
                    }
                    rows={2}
                    className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                  />
                </div>
              </Section>

              <Section title='Rules Data'>
                <div className='grid gap-4 md:grid-cols-3 xl:grid-cols-5'>
                  <div>
                    <FieldLabel
                      htmlFor='element-type'
                      label='Element Type'
                      hint='Supports values like Light/Earth'
                    />
                    <input
                      id='element-type'
                      value={form.elementType}
                      onChange={(event) =>
                        updateField("elementType", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor='element-symbol' label='Element Symbol' />
                    <input
                      id='element-symbol'
                      value={form.elementSymbol}
                      onChange={(event) =>
                        updateField("elementSymbol", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor='element-secondary-symbol'
                      label='Secondary Symbol'
                    />
                    <input
                      id='element-secondary-symbol'
                      value={form.elementSecondarySymbol}
                      onChange={(event) =>
                        updateField(
                          "elementSecondarySymbol",
                          event.target.value
                        )
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor='power' label='Power' />
                    <input
                      id='power'
                      type='number'
                      value={form.power}
                      onChange={(event) => updateField("power", event.target.value)}
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor='defense' label='Defense' />
                    <input
                      id='defense'
                      type='number'
                      value={form.defense}
                      onChange={(event) =>
                        updateField("defense", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-5'>
                  <div>
                    <FieldLabel htmlFor='affinity-fire' label='Affinity Fire' />
                    <input
                      id='affinity-fire'
                      type='number'
                      value={form.affinityFire}
                      onChange={(event) =>
                        updateField("affinityFire", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor='affinity-water' label='Affinity Water' />
                    <input
                      id='affinity-water'
                      type='number'
                      value={form.affinityWater}
                      onChange={(event) =>
                        updateField("affinityWater", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor='affinity-earth' label='Affinity Earth' />
                    <input
                      id='affinity-earth'
                      type='number'
                      value={form.affinityEarth}
                      onChange={(event) =>
                        updateField("affinityEarth", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor='affinity-wood' label='Affinity Wood' />
                    <input
                      id='affinity-wood'
                      type='number'
                      value={form.affinityWood}
                      onChange={(event) =>
                        updateField("affinityWood", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor='affinity-metal' label='Affinity Metal' />
                    <input
                      id='affinity-metal'
                      type='number'
                      value={form.affinityMetal}
                      onChange={(event) =>
                        updateField("affinityMetal", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-3'>
                  <div>
                    <FieldLabel htmlFor='timing-type' label='Timing Type' />
                    <select
                      id='timing-type'
                      value={form.timingType}
                      onChange={(event) =>
                        updateField("timingType", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'>
                      {Object.values(TIMING).map((timing) => (
                        <option key={timing} value={timing}>
                          {timing}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor='main-type' label='Main Type' />
                    <select
                      id='main-type'
                      value={form.mainType}
                      onChange={(event) =>
                        updateField("mainType", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'>
                      {Object.values(CARD_TYPES).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor='sub-type' label='Sub Type' />
                    <input
                      id='sub-type'
                      value={form.subType}
                      onChange={(event) =>
                        updateField("subType", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel
                    htmlFor='timing-description'
                    label='Timing Description'
                  />
                  <textarea
                    id='timing-description'
                    value={form.timingDescription}
                    onChange={(event) =>
                      updateField("timingDescription", event.target.value)
                    }
                    rows={2}
                    className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                  />
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <div>
                    <FieldLabel
                      htmlFor='attributes-text'
                      label='Attributes'
                      hint='Comma separated'
                    />
                    <textarea
                      id='attributes-text'
                      value={form.attributesText}
                      onChange={(event) =>
                        updateField("attributesText", event.target.value)
                      }
                      rows={3}
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor='abilities-text'
                      label='Abilities'
                      hint='One per line'
                    />
                    <textarea
                      id='abilities-text'
                      value={form.abilitiesText}
                      onChange={(event) =>
                        updateField("abilitiesText", event.target.value)
                      }
                      rows={6}
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                </div>
              </Section>

              <Section title='Set Data'>
                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                  <div>
                    <FieldLabel htmlFor='set-symbol' label='Set Symbol' />
                    <input
                      id='set-symbol'
                      value={form.setSymbol}
                      onChange={(event) =>
                        updateField("setSymbol", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <FieldLabel htmlFor='set-name' label='Set Name' />
                    <input
                      id='set-name'
                      value={form.setName}
                      onChange={(event) =>
                        updateField("setName", event.target.value)
                      }
                      className='mt-2 w-full rounded-md border border-algomancy-purple/25 bg-algomancy-dark px-3 py-2 text-sm text-white outline-none focus:border-algomancy-purple'
                    />
                  </div>
                </div>
              </Section>

              <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-algomancy-purple/20 bg-algomancy-darker p-4'>
                <p className='text-sm text-gray-300'>
                  Save once. Rules changes automatically bump card rules version
                  and flag all matching decks for review.
                </p>
                <button
                  type='button'
                  onClick={handleSave}
                  disabled={isSaving}
                  className='rounded-md bg-algomancy-purple px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-algomancy-purple-dark disabled:cursor-not-allowed disabled:opacity-60'>
                  {isSaving ? "Saving..." : "Save Card Update"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
