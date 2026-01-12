"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Deck } from "@/app/lib/types/user";
import { toast, Toaster } from "react-hot-toast";
import DeckGrid from "@/app/components/DeckGrid";
import GuestDeckMigrationBanner from "@/app/components/GuestDeckMigrationBanner";
import { GuestDeckMigration } from "@/app/lib/utils/guestDeckMigration";

export default function MyDecks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [migrationData, setMigrationData] = useState<{
    deckName: string;
    totalCards: number;
  } | null>(null);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Check for guest deck migration when user becomes authenticated
  // Note: Primary migration is now handled by GuestDeckMigrationHandler
  // This is kept as a fallback for edge cases
  useEffect(() => {
    if (status === "authenticated") {
      // Add a small delay to let the primary migration handler run first
      const timer = setTimeout(() => {
        const guestDeckInfo = GuestDeckMigration.getGuestDeckInfo();
        if (guestDeckInfo) {
          setMigrationData({
            deckName: guestDeckInfo.deckName,
            totalCards: guestDeckInfo.totalCards,
          });
          setShowMigrationBanner(true);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  // Fetch user's decks
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch decks
        const decksResponse = await fetch("/api/decks");
        if (!decksResponse.ok) {
          throw new Error("Failed to fetch decks");
        }
        const decksData = await decksResponse.json();
        setDecks(decksData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
        toast.error("Failed to load decks");
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  if (status === "loading" || isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Access the username safely
  const username =
    session.user.username !== undefined ? session.user.username : null;
  const achievementXp =
    typeof session.user.achievementXp === "number"
      ? session.user.achievementXp
      : undefined;

  return (
    <div className='container mx-auto px-4 py-8'>
      <Toaster position='top-right' />
      <div className='max-w-7xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-white'>My Decks</h1>
          <Link
            href='/decks/create'
            className='px-4 py-2 text-sm rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark'>
            Create New Deck
          </Link>
        </div>

        {/* Guest Deck Migration Banner */}
        {showMigrationBanner && migrationData && (
          <GuestDeckMigrationBanner
            deckName={migrationData.deckName}
            totalCards={migrationData.totalCards}
            onMigrate={async () => {
              const result = await GuestDeckMigration.migrateGuestDeck();
              if (result.success) {
                setShowMigrationBanner(false);
                // Refresh the decks list
                window.location.reload();
              }
              return result;
            }}
            onDiscard={() => {
              GuestDeckMigration.discardGuestDeck();
              setShowMigrationBanner(false);
            }}
            onDismiss={() => setShowMigrationBanner(false)}
          />
        )}

        {error && (
          <div className='bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-white'>
            <p>{error}</p>
          </div>
        )}

        <DeckGrid
          decks={decks}
          user={{
            name: session.user.name || "",
            username: username,
            achievementXp: achievementXp,
          }}
          emptyMessage="You haven't created any decks yet. Start building your first deck!"
          createDeckLink='/decks/create'
          createDeckText='Create Your First Deck'
          columns={{ sm: 1, md: 2, lg: 2, xl: 3 }}
          className='py-4'
        />
      </div>
    </div>
  );
}
