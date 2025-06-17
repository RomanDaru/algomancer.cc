"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import {
  TrophyIcon,
  CalendarIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import WinnersPodium from "@/app/components/WinnersPodium";
import CompetitionSubmission from "@/app/components/CompetitionSubmission";
import CompetitionSubmissions from "@/app/components/CompetitionSubmissions";
import { useSession } from "next-auth/react";
import { Competition } from "@/app/lib/types/user";
import { COMPETITION_STATUS } from "@/app/lib/constants";

function getStatusColor(status: string) {
  switch (status) {
    case COMPETITION_STATUS.ACTIVE:
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case COMPETITION_STATUS.VOTING:
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case COMPETITION_STATUS.COMPLETED:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    case COMPETITION_STATUS.UPCOMING:
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case COMPETITION_STATUS.ACTIVE:
      return <ClockIcon className='w-5 h-5' />;
    case COMPETITION_STATUS.VOTING:
      return <ExclamationTriangleIcon className='w-5 h-5' />;
    case COMPETITION_STATUS.COMPLETED:
      return <CheckCircleIcon className='w-5 h-5' />;
    case COMPETITION_STATUS.UPCOMING:
      return <CalendarIcon className='w-5 h-5' />;
    default:
      return <CalendarIcon className='w-5 h-5' />;
  }
}

function getTypeIcon(type: string) {
  // Return empty string to remove icons
  return "";
}

// Client component wrapper for submissions
function ClientSubmissionsWrapper({
  competitionId,
  refreshTrigger,
}: {
  competitionId: string;
  refreshTrigger: number;
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;

  return (
    <div className='mb-8'>
      <CompetitionSubmissions
        competitionId={competitionId}
        isAdmin={isAdmin}
        key={refreshTrigger} // Force re-render when refreshTrigger changes
      />
    </div>
  );
}

export default function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [competitionId, setCompetitionId] = useState<string>("");
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh submissions list
  const refreshSubmissions = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setCompetitionId(id);

        const response = await fetch(`/api/competitions/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Competition not found");
          } else {
            throw new Error("Failed to fetch competition");
          }
          return;
        }

        const apiResponse = await response.json();

        // Handle new API response format
        if (!apiResponse.success) {
          setError(apiResponse.error || "Failed to fetch competition");
          return;
        }

        const data = apiResponse.data;
        // Convert date strings back to Date objects
        data.startDate = new Date(data.startDate);
        data.endDate = new Date(data.endDate);
        data.votingEndDate = new Date(data.votingEndDate);
        data.createdAt = new Date(data.createdAt);
        data.updatedAt = new Date(data.updatedAt);

        setCompetition(data);
      } catch (err) {
        console.error("Error fetching competition:", err);
        setError("Failed to load competition");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetition();
  }, [params]);

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-400 mb-4'>Error</h1>
          <p className='text-gray-300'>{error || "Competition not found"}</p>
          <Link
            href='/competitions'
            className='inline-flex items-center mt-4 text-algomancy-blue hover:text-algomancy-blue-light transition-colors'>
            ← Back to Competitions
          </Link>
        </div>
      </div>
    );
  }

  const isActive = competition.status === COMPETITION_STATUS.ACTIVE;
  const isVoting = competition.status === COMPETITION_STATUS.VOTING;
  const isCompleted = competition.status === COMPETITION_STATUS.COMPLETED;
  const isUpcoming = competition.status === COMPETITION_STATUS.UPCOMING;

  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      {/* Back Link */}
      <div className='mb-6'>
        <Link
          href='/competitions'
          className='inline-flex items-center text-algomancy-blue hover:text-algomancy-blue-light transition-colors'>
          <svg
            className='w-4 h-4 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 19l-7-7 7-7'
            />
          </svg>
          Back to Competitions
        </Link>
      </div>

      {/* Competition Header */}
      <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-8 mb-8'>
        <div className='flex items-start justify-between mb-6'>
          <div className='flex items-center'>
            <div>
              <h1 className='text-3xl md:text-4xl font-bold text-white mb-2'>
                {competition.title}
              </h1>
              <div className='flex items-center space-x-4'>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full border text-sm ${getStatusColor(
                    competition.status
                  )}`}>
                  {getStatusIcon(competition.status)}
                  <span className='ml-2'>
                    {competition.status.charAt(0).toUpperCase() +
                      competition.status.slice(1)}
                  </span>
                </span>
                <span className='text-gray-400 text-sm capitalize'>
                  {competition.type} Format
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className='text-gray-300 text-lg leading-relaxed mb-6'>
          {competition.description}
        </p>

        {/* Competition Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-4'>
            <div className='flex items-center mb-2'>
              <CalendarIcon className='w-5 h-5 text-algomancy-blue mr-2' />
              <span className='text-sm text-gray-400'>Duration</span>
            </div>
            <div className='text-white'>
              <div className='text-sm'>
                {competition.startDate.toLocaleDateString()} -{" "}
                {competition.endDate.toLocaleDateString()}
              </div>
              {isVoting && (
                <div className='text-xs text-blue-400 mt-1'>
                  Voting ends: {competition.votingEndDate.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-4'>
            <div className='flex items-center mb-2'>
              <UsersIcon className='w-5 h-5 text-algomancy-gold mr-2' />
              <span className='text-sm text-gray-400'>Submissions</span>
            </div>
            <div className='text-white text-lg font-semibold'>
              {competition.submissionCount}
            </div>
          </div>

          <div className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-4'>
            <div className='flex items-center mb-2'>
              <TrophyIcon className='w-5 h-5 text-red-500 mr-2' />
              <span className='text-sm text-gray-400'>Winners</span>
            </div>
            <div className='text-white text-lg font-semibold'>
              {isCompleted ? competition.winners.length : "TBD"}
            </div>
          </div>
        </div>
      </div>

      {/* How to Participate */}
      <div className='bg-algomancy-darker border border-algomancy-purple/20 rounded-lg p-8 mb-8'>
        <h2 className='text-2xl font-bold text-white mb-6'>
          How to Participate
        </h2>

        <div className='space-y-6'>
          <div className='flex items-start'>
            <div className='w-8 h-8 bg-algomancy-purple/20 rounded-full flex items-center justify-center mr-4 mt-1'>
              <span className='text-algomancy-purple font-bold'>1</span>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-white mb-2'>
                Build Your Deck
              </h3>
              <p className='text-gray-300'>
                {competition.type === "constructed"
                  ? "Create your ultimate deck using any cards from the Algomancy collection. Focus on synergies and strategic combinations."
                  : "Join a live draft session and build your deck from limited card pools. Adaptability is key!"}
              </p>
              <Link
                href='/decks/create'
                className='inline-flex items-center mt-2 text-algomancy-purple hover:text-algomancy-purple-light transition-colors'>
                Use Deck Builder →
              </Link>
            </div>
          </div>

          <div className='flex items-start'>
            <div className='w-8 h-8 bg-algomancy-blue/20 rounded-full flex items-center justify-center mr-4 mt-1'>
              <span className='text-algomancy-blue font-bold'>2</span>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-white mb-2'>
                Submit Your Deck
              </h3>
              <p className='text-gray-300'>
                Submit your deck directly on this website using the submission
                form above. Once submitted, you'll get a shareable link to your
                deck.
              </p>
            </div>
          </div>

          <div className='flex items-start'>
            <div className='w-8 h-8 bg-algomancy-gold/20 rounded-full flex items-center justify-center mr-4 mt-1'>
              <span className='text-algomancy-gold font-bold'>3</span>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-white mb-2'>
                Share & Get Votes
              </h3>
              <p className='text-gray-300'>
                Share your deck link in the Algomancy Discord community.
                Community members vote by reacting to your post with
                likes/emojis. The decks with the most reactions win!
              </p>
            </div>
          </div>
        </div>

        {(isActive || isUpcoming) && (
          <div className='mt-8 p-4 bg-algomancy-purple/10 border border-algomancy-purple/30 rounded-lg'>
            <div className='flex items-center'>
              <ExclamationTriangleIcon className='w-5 h-5 text-algomancy-purple mr-2' />
              <span className='text-algomancy-purple font-medium'>
                {isActive
                  ? "Competition is currently active!"
                  : "Submissions are open! Competition starts soon!"}
              </span>
            </div>
            <p className='text-gray-300 text-sm mt-1'>
              {isActive
                ? `Submissions close on ${competition.endDate.toLocaleDateString()}. Withdrawals no longer allowed.`
                : `Submissions are open now! Competition starts ${competition.startDate.toLocaleDateString()}. You can withdraw until then.`}
            </p>
          </div>
        )}
      </div>

      {/* Winners Section (for completed competitions) */}
      {isCompleted && competition.winners.length > 0 && (
        <div className='mb-8'>
          <WinnersPodium
            winners={competition.winners}
            competition={competition}
          />
        </div>
      )}

      {/* Deck Submission Section (for upcoming and active competitions) */}
      {(isUpcoming || isActive || isVoting) && (
        <div className='mb-8'>
          <CompetitionSubmission
            competition={competition}
            onSubmissionChange={refreshSubmissions}
          />
        </div>
      )}

      {/* Submissions View - Client Component */}
      {competitionId && (
        <ClientSubmissionsWrapper
          competitionId={competitionId}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
}
