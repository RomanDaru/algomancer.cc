"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Deck } from "@/app/lib/types/user";
import { toast, Toaster } from "react-hot-toast";
import DeckGrid from "@/app/components/DeckGrid";

interface DeckWithUser {
  deck: Deck;
  user: {
    name: string;
    username: string | null;
  };
  isLikedByCurrentUser: boolean;
  deckElements?: string[];
}

export default function LikedDecksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [decks, setDecks] = useState<DeckWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  // Fetch liked decks
  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.id) return;

      try {
        setLoading(true);

        const likedDecksResponse = await fetch("/api/user/liked-decks");

        if (!likedDecksResponse.ok) {
          throw new Error("Failed to fetch liked decks");
        }

        const likedDecksData = await likedDecksResponse.json();
        const normalized = Array.isArray(likedDecksData)
          ? likedDecksData.map((item) => ({
              ...item,
              isLikedByCurrentUser: Boolean(item.isLikedByCurrentUser),
            }))
          : [];
        setDecks(normalized);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load liked decks");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session?.user?.id]);

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-algomancy-dark rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-algomancy-dark rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link
              href="/profile"
              className="text-algomancy-purple hover:text-algomancy-gold mr-4"
            >
              ← Back to Profile
            </Link>
            <h1 className="text-2xl font-bold text-white">Liked Decks</h1>
          </div>
          <Link
            href="/decks"
            className="px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark rounded-md text-white text-sm transition-colors"
          >
            Browse More Decks
          </Link>
        </div>

        {/* Liked Decks Grid */}
        <DeckGrid
          decksWithUserInfo={decks}
          emptyMessage="You haven't liked any decks yet."
          emptyAction={{
            text: "Browse Community Decks",
            link: "/decks",
          }}
          onDeckLikeChange={(deckId, liked) => {
            if (!liked) {
              setDecks((prev) =>
                prev.filter((item) => item.deck._id.toString() !== deckId)
              );
            }
          }}
          columns={{ sm: 1, md: 2, lg: 2, xl: 3 }}
          className="py-4"
        />

        {/* Stats */}
        {decks.length > 0 && (
          <div className="mt-8 text-center text-gray-400">
            <p>You have liked {decks.length} deck{decks.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}
