"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Card } from "@/app/lib/types/card";
import { Deck } from "@/app/lib/types/user";
import Image from "next/image";
import Link from "next/link";
import { PencilIcon, TrashIcon, DocumentDuplicateIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import DeckStats from "@/app/components/DeckStats";
import LikeButton from "@/app/components/LikeButton";
import ShareButton from "@/app/components/ShareButton";
import { toast, Toaster } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import ElementIcons from "@/app/components/ElementIcons";
import DeckDetailViewer from "@/app/components/DeckDetailViewer";
import YouTubeEmbed from "@/app/components/YouTubeEmbed";
import {
  ElementType,
  getAllDeckElements,
  generateElementGradient,
} from "@/app/lib/utils/elements";

interface DeckPageProps {
  params: {
    id: string;
  };
}

export default function DeckPage({ params }: DeckPageProps) {
  // Access params directly - we'll handle the warning later in a better way
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [user, setUser] = useState<{
    name: string;
    username: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const autoCopyRef = useRef<{ ran: boolean } | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);
  useDropdownAutoClose(optionsOpen, () => setOptionsOpen(false), optionsRef as any);

  // Utility: trigger file download
  const downloadFile = (filename: string, content: string, mime = "text/plain;charset=utf-8") => {
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      toast.error("Failed to download file");
    }
  };

  const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9\-_. ]/gi, "_");

  // Export: .txt deck list
  const handleExportTxt = () => {
    if (!deck) return;
    const nameLine = deck.name;
    const elementsLine = `Elements: ${deckElements.join("/")}`;
    const totalLine = `Total cards: ${totalCards}`;
    const lines: string[] = [nameLine, elementsLine, totalLine, "", "Cards:"];
    for (const dc of deck.cards) {
      const card = cards.find((c) => c.id === dc.cardId);
      const cardName = card?.name || dc.cardId;
      const elem = card?.element?.type ? ` (${card.element.type})` : "";
      lines.push(`${dc.quantity}x ${cardName}${elem}`);
    }
    const content = lines.join("\n");
    downloadFile(`${sanitizeFilename(deck.name)}.txt`, content, "text/plain;charset=utf-8");
    setOptionsOpen(false);
  };

  // Export: .tss (placeholder JSON for now)
  const handleExportTss = () => {
    if (!deck) return;
    const payload = {
      name: deck.name,
      elements: deckElements,
      totalCards,
      cards: deck.cards.map((dc) => {
        const card = cards.find((c) => c.id === dc.cardId);
        return {
          id: dc.cardId,
          name: card?.name || dc.cardId,
          element: card?.element?.type || null,
          quantity: dc.quantity,
        };
      }),
      generatedAt: new Date().toISOString(),
      format: "algomancer.tss.v1",
    };
    downloadFile(`${sanitizeFilename(deck.name)}.tss`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    setOptionsOpen(false);
  };

  // Fetch deck and cards
  useEffect(() => {
    if (!id) return; // Wait for id to be resolved

    async function fetchData() {
      try {
        const response = await fetch(`/api/decks/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Deck not found");
          } else if (response.status === 403) {
            throw new Error("You don't have permission to view this deck");
          } else {
            throw new Error("Failed to fetch deck");
          }
        }
        const data = await response.json();
        setDeck(data.deck);
        setCards(data.cards);
        setUser(data.user || null);

        // Only increment view count after we have the deck data
        // This ensures we have the correct deck information
        if (data.deck) {
          // Use setTimeout to delay the view count increment
          // This prevents it from blocking the UI rendering
          setTimeout(() => {
            incrementViewCount(data.deck);
          }, 1000);
        }
      } catch (error) {
        console.error("Error fetching deck:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    // Function to increment view count
    async function incrementViewCount(currentDeck = deck) {
      try {
        // If no deck is provided, don't proceed
        if (!currentDeck) {
          return;
        }

        // Only increment view count for public decks or if the user is not the owner
        if (
          session &&
          session.user &&
          session.user.id === currentDeck.userId.toString()
        ) {
          return; // Don't increment view count for the owner
        }

        // Check if the deck is public before incrementing view count
        if (!currentDeck.isPublic) {
          return; // Don't increment view count for private decks
        }

        await fetch(`/api/decks/${id}/view`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Error incrementing view count:", error);
        // Don't show an error to the user for this - non-critical feature
      }
    }

    fetchData();
  }, [id, session, deck?.userId]);

  // Handle deck deletion
  const handleDeleteDeck = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this deck? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/decks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete deck");
      }

      toast.success("Deck deleted successfully");
      router.push("/profile/decks");
    } catch (error) {
      console.error("Error deleting deck:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete deck"
      );
      setIsDeleting(false);
    }
  };

  // Handle deck copy
  const handleCopyDeck = async () => {
    if (!id) return;

    // Require auth
    if (!session?.user?.id) {
      // Redirect to app's sign-in page with return target
      let callback = `/decks/${id}`;
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("copyAfterLogin", "1");
        callback = url.pathname + url.search;
      }
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callback)}`);
      return;
    }

    setIsCopying(true);
    try {
      const response = await fetch(`/api/decks/${id}/copy`, { method: "POST" });
      if (!response.ok) {
        let message = "Failed to copy deck";
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
      }

      const data = await response.json();
      const newId = data.deckId || data.id || data._id || data.deck?._id;
      toast.dismiss();
      toast.success("Deck copied. Opening editor...");
      if (newId) {
        router.push(`/decks/${newId}/edit`);
      }
    } catch (error) {
      console.error("Error copying deck:", error);
      toast.error(error instanceof Error ? error.message : "Failed to copy deck");
    } finally {
      setIsCopying(false);
    }
  };

  // After login auto-copy flow (guarded to run only once)
  useEffect(() => {
    if (!id) return;
    if (status !== "authenticated") return;
    if (isCopying) return;
    const shouldCopy = searchParams?.get("copyAfterLogin") === "1";
    if (!shouldCopy) return;
    // Guard with ref to ensure single execution
    if (!autoCopyRef.current) autoCopyRef.current = { ran: false };
    const ref = autoCopyRef.current;
    if (ref.ran) return;
    ref.ran = true;

    handleCopyDeck();
  }, [id, status, searchParams, isCopying]);

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
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-white'>
            <h2 className='text-xl font-bold mb-2'>Error</h2>
            <p>{error}</p>
            <button
              onClick={() => router.push("/profile/decks")}
              className='mt-4 px-4 py-2 bg-algomancy-purple rounded hover:bg-algomancy-purple-dark'>
              Back to My Decks
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return null;
  }

  // Check if the current user is the owner of the deck
  const isOwner = session?.user?.id === deck.userId.toString();

  // Group cards by type
  const groupedCards: Record<string, { card: Card; quantity: number }[]> = {};

  // Map deck cards to actual cards
  deck.cards.forEach((deckCard) => {
    const card = cards.find((c) => c.id === deckCard.cardId);
    if (card) {
      const type = card.typeAndAttributes.mainType;
      if (!groupedCards[type]) {
        groupedCards[type] = [];
      }
      groupedCards[type].push({ card, quantity: deckCard.quantity });
    }
  });

  // Sort card types
  const sortedTypes = Object.keys(groupedCards).sort();

  // Calculate total cards
  const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);

  // Get deck elements
  const cardsWithQuantities = deck.cards
    .map((deckCard) => {
      const card = cards.find((c) => c.id === deckCard.cardId);
      return {
        card,
        quantity: deckCard.quantity,
      };
    })
    .filter((item) => item.card !== undefined) as {
    card: Card;
    quantity: number;
  }[];

  // Get ALL elements in the deck
  const deckElements =
    cardsWithQuantities.length > 0
      ? getAllDeckElements(cardsWithQuantities)
      : ["Colorless"];

  // Generate gradient based on deck elements - use non-vibrant colors
  const gradientStyle = {
    background: generateElementGradient(deckElements, "135deg", false),
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <Toaster position='top-right' />
      <div className='max-w-7xl mx-auto'>
        {/* Deck header with gradient background */}
        <div className='relative rounded-lg mb-6'>
          {/* Element gradient background with consistent opacity */}
          <div className='absolute inset-0 opacity-30 rounded-lg pointer-events-none z-0' style={gradientStyle} />

          <div className='relative z-10 p-6 flex flex-col md:flex-row justify-between items-start md:items-start'>
            <div className='flex-1'>
              {/* Top row: left group (icons/name/user) + right-aligned Options */}
              <div className='flex items-center w-full gap-3'>
                <div className='flex items-center flex-wrap gap-3'>
                  <ElementIcons
                    elements={deckElements}
                    size={24}
                    showTooltips={true}
                  />
                  <h1 className='text-2xl font-bold text-white'>{deck.name}</h1>
                  <span className='text-algomancy-gold font-medium text-lg'>
                    {user?.username ? (
                      <>@{user.username}</>
                    ) : (
                      <span className='text-gray-300'>
                        {user?.name || "Unknown User"}
                      </span>
                    )}
                  </span>
                </div>

                {/* Options dropdown pinned to far right */}
                <div className='ml-auto relative' ref={optionsRef}>
                  <button
                    onClick={() => setOptionsOpen((o) => !o)}
                    className='flex items-center px-4 py-2 bg-algomancy-dark text-white border border-algomancy-purple/30 rounded hover:bg-algomancy-dark/80 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/50'
                    aria-haspopup='menu'
                    aria-expanded={optionsOpen}
                  >
                    Options
                    <ChevronDownIcon className='w-4 h-4 ml-2' />
                  </button>
                  {optionsOpen && (
                    <div
                      className='absolute right-0 mt-2 w-56 bg-algomancy-darker border border-algomancy-purple/30 rounded shadow-lg z-50 overflow-visible'
                      role='menu'
                    >
                      <button
                        onClick={() => { setOptionsOpen(false); handleCopyDeck(); }}
                        disabled={isCopying}
                        className='w-full text-left px-4 py-2 text-sm text-white hover:bg-algomancy-purple/30 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/40 disabled:opacity-50 flex items-center'
                        role='menuitem'
                      >
                        <DocumentDuplicateIcon className='w-4 h-4 mr-2' />
                        {isCopying ? "Copying Deck…" : "Copy Deck"}
                      </button>
                      <button
                        onClick={handleExportTxt}
                        className='w-full text-left px-4 py-2 text-sm text-white hover:bg-algomancy-purple/30 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/40 flex items-center'
                        role='menuitem'
                      >
                        <span className='w-4 h-4 mr-2 rounded-full bg-white/20 inline-block' />
                        Export deck .txt
                      </button>
                      <button
                        onClick={handleExportTss}
                        className='w-full text-left px-4 py-2 text-sm text-white hover:bg-algomancy-purple/30 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/40 flex items-center'
                        role='menuitem'
                      >
                        <span className='w-4 h-4 mr-2 rounded bg-white/20 inline-block' />
                        Export deck .tss
                      </button>
                      {isOwner && (
                        <>
                          <div className='my-1 border-t border-algomancy-purple/20' />
                          <button
                            onClick={() => { setOptionsOpen(false); router.push(`/decks/${id}/edit`); }}
                            className='w-full text-left px-4 py-2 text-sm text-white hover:bg-algomancy-purple/30 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/40 flex items-center'
                            role='menuitem'
                          >
                            <PencilIcon className='w-4 h-4 mr-2' />
                            Edit
                          </button>
                          <button
                            onClick={() => { setOptionsOpen(false); handleDeleteDeck(); }}
                            disabled={isDeleting}
                            className='w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 focus:outline-none focus:ring-1 focus:ring-red-400/40 disabled:opacity-50 flex items-center'
                            role='menuitem'
                          >
                            <TrashIcon className='w-4 h-4 mr-2' />
                            {isDeleting ? "Deleting…" : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom row: Date, Views, Likes */}
              <div className='flex items-center mt-2 text-sm text-white'>
                <span>
                  {formatDistanceToNow(new Date(deck.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                <span className='ml-3 flex items-center'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4 mr-1'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                  {typeof deck.views === "number" ? deck.views : 0}
                </span>
                <span className='ml-3'>
                  <LikeButton
                    deckId={deck._id.toString()}
                    initialLikes={deck.likes || 0}
                    size='sm'
                    showCount={true}
                    className='text-white'
                  />
                </span>
                <span className='ml-3'>
                  <ShareButton
                    deckId={deck._id.toString()}
                    deckName={deck.name}
                    size='sm'
                    className='text-white'
                  />
                </span>
              </div>

              {deck.description && (
                <p className='text-gray-300 mt-3'>{deck.description}</p>
              )}
            </div>

            {/* Options dropdown moved into heading row above */}
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Deck Stats */}
          <div className='lg:col-span-1'>
            <DeckStats cards={cards} deckCards={deck.cards} />
          </div>

          {/* Right Column - Card List */}
          <div className='lg:col-span-2'>
            <DeckDetailViewer
              cards={cards}
              groupedCards={groupedCards}
              totalCards={totalCards}
            />
          </div>
        </div>

        {/* YouTube Video Section - Bottom */}
        {deck.youtubeUrl && (
          <div className='mt-8'>
            <div className='max-w-4xl mx-auto'>
              <h2 className='text-2xl font-bold text-white mb-4 text-center'>
                Deck Showcase Video
              </h2>
              <YouTubeEmbed
                url={deck.youtubeUrl}
                title={`${deck.name} - Deck Showcase`}
                showTitle={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Close dropdown on outside click and Escape key
// Hook must be inside the module but outside the component body usage is within component
// We'll bind listeners conditionally when optionsOpen is true
// Note: This pattern keeps the listeners lightweight
export function useDropdownAutoClose(
  isOpen: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        onClose();
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose, containerRef]);
}
