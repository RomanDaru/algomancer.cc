"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface Competition {
  _id: string;
  title: string;
  description: string;
  type: "constructed" | "draft";
  status: "upcoming" | "active" | "voting" | "completed";
  startDate: string;
  endDate: string;
  votingEndDate: string;
  discordChannelId?: string;
  submissionCount: number;
  winners: Array<{
    place: 1 | 2 | 3;
    deckId: string;
    userId: string;
    votes?: number;
  }>;
}

export default function EditCompetitionPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "constructed" as "constructed" | "draft",
    status: "upcoming" as "upcoming" | "active" | "voting" | "completed",
    startDate: "",
    endDate: "",
    votingEndDate: "",
    discordChannelId: "",
  });

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
      const resolvedParams = await params;
      const response = await fetch(`/api/competitions/${resolvedParams.id}`);

      if (response.ok) {
        const data = await response.json();
        setCompetition(data);

        // Populate form data
        setFormData({
          title: data.title,
          description: data.description,
          type: data.type,
          status: data.status,
          startDate: new Date(data.startDate).toISOString().split("T")[0],
          endDate: new Date(data.endDate).toISOString().split("T")[0],
          votingEndDate: new Date(data.votingEndDate)
            .toISOString()
            .split("T")[0],
          discordChannelId: data.discordChannelId || "",
        });
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!competition) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/competitions/${competition._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Competition updated successfully!");
        router.push("/admin/competitions");
      } else {
        toast.error(data.error || "Failed to update competition");
      }
    } catch (error) {
      console.error("Error updating competition:", error);
      toast.error("Failed to update competition");
    } finally {
      setIsSubmitting(false);
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
      <div className='max-w-2xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <Link
            href='/admin/competitions'
            className='inline-flex items-center text-algomancy-blue hover:text-algomancy-blue-light transition-colors mb-4'>
            <ArrowLeftIcon className='w-4 h-4 mr-2' />
            Back to Competitions
          </Link>
          <h1 className='text-3xl font-bold text-white mb-2'>
            Edit Competition
          </h1>
          <p className='text-gray-300'>
            Update competition details and settings
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-8'>
          <div className='space-y-6'>
            {/* Title */}
            <div>
              <label
                htmlFor='title'
                className='block text-sm font-medium text-white mb-2'>
                Competition Title *
              </label>
              <input
                type='text'
                id='title'
                name='title'
                value={formData.title}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor='description'
                className='block text-sm font-medium text-white mb-2'>
                Description *
              </label>
              <textarea
                id='description'
                name='description'
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className='w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'
              />
            </div>

            {/* Type and Status */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='type'
                  className='block text-sm font-medium text-white mb-2'>
                  Competition Type *
                </label>
                <select
                  id='type'
                  name='type'
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'>
                  <option value='constructed'>Constructed</option>
                  <option value='draft'>Draft</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor='status'
                  className='block text-sm font-medium text-white mb-2'>
                  Status *
                </label>
                <select
                  id='status'
                  name='status'
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'>
                  <option value='upcoming'>Upcoming</option>
                  <option value='active'>Active</option>
                  <option value='voting'>Voting</option>
                  <option value='completed'>Completed</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label
                  htmlFor='startDate'
                  className='block text-sm font-medium text-white mb-2'>
                  Start Date *
                </label>
                <input
                  type='date'
                  id='startDate'
                  name='startDate'
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'
                />
              </div>

              <div>
                <label
                  htmlFor='endDate'
                  className='block text-sm font-medium text-white mb-2'>
                  End Date *
                </label>
                <input
                  type='date'
                  id='endDate'
                  name='endDate'
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'
                />
              </div>

              <div>
                <label
                  htmlFor='votingEndDate'
                  className='block text-sm font-medium text-white mb-2'>
                  Voting End Date *
                </label>
                <input
                  type='date'
                  id='votingEndDate'
                  name='votingEndDate'
                  value={formData.votingEndDate}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'
                />
              </div>
            </div>

            {/* Discord Channel */}
            <div>
              <label
                htmlFor='discordChannelId'
                className='block text-sm font-medium text-white mb-2'>
                Discord Channel ID
              </label>
              <input
                type='text'
                id='discordChannelId'
                name='discordChannelId'
                value={formData.discordChannelId}
                onChange={handleInputChange}
                className='w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'
                placeholder='e.g., winter-constructed-2024'
              />
            </div>

            {/* Competition Stats */}
            <div className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-white mb-3'>
                Competition Stats
              </h3>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-400'>Submissions:</span>
                  <span className='text-white ml-2'>
                    {competition.submissionCount}
                  </span>
                </div>
                <div>
                  <span className='text-gray-400'>Winners:</span>
                  <span className='text-white ml-2'>
                    {competition.winners.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className='flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-algomancy-purple/20'>
            <Link
              href='/admin/competitions'
              className='px-4 py-2 text-gray-300 hover:text-white transition-colors'>
              Cancel
            </Link>
            <button
              type='submit'
              disabled={isSubmitting}
              className='px-6 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-white font-medium transition-colors'>
              {isSubmitting ? "Updating..." : "Update Competition"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
