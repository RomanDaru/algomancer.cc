import { Metadata } from "next";
import Link from "next/link";
import {
  TrophyIcon,
  CalendarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import CompetitionCard from "@/app/components/CompetitionCard";

export const metadata: Metadata = {
  title: "Deck Building Competitions - Algomancer.cc",
  description:
    "Join exciting Algomancy deck building competitions! Compete in Constructed and Draft formats, showcase your skills, and win recognition in the community.",
  keywords: [
    "algomancy competitions",
    "deck building contest",
    "algomancy tournament",
    "constructed format",
    "draft format",
    "deck building challenge",
    "algomancy community",
    "competitive deck building",
  ],
  openGraph: {
    title: "Deck Building Competitions - Algomancer.cc",
    description:
      "Join exciting Algomancy deck building competitions! Compete in Constructed and Draft formats.",
    url: "https://algomancer.cc/competitions",
  },
};

// Mock data for now - will be replaced with API calls
const mockCompetitions = [
  {
    _id: "1",
    title: "Winter Constructed Championship",
    description:
      "Show off your best constructed deck in this seasonal championship! Build your most powerful deck and compete for the title.",
    type: "constructed" as const,
    status: "active" as const,
    startDate: new Date("2024-12-01"),
    endDate: new Date("2024-12-15"),
    votingEndDate: new Date("2024-12-20"),
    submissionCount: 23,
    winners: [],
  },
  {
    _id: "2",
    title: "Draft Masters Tournament",
    description:
      "Test your drafting skills in this live draft competition! Create the best deck from limited card pools.",
    type: "draft" as const,
    status: "voting" as const,
    startDate: new Date("2024-11-15"),
    endDate: new Date("2024-11-30"),
    votingEndDate: new Date("2024-12-05"),
    submissionCount: 18,
    winners: [],
  },
  {
    _id: "3",
    title: "Autumn Constructed Classic",
    description:
      "Our previous constructed tournament featuring amazing deck innovations and creative strategies.",
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
  },
];

export default function CompetitionsPage() {
  const activeCompetitions = mockCompetitions.filter(
    (c) => c.status === "active" || c.status === "voting"
  );
  const completedCompetitions = mockCompetitions.filter(
    (c) => c.status === "completed"
  );
  const upcomingCompetitions = mockCompetitions.filter(
    (c) => c.status === "upcoming"
  );

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      {/* Header */}
      <div className='text-center mb-12'>
        <h1 className='text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-algomancy-gold via-algomancy-purple to-algomancy-blue bg-clip-text text-transparent'>
          Deck Building Competitions
        </h1>
        <p className='text-lg text-gray-300 max-w-3xl mx-auto'>
          Showcase your deck building skills in exciting competitions! Create
          powerful decks, submit them on Discord, and let the community vote for
          the best builds.
        </p>
      </div>

      {/* Competition Types Info */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-12'>
        <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>🏗️</span>
            <h3 className='text-xl font-semibold text-algomancy-gold'>
              Constructed Decks
            </h3>
          </div>
          <p className='text-gray-300'>
            Build your ultimate deck using any cards from your collection. Show
            off your strategic thinking and deck building mastery with unlimited
            card access.
          </p>
        </div>

        <div className='bg-algomancy-darker border border-algomancy-blue/30 rounded-lg p-6'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>🎲</span>
            <h3 className='text-xl font-semibold text-algomancy-blue'>
              Live Draft Decks
            </h3>
          </div>
          <p className='text-gray-300'>
            Test your adaptability and quick thinking! Build decks from limited
            card pools in real-time draft sessions. Pure skill, no collection
            advantage.
          </p>
        </div>
      </div>

      {/* Active/Voting Competitions */}
      {activeCompetitions.length > 0 && (
        <section className='mb-12'>
          <h2 className='text-2xl font-bold mb-6 text-white flex items-center'>
            <TrophyIcon className='w-6 h-6 mr-2 text-algomancy-gold' />
            Active Competitions
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {activeCompetitions.map((competition) => (
              <CompetitionCard
                key={competition._id}
                competition={competition}
                variant='active'
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Competitions */}
      {completedCompetitions.length > 0 && (
        <section>
          <h2 className='text-2xl font-bold mb-6 text-white flex items-center'>
            <TrophyIcon className='w-6 h-6 mr-2 text-gray-400' />
            Past Champions
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
            {completedCompetitions.map((competition) => (
              <CompetitionCard
                key={competition._id}
                competition={competition}
                variant='completed'
              />
            ))}
          </div>
        </section>
      )}

      {/* How it Works */}
      <section className='mt-16 bg-algomancy-darker border border-algomancy-purple/20 rounded-lg p-8'>
        <h2 className='text-2xl font-bold mb-6 text-white text-center'>
          How Competitions Work
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='w-12 h-12 bg-algomancy-purple/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <span className='text-xl'>🛠️</span>
            </div>
            <h3 className='font-semibold text-white mb-2'>
              1. Build Your Deck
            </h3>
            <p className='text-gray-300 text-sm'>
              Create your deck using our deck builder tool
            </p>
          </div>

          <div className='text-center'>
            <div className='w-12 h-12 bg-algomancy-blue/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <span className='text-xl'>📤</span>
            </div>
            <h3 className='font-semibold text-white mb-2'>
              2. Submit Your Deck
            </h3>
            <p className='text-gray-300 text-sm'>
              Submit directly on the competition page to get a shareable link
            </p>
          </div>

          <div className='text-center'>
            <div className='w-12 h-12 bg-algomancy-gold/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <span className='text-xl'>🗳️</span>
            </div>
            <h3 className='font-semibold text-white mb-2'>
              3. Share & Get Votes
            </h3>
            <p className='text-gray-300 text-sm'>
              Share your deck in Discord and get community reactions/votes
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
