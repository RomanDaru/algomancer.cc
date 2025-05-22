"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Deck } from "@/app/lib/types/user";
import { Card } from "@/app/lib/types/card";
import { formatDistanceToNow } from "date-fns";
import DeckGrid from "@/app/components/DeckGrid";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch user's decks and cards
  useEffect(() => {
    async function fetchData() {
      if (status === "authenticated") {
        try {
          setIsLoading(true);

          // Fetch decks
          const decksResponse = await fetch("/api/decks");
          if (!decksResponse.ok) {
            throw new Error("Failed to fetch decks");
          }
          const decksData = await decksResponse.json();
          setDecks(decksData);

          // Fetch all cards for element display
          const cardsResponse = await fetch("/api/cards");
          if (!cardsResponse.ok) {
            throw new Error("Failed to fetch cards");
          }
          const cardsData = await cardsResponse.json();
          setCards(cardsData);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchData();
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

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg overflow-hidden'>
          {/* Profile Header */}
          <div className='p-6 sm:p-8 border-b border-algomancy-purple/30'>
            <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
              <div className='w-24 h-24 rounded-full overflow-hidden bg-algomancy-purple flex items-center justify-center'>
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={96}
                    height={96}
                  />
                ) : (
                  <span className='text-white text-3xl'>
                    {session.user?.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div className='text-center sm:text-left'>
                <h1 className='text-2xl font-bold text-white'>
                  {username ? (
                    <>@{username}</>
                  ) : (
                    <div className='flex items-center'>
                      <span>No Username Set</span>
                      <Link
                        href='/profile/edit'
                        className='ml-2 text-sm text-algomancy-purple hover:text-algomancy-gold'>
                        (Set Username)
                      </Link>
                    </div>
                  )}
                </h1>
                <div className='flex flex-col gap-1 mt-1 mb-2'>
                  <div className='flex items-center'>
                    <span className='text-xs text-gray-500 w-20'>
                      Real Name:
                    </span>
                    <span className='text-gray-300'>{session.user.name}</span>
                  </div>
                  <div className='flex items-center'>
                    <span className='text-xs text-gray-500 w-20'>Email:</span>
                    <span className='text-gray-300'>{session.user.email}</span>
                  </div>
                </div>
                <div className='mt-4'>
                  <Link
                    href='/profile/edit'
                    className='px-4 py-2 text-sm rounded-md bg-algomancy-dark border border-algomancy-purple/30 hover:bg-algomancy-purple/20'>
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className='p-6 sm:p-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* My Decks Section */}
              <div className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-xl font-semibold text-white'>My Decks</h2>
                  <Link
                    href='/decks/create'
                    className='px-3 py-1 text-xs rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark'>
                    Create New
                  </Link>
                </div>
                <DeckGrid
                  decks={decks}
                  cards={cards}
                  user={{
                    name: session.user.name || "",
                    username: username,
                  }}
                  emptyMessage="You haven't created any decks yet."
                  createDeckLink='/decks/create'
                  createDeckText='Create Your First Deck'
                  viewAllLink='/profile/decks'
                  viewAllText={`View all ${decks.length} decks`}
                  maxDisplay={3}
                  columns={{ sm: 1, md: 1, lg: 1, xl: 1 }}
                />
              </div>

              {/* Liked Decks Section */}
              <div className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-xl font-semibold text-white'>
                    Liked Decks
                  </h2>
                  <Link
                    href='/profile/liked-decks'
                    className='px-3 py-1 text-xs rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark'>
                    View All
                  </Link>
                </div>
                <div className='text-center py-8 text-gray-400'>
                  <p className='mb-4'>
                    ❤️ Discover and like amazing decks from the community!
                  </p>
                  <Link
                    href='/decks'
                    className='inline-block px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark rounded-md text-white text-sm transition-colors'>
                    Browse Community Decks
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
