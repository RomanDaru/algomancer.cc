"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Deck } from "@/app/lib/types/user";
import DeckGrid from "@/app/components/DeckGrid";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedDecks, setLikedDecks] = useState<
    Array<{
      deck: Deck;
      user: { name: string; username: string | null };
      isLikedByCurrentUser: boolean;
      deckElements?: string[];
    }>
  >([]);
  const [likedDecksLoading, setLikedDecksLoading] = useState(false);
  const [likedDecksLoaded, setLikedDecksLoaded] = useState(false);
  const [shouldLoadLikedDecks, setShouldLoadLikedDecks] = useState(false);
  const [likedDecksTarget, setLikedDecksTarget] =
    useState<HTMLDivElement | null>(null);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch user's decks
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
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchData();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (shouldLoadLikedDecks) return;
    const target = likedDecksTarget;
    if (!target) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoadLikedDecks(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadLikedDecks(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [status, shouldLoadLikedDecks, likedDecksTarget]);

  useEffect(() => {
    async function fetchLikedDecks() {
      if (!session?.user?.id) return;

      try {
        setLikedDecksLoading(true);
        const response = await fetch("/api/user/liked-decks");
        if (!response.ok) {
          throw new Error("Failed to fetch liked decks");
        }
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((item) => ({
              ...item,
              isLikedByCurrentUser: Boolean(item.isLikedByCurrentUser),
            }))
          : [];
        setLikedDecks(normalized);
      } catch (error) {
        console.error("Error fetching liked decks:", error);
        setLikedDecks([]);
      } finally {
        setLikedDecksLoading(false);
        setLikedDecksLoaded(true);
      }
    }

    if (!shouldLoadLikedDecks || likedDecksLoaded || likedDecksLoading) {
      return;
    }

    fetchLikedDecks();
  }, [
    shouldLoadLikedDecks,
    likedDecksLoaded,
    likedDecksLoading,
    session?.user?.id,
  ]);

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
                <div ref={setLikedDecksTarget}>
                  {shouldLoadLikedDecks ? (
                    likedDecksLoading ? (
                      <div className='flex justify-center items-center py-6'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-algomancy-purple'></div>
                      </div>
                    ) : (
                      <DeckGrid
                        decksWithUserInfo={likedDecks.slice(0, 3)}
                        emptyMessage="You haven't liked any decks yet."
                        emptyAction={{
                          text: "Browse Community Decks",
                          link: "/decks",
                        }}
                        onDeckLikeChange={(deckId, liked) => {
                          if (!liked) {
                            setLikedDecks((prev) =>
                              prev.filter(
                                (item) => item.deck._id.toString() !== deckId
                              )
                            );
                          }
                        }}
                        columns={{ sm: 1, md: 1, lg: 1, xl: 1 }}
                      />
                    )
                  ) : (
                    <div className='text-center py-8 text-gray-400'>
                      <p className='mb-4'>
                        Discover and like amazing decks from the community!
                      </p>
                      <Link
                        href='/decks'
                        className='inline-block px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark rounded-md text-white text-sm transition-colors'>
                        Browse Community Decks
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
