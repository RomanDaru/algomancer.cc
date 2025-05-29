"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import {
  UsersIcon,
  CalendarIcon,
  EyeIcon,
  TrophyIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import WinnerSelectionModal from "./WinnerSelectionModal";

interface CompetitionSubmission {
  _id: string;
  competitionId: string;
  deckId: string;
  userId: string;
  submittedAt: string;
  discordMessageId?: string;
  deck: {
    _id: string;
    name: string;
    description?: string;
    cards: Array<{ cardId: string; quantity: number }>;
    createdAt: string;
  } | null;
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
}

interface CompetitionSubmissionsProps {
  competitionId: string;
  isAdmin?: boolean;
  onRefreshRequest?: () => void; // Callback to trigger refresh from parent
}

export default function CompetitionSubmissions({
  competitionId,
  isAdmin = false,
  onRefreshRequest,
}: CompetitionSubmissionsProps) {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<CompetitionSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [competitionId]);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/competitions/${competitionId}/entries`
      );

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        toast.error("Failed to load submissions");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-8'>
        <div className='animate-pulse'>
          <div className='h-6 bg-gray-700 rounded w-1/3 mb-6'></div>
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-20 bg-gray-700 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-8 text-center'>
        <UsersIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
        <h3 className='text-lg font-semibold text-white mb-2'>
          No Submissions Yet
        </h3>
        <p className='text-gray-300'>
          No decks have been submitted to this competition yet.
        </p>
      </div>
    );
  }

  return (
    <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-8'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center'>
          <UsersIcon className='w-6 h-6 text-algomancy-purple mr-2' />
          <h3 className='text-xl font-semibold text-white'>
            Submitted Decks ({submissions.length})
          </h3>
        </div>
        <div className='flex items-center space-x-2'>
          <button
            onClick={fetchSubmissions}
            disabled={isLoading}
            className='p-2 text-gray-400 hover:text-algomancy-purple hover:bg-algomancy-purple/10 rounded-md transition-colors disabled:opacity-50'
            title='Refresh submissions'>
            <ArrowPathIcon
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
          {isAdmin && <div className='text-sm text-gray-400'>Admin View</div>}
        </div>
      </div>

      <div className='space-y-4'>
        {submissions.map((submission) => (
          <div
            key={submission._id}
            className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-6'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                {/* Deck Info */}
                <div className='flex items-start mb-4'>
                  <div className='flex-1'>
                    <h4 className='text-lg font-semibold text-white mb-1'>
                      {submission.deck?.name || "Unknown Deck"}
                    </h4>
                    {submission.deck?.description && (
                      <p className='text-gray-300 text-sm mb-2'>
                        {submission.deck.description}
                      </p>
                    )}
                    <div className='text-sm text-gray-400'>
                      {submission.deck?.cards.reduce(
                        (sum, card) => sum + card.quantity,
                        0
                      ) || 0}{" "}
                      cards
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className='flex items-center mb-4'>
                  <div className='w-8 h-8 rounded-full overflow-hidden bg-algomancy-purple flex items-center justify-center mr-3'>
                    {submission.user?.image ? (
                      <Image
                        src={submission.user.image}
                        alt={submission.user.name || "User"}
                        width={32}
                        height={32}
                      />
                    ) : (
                      <span className='text-white text-sm'>
                        {submission.user?.name?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className='text-white font-medium'>
                      {submission.user?.name || "Unknown User"}
                    </div>
                    {isAdmin && (
                      <div className='text-gray-400 text-sm'>
                        {submission.user?.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submission Info */}
                <div className='flex items-center text-sm text-gray-400 space-x-4'>
                  <div className='flex items-center'>
                    <CalendarIcon className='w-4 h-4 mr-1' />
                    Submitted{" "}
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </div>
                  <div className='flex items-center'>
                    <ClockIcon className='w-4 h-4 mr-1' />
                    {new Date(submission.submittedAt).toLocaleTimeString()}
                  </div>
                  <div className='text-gray-500 text-xs'>
                    ID: {submission._id.slice(-8)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className='flex items-center space-x-2 ml-4'>
                {submission.deck && (
                  <Link
                    href={`/decks/${submission.deck._id}`}
                    className='inline-flex items-center px-3 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark rounded-md text-white text-sm font-medium transition-colors'>
                    <EyeIcon className='w-4 h-4 mr-1' />
                    View Deck
                  </Link>
                )}

                {isAdmin && (
                  <button
                    onClick={() => setIsWinnerModalOpen(true)}
                    className='inline-flex items-center px-3 py-2 bg-algomancy-gold hover:bg-algomancy-gold-dark rounded-md text-black text-sm font-medium transition-colors'>
                    <TrophyIcon className='w-4 h-4 mr-1' />
                    Select Winners
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdmin && submissions.length > 0 && (
        <div className='mt-6 p-4 bg-algomancy-dark border border-algomancy-gold/20 rounded-lg'>
          <h4 className='text-sm font-semibold text-algomancy-gold mb-2'>
            Admin Guide
          </h4>
          <div className='text-sm text-gray-300'>
            • Users submit decks here and share links in Discord
            <br />• Count Discord reactions/votes manually for each deck
            <br />• Use "Select Winners" to choose winners based on vote counts
            <br />• All submissions are tracked with timestamps and user info
          </div>
        </div>
      )}

      {/* Winner Selection Modal */}
      <WinnerSelectionModal
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        competitionId={competitionId}
        submissions={submissions.map((s) => ({
          _id: s._id,
          deck: s.deck,
          user: s.user
            ? {
                _id: s.user._id,
                name: s.user.name,
                username: null, // We don't have username in the current interface
              }
            : null,
          submittedAt: new Date(s.submittedAt),
        }))}
        onWinnersSelected={() => {
          setIsWinnerModalOpen(false);
          // Refresh the page to show updated competition status and winners
          window.location.reload();
        }}
      />
    </div>
  );
}
