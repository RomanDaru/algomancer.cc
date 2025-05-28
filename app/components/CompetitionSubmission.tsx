"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useOptimizedSession } from "@/app/hooks/useOptimizedSession";
import { Competition } from "@/app/lib/types/user";
import { Deck } from "@/app/lib/types/user";
import {
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface CompetitionSubmissionProps {
  competition: Competition;
}

interface UserDeck {
  _id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  cards: Array<{ cardId: string; quantity: number }>;
  createdAt: string;
}

export default function CompetitionSubmission({
  competition,
}: CompetitionSubmissionProps) {
  const { data: session, status } = useOptimizedSession();
  const [userDecks, setUserDecks] = useState<UserDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isActive = competition.status === "active";
  const canSubmit = isActive && session && !hasSubmitted;

  // Fetch user's decks
  useEffect(() => {
    if (session?.user?.id && isActive) {
      fetchUserDecks();
      checkExistingSubmission();
    }
  }, [session, competition._id, isActive]);

  const fetchUserDecks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/decks");
      if (response.ok) {
        const decks = await response.json();
        // Filter to only public decks
        const publicDecks = decks.filter((deck: UserDeck) => deck.isPublic);
        setUserDecks(publicDecks);
      }
    } catch (error) {
      console.error("Error fetching user decks:", error);
      toast.error("Failed to load your decks");
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingSubmission = async () => {
    try {
      const response = await fetch(
        `/api/competitions/${competition._id}/entries`
      );
      if (response.ok) {
        const entries = await response.json();
        const userEntry = entries.find(
          (entry: any) => entry.userId === session?.user?.id
        );
        setHasSubmitted(!!userEntry);
      }
    } catch (error) {
      console.error("Error checking existing submission:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDeckId) {
      toast.error("Please select a deck to submit");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/competitions/${competition._id}/entries`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deckId: selectedDeckId }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Deck submitted successfully!");
        setHasSubmitted(true);
        setSelectedDeckId("");
      } else {
        toast.error(data.error || "Failed to submit deck");
      }
    } catch (error) {
      console.error("Error submitting deck:", error);
      toast.error("Failed to submit deck");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className='bg-algomancy-darker border border-algomancy-purple/20 rounded-lg p-6'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-700 rounded w-1/4 mb-4'></div>
          <div className='h-8 bg-gray-700 rounded w-full'></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className='bg-algomancy-darker border border-algomancy-purple/20 rounded-lg p-6'>
        <div className='flex items-center mb-4'>
          <ExclamationTriangleIcon className='w-5 h-5 text-yellow-400 mr-2' />
          <h3 className='text-lg font-semibold text-white'>Submit Your Deck</h3>
        </div>
        <p className='text-gray-300 mb-4'>
          You need to be signed in to submit a deck to this competition.
        </p>
        <Link
          href='/auth/signin'
          className='inline-flex items-center px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark rounded-md text-white font-medium transition-colors'>
          Sign In to Submit
        </Link>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className='bg-algomancy-darker border border-gray-600/20 rounded-lg p-6'>
        <div className='flex items-center mb-4'>
          <ClockIcon className='w-5 h-5 text-gray-400 mr-2' />
          <h3 className='text-lg font-semibold text-gray-300'>
            Submission Closed
          </h3>
        </div>
        <p className='text-gray-400'>
          This competition is no longer accepting submissions.
        </p>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className='bg-algomancy-darker border border-green-500/20 rounded-lg p-6'>
        <div className='flex items-center mb-4'>
          <CheckCircleIcon className='w-5 h-5 text-green-400 mr-2' />
          <h3 className='text-lg font-semibold text-white'>Deck Submitted!</h3>
        </div>
        <p className='text-gray-300'>
          You have successfully submitted your deck to this competition. Good
          luck!
        </p>
      </div>
    );
  }

  return (
    <div className='bg-algomancy-darker border border-algomancy-purple/20 rounded-lg p-6'>
      <div className='flex items-center mb-4'>
        <PlusIcon className='w-5 h-5 text-algomancy-purple mr-2' />
        <h3 className='text-lg font-semibold text-white'>Submit Your Deck</h3>
      </div>

      {isLoading ? (
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-700 rounded w-1/3 mb-4'></div>
          <div className='h-10 bg-gray-700 rounded w-full mb-4'></div>
          <div className='h-8 bg-gray-700 rounded w-24'></div>
        </div>
      ) : userDecks.length === 0 ? (
        <div>
          <p className='text-gray-300 mb-4'>
            You don't have any public decks to submit. Create a public deck
            first!
          </p>
          <Link
            href='/decks/create'
            className='inline-flex items-center px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark rounded-md text-white font-medium transition-colors'>
            Create a Deck
          </Link>
        </div>
      ) : (
        <div>
          <p className='text-gray-300 mb-4'>
            Select one of your public decks to submit to this competition:
          </p>

          <div className='mb-4'>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className='w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'>
              <option value=''>Select a deck...</option>
              {userDecks.map((deck) => (
                <option key={deck._id} value={deck._id}>
                  {deck.name} (
                  {deck.cards.reduce((sum, card) => sum + card.quantity, 0)}{" "}
                  cards)
                </option>
              ))}
            </select>
          </div>

          <div className='flex items-center space-x-3'>
            <button
              onClick={handleSubmit}
              disabled={!selectedDeckId || isSubmitting}
              className='inline-flex items-center px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-white font-medium transition-colors'>
              {isSubmitting ? "Submitting..." : "Submit Deck"}
            </button>

            <Link
              href='/decks/create'
              className='inline-flex items-center px-4 py-2 bg-algomancy-dark border border-algomancy-purple/30 hover:bg-algomancy-purple/20 rounded-md text-white font-medium transition-colors'>
              Create New Deck
            </Link>
          </div>

          <div className='mt-4 p-3 bg-algomancy-dark border border-algomancy-blue/20 rounded-md'>
            <p className='text-sm text-gray-300'>
              <strong>Note:</strong> Only public decks can be submitted. After
              submission, your deck will be shared in the Discord competition
              channel for community voting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
