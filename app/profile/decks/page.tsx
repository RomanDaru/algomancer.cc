"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MyDecks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch user's decks
  useEffect(() => {
    if (status === "authenticated") {
      // This will be implemented later when we create the deck API
      // For now, we'll just set an empty array
      setDecks([]);
      setIsLoading(false);
    }
  }, [status]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">My Decks</h1>
          <Link 
            href="/decks/create" 
            className="px-4 py-2 text-sm rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark"
          >
            Create New Deck
          </Link>
        </div>

        {decks.length === 0 ? (
          <div className="bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-12 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">No Decks Yet</h2>
            <p className="text-gray-400 mb-6">You haven't created any decks yet. Start building your first deck!</p>
            <Link 
              href="/decks/create" 
              className="px-6 py-3 text-sm rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark"
            >
              Create Your First Deck
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* This will be populated with actual decks later */}
          </div>
        )}
      </div>
    </div>
  );
}
