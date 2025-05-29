"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { COMPETITION_TYPE, COMPETITION_STATUS } from "@/app/lib/constants";

export default function CreateCompetitionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: COMPETITION_TYPE.CONSTRUCTED,
    startDate: "",
    endDate: "",
    votingEndDate: "",
    discordChannelId: "",
  });

  // Handle authentication redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/");
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

    // Validate dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const votingEnd = new Date(formData.votingEndDate);

    if (start >= end) {
      toast.error("End date must be after start date");
      return;
    }

    if (end >= votingEnd) {
      toast.error("Voting end date must be after competition end date");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Competition created successfully!");
        router.push("/admin/competitions");
      } else {
        toast.error(data.error || "Failed to create competition");
      }
    } catch (error) {
      console.error("Error creating competition:", error);
      toast.error("Failed to create competition");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Create New Competition
          </h1>
          <p className='text-gray-300'>
            Set up a new deck building competition for the community
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
                placeholder='e.g., Winter Constructed Championship'
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
                placeholder='Describe the competition, rules, and what makes it special...'
              />
            </div>

            {/* Type */}
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
                <option value={COMPETITION_TYPE.CONSTRUCTED}>
                  Constructed
                </option>
                <option value={COMPETITION_TYPE.DRAFT}>Draft</option>
              </select>
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
              <p className='text-sm text-gray-400 mt-1'>
                Optional: Discord channel name for submissions and voting
              </p>
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
              {isSubmitting ? "Creating..." : "Create Competition"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
