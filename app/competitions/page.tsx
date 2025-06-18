"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrophyIcon,
  CalendarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import CompetitionCard from "@/app/components/CompetitionCard";
import { Competition } from "@/app/lib/types/user";
import { CompetitionListSkeleton } from "@/app/components/skeletons/CompetitionSkeleton";
import { updateCompetitionsStatusClient } from "@/app/lib/utils/clientCompetitionStatus";

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/competitions");
        if (!response.ok) {
          throw new Error("Failed to fetch competitions");
        }
        const apiResponse = await response.json();

        // Handle new API response format
        if (!apiResponse.success) {
          throw new Error(apiResponse.error || "Failed to fetch competitions");
        }

        const data = apiResponse.data;
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }

        // Convert date strings to Date objects
        const competitionsWithDates = data.map((competition: any) => ({
          ...competition,
          startDate: new Date(competition.startDate),
          endDate: new Date(competition.endDate),
          votingEndDate: new Date(competition.votingEndDate),
          createdAt: new Date(competition.createdAt),
          updatedAt: new Date(competition.updatedAt),
        }));

        // Update statuses on client side for real-time accuracy
        // (since cron job only runs once per day on Vercel Hobby plan)
        const competitionsWithUpdatedStatus = updateCompetitionsStatusClient(
          competitionsWithDates
        );

        setCompetitions(competitionsWithUpdatedStatus);
      } catch (err) {
        console.error("Error fetching competitions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load competitions"
        );
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchCompetitions();
  }, []);

  // Memoize filtered competitions for better performance
  const { activeCompetitions, completedCompetitions, upcomingCompetitions } =
    useMemo(() => {
      return {
        activeCompetitions: competitions.filter(
          (c) => c.status === "active" || c.status === "voting"
        ),
        completedCompetitions: competitions.filter(
          (c) => c.status === "completed"
        ),
        upcomingCompetitions: competitions.filter(
          (c) => c.status === "upcoming"
        ),
      };
    }, [competitions]);

  if (initialLoad && loading) {
    return (
      <div className='container mx-auto px-4 pt-16 pb-8 max-w-6xl'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-white mb-4'>
            Deck Building Competitions
          </h1>
          <p className='text-xl text-gray-300 max-w-3xl mx-auto'>
            Join exciting deck building competitions and showcase your strategic
            skills
          </p>
        </div>

        {/* Skeleton Loading */}
        <div className='space-y-12'>
          <div>
            <h2 className='text-2xl font-bold text-white mb-6'>
              Active Competitions
            </h2>
            <CompetitionListSkeleton />
          </div>
          <div>
            <h2 className='text-2xl font-bold text-white mb-6'>
              Upcoming Competitions
            </h2>
            <CompetitionListSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 pt-16 pb-8 max-w-6xl'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-400 mb-4'>Error</h1>
          <p className='text-gray-300'>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 pt-16 pb-8 max-w-6xl'>
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

      {/* How it Works */}
      <section className='mb-12 bg-algomancy-darker border border-algomancy-purple/20 rounded-lg p-8'>
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

      {/* Competition Types Info */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-12'>
        <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6'>
          <div className='mb-4'>
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
          <div className='mb-4'>
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
      {activeCompetitions.length > 0 ? (
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
      ) : competitions.length === 0 ? (
        <section className='mb-12'>
          <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-8 text-center'>
            <TrophyIcon className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-white mb-2'>
              No Competitions Yet
            </h3>
            <p className='text-gray-300 mb-4'>
              Competitions will appear here when they are created. Check back
              soon for exciting deck building challenges!
            </p>
            <div className='text-sm text-gray-400'>
              Want to organize a competition? Contact the community
              administrators.
            </div>
          </div>
        </section>
      ) : null}

      {/* Upcoming Competitions */}
      {upcomingCompetitions.length > 0 && (
        <section className='mb-12'>
          <h2 className='text-2xl font-bold mb-6 text-white flex items-center'>
            <CalendarIcon className='w-6 h-6 mr-2 text-yellow-400' />
            Upcoming Competitions
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {upcomingCompetitions.map((competition) => (
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
    </div>
  );
}
