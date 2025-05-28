"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import CompetitionSubmissions from "@/app/components/CompetitionSubmissions";

interface Competition {
  _id: string;
  title: string;
  description: string;
  type: "constructed" | "draft";
  status: "upcoming" | "active" | "voting" | "completed";
  submissionCount: number;
}

export default function AdminCompetitionSubmissionsPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      if (!session?.user?.isAdmin) {
        router.push("/");
        return;
      }
      fetchCompetition();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router, session]);

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

  const fetchCompetition = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/competitions/${params.id}`);

      if (response.ok) {
        const data = await response.json();
        setCompetition(data);
      } else {
        toast.error("Competition not found");
        router.push("/admin/competitions");
      }
    } catch (error) {
      console.error("Error fetching competition:", error);
      toast.error("Failed to load competition");
      router.push("/admin/competitions");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto text-center'>
          <h1 className='text-2xl font-bold text-white mb-4'>
            Competition Not Found
          </h1>
          <Link
            href='/admin/competitions'
            className='text-algomancy-blue hover:text-algomancy-blue-light'>
            Back to Competitions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <Link
            href='/admin/competitions'
            className='inline-flex items-center text-algomancy-blue hover:text-algomancy-blue-light transition-colors mb-4'>
            <ArrowLeftIcon className='w-4 h-4 mr-2' />
            Back to Competition Management
          </Link>
          <h1 className='text-3xl font-bold text-white mb-2'>
            Competition Submissions
          </h1>
          <div className='flex items-center space-x-4'>
            <h2 className='text-xl text-gray-300'>{competition.title}</h2>
            <span className='px-2 py-1 text-xs rounded-full bg-algomancy-purple/20 text-algomancy-purple border border-algomancy-purple/30'>
              {competition.type.charAt(0).toUpperCase() +
                competition.type.slice(1)}
            </span>
            <span className='px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300'>
              {competition.status.charAt(0).toUpperCase() +
                competition.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Competition Info */}
        <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6 mb-8'>
          <p className='text-gray-300 mb-4'>{competition.description}</p>
          <div className='flex items-center space-x-6 text-sm text-gray-400'>
            <div>
              <span className='font-medium'>Total Submissions:</span>{" "}
              {competition.submissionCount}
            </div>
            <div>
              <span className='font-medium'>Status:</span> {competition.status}
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <CompetitionSubmissions
          competitionId={competition._id}
          isAdmin={true}
        />

        {/* Admin Actions */}
        <div className='mt-8 bg-algomancy-darker border border-algomancy-gold/30 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-algomancy-gold mb-4'>
            Admin Actions
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Link
              href={`/admin/competitions/${competition._id}/edit`}
              className='inline-flex items-center justify-center px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark rounded-md text-white font-medium transition-colors'>
              Edit Competition
            </Link>
            <Link
              href={`/competitions/${competition._id}`}
              className='inline-flex items-center justify-center px-4 py-2 bg-algomancy-dark border border-algomancy-purple/30 hover:bg-algomancy-purple/20 rounded-md text-white font-medium transition-colors'>
              View Public Page
            </Link>
            <button
              onClick={() => {
                // The CompetitionSubmissions component now handles winner selection
                toast.info(
                  "Use the 'Select Winners' button in the submissions list below"
                );
              }}
              className='inline-flex items-center justify-center px-4 py-2 bg-algomancy-gold hover:bg-algomancy-gold-dark rounded-md text-black font-medium transition-colors'>
              Select Winners
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
