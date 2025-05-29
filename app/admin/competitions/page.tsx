"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TrophyIcon,
  CalendarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Competition } from "@/app/lib/types/user";

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

export default function AdminCompetitionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompetitions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/competitions");
      if (response.ok) {
        const data = await response.json();
        setCompetitions(data);
      } else {
        toast.error("Failed to load competitions");
      }
    } catch (error) {
      console.error("Error fetching competitions:", error);
      toast.error("Failed to load competitions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCompetitions();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Check if user is admin (only roman.daru.ml@gmail.com)
  if (status === "authenticated" && !session?.user?.isAdmin) {
    router.push("/");
    return null;
  }

  // Handle loading state
  if (status === "loading") {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (status === "unauthenticated") {
    return null; // Will redirect in useEffect
  }

  const handleDeleteCompetition = async (competitionId: string) => {
    if (!confirm("Are you sure you want to delete this competition?")) {
      return;
    }

    try {
      const response = await fetch(`/api/competitions/${competitionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Competition deleted successfully");
        fetchCompetitions(); // Refresh the list
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete competition");
      }
    } catch (error) {
      console.error("Error deleting competition:", error);
      toast.error("Failed to delete competition");
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-white mb-2'>
              Competition Management
            </h1>
            <p className='text-gray-300'>
              Create and manage deck building competitions
            </p>
          </div>
          <Link
            href='/admin/competitions/create'
            className='inline-flex items-center px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark rounded-md text-white font-medium transition-colors'>
            <PlusIcon className='w-5 h-5 mr-2' />
            Create Competition
          </Link>
        </div>

        {/* Competitions List */}
        {isLoading ? (
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6 animate-pulse'>
                <div className='h-6 bg-gray-700 rounded w-1/3 mb-4'></div>
                <div className='h-4 bg-gray-700 rounded w-2/3 mb-4'></div>
                <div className='flex space-x-4'>
                  <div className='h-8 bg-gray-700 rounded w-20'></div>
                  <div className='h-8 bg-gray-700 rounded w-20'></div>
                </div>
              </div>
            ))}
          </div>
        ) : competitions.length === 0 ? (
          <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-8 text-center'>
            <TrophyIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-white mb-2'>
              No Competitions Yet
            </h3>
            <p className='text-gray-300 mb-4'>
              Create your first competition to get started.
            </p>
            <Link
              href='/admin/competitions/create'
              className='inline-flex items-center px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark rounded-md text-white font-medium transition-colors'>
              <PlusIcon className='w-5 h-5 mr-2' />
              Create Competition
            </Link>
          </div>
        ) : (
          <div className='space-y-4'>
            {competitions.map((competition) => (
              <div
                key={competition._id}
                className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <div className='flex items-center mb-2'>
                      <h3 className='text-xl font-semibold text-white mr-3'>
                        {competition.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(
                          competition.status
                        )}`}>
                        {competition.status.charAt(0).toUpperCase() +
                          competition.status.slice(1)}
                      </span>
                      <span className='ml-2 px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300'>
                        {competition.type.charAt(0).toUpperCase() +
                          competition.type.slice(1)}
                      </span>
                    </div>
                    <p className='text-gray-300 mb-4'>
                      {competition.description}
                    </p>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                      <div className='flex items-center text-gray-400'>
                        <CalendarIcon className='w-4 h-4 mr-2' />
                        {new Date(
                          competition.startDate
                        ).toLocaleDateString()} -{" "}
                        {new Date(competition.endDate).toLocaleDateString()}
                      </div>
                      <div className='flex items-center text-gray-400'>
                        <UsersIcon className='w-4 h-4 mr-2' />
                        {competition.submissionCount} submissions
                      </div>
                      <div className='flex items-center text-gray-400'>
                        <TrophyIcon className='w-4 h-4 mr-2' />
                        {competition.winners.length} winners
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2 ml-4'>
                    <Link
                      href={`/admin/competitions/${competition._id}/submissions`}
                      className='px-3 py-1 text-sm bg-algomancy-gold hover:bg-algomancy-gold-dark rounded-md text-black font-medium transition-colors'>
                      Submissions ({competition.submissionCount})
                    </Link>
                    <Link
                      href={`/admin/competitions/${competition._id}/edit`}
                      className='p-2 text-gray-400 hover:text-algomancy-blue hover:bg-algomancy-blue/10 rounded-md transition-colors'>
                      <PencilIcon className='w-5 h-5' />
                    </Link>
                    <Link
                      href={`/competitions/${competition._id}`}
                      className='px-3 py-1 text-sm bg-algomancy-dark border border-algomancy-purple/30 hover:bg-algomancy-purple/20 rounded-md text-white transition-colors'>
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteCompetition(competition._id)}
                      className='p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors'>
                      <TrashIcon className='w-5 h-5' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
