"use client";

import { Metadata } from "next";
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

// Mock data for now - will be replaced with API calls
const mockCompetitions = [
  {
    _id: "1",
    title: "Winter Constructed Championship",
    description:
      "Show off your best constructed deck in this seasonal championship! Build your most powerful deck and compete for the title. This competition focuses on strategic deck building and innovative card combinations.",
    type: "constructed" as const,
    status: "active" as const,
    startDate: new Date("2024-12-01"),
    endDate: new Date("2024-12-15"),
    votingEndDate: new Date("2024-12-20"),
    submissionCount: 23,
    winners: [],
    discordChannelId: "winter-constructed-2024",
  },
  {
    _id: "2",
    title: "Draft Masters Tournament",
    description:
      "Test your drafting skills in this live draft competition! Create the best deck from limited card pools and show your adaptability.",
    type: "draft" as const,
    status: "voting" as const,
    startDate: new Date("2024-11-15"),
    endDate: new Date("2024-11-30"),
    votingEndDate: new Date("2024-12-05"),
    submissionCount: 18,
    winners: [],
    discordChannelId: "draft-masters-2024",
  },
  {
    _id: "3",
    title: "Autumn Constructed Classic",
    description:
      "Our previous constructed tournament featuring amazing deck innovations and creative strategies from the community.",
    type: "constructed" as const,
    status: "completed" as const,
    startDate: new Date("2024-10-01"),
    endDate: new Date("2024-10-15"),
    votingEndDate: new Date("2024-10-20"),
    submissionCount: 31,
    winners: [
      {
        place: 1 as const,
        deckId: "deck1" as any,
        userId: "user1" as any,
        votes: 45,
      },
      {
        place: 2 as const,
        deckId: "deck2" as any,
        userId: "user2" as any,
        votes: 38,
      },
      {
        place: 3 as const,
        deckId: "deck3" as any,
        userId: "user3" as any,
        votes: 32,
      },
    ],
    discordChannelId: "autumn-constructed-2024",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case "voting":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "completed":
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    case "upcoming":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "active":
      return <ClockIcon className='w-5 h-5' />;
    case "voting":
      return <ExclamationTriangleIcon className='w-5 h-5' />;
    case "completed":
      return <CheckCircleIcon className='w-5 h-5' />;
    case "upcoming":
      return <CalendarIcon className='w-5 h-5' />;
    default:
      return <CalendarIcon className='w-5 h-5' />;
  }
}

function getTypeIcon(type: string) {
  if (type === "constructed") {
    return "🏗️";
  }
  return "🎲";
}

// Client component wrapper for submissions
function ClientSubmissionsWrapper({
  competitionId,
}: {
  competitionId: string;
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;

  return (
    <div className='mb-8'>
      <CompetitionSubmissions competitionId={competitionId} isAdmin={isAdmin} />
    </div>
  );
}

export default function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [competitionId, setCompetitionId] = useState<string>("");
  const [competition, setCompetition] = useState<any>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setCompetitionId(resolvedParams.id);
      const foundCompetition = mockCompetitions.find(
        (c) => c._id === resolvedParams.id
      );
      setCompetition(foundCompetition);
    };
    resolveParams();
  }, [params]);

  if (!competition) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  const isActive = competition.status === "active";
  const isVoting = competition.status === "voting";
  const isCompleted = competition.status === "completed";
  const isUpcoming = competition.status === "upcoming";

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
            <span className='text-3xl mr-4'>
              {getTypeIcon(competition.type)}
            </span>
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

      {/* Winners Section (for completed competitions) */}
      {isCompleted && competition.winners.length > 0 && (
        <div className='mb-8'>
          <WinnersPodium winners={competition.winners} />
        </div>
      )}

      {/* Deck Submission Section (for active competitions) */}
      {(isActive || isVoting) && (
        <div className='mb-8'>
          <CompetitionSubmission competition={competition} />
        </div>
      )}

      {/* Submissions View - Client Component */}
      {competitionId && (
        <ClientSubmissionsWrapper competitionId={competitionId} />
      )}

      {/* How to Participate */}
      <div className='bg-algomancy-darker border border-algomancy-purple/20 rounded-lg p-8'>
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
                  : "Competition starts soon!"}
              </span>
            </div>
            <p className='text-gray-300 text-sm mt-1'>
              {isActive
                ? `Submissions close on ${competition.endDate.toLocaleDateString()}`
                : `Submissions open on ${competition.startDate.toLocaleDateString()}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
