"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { COMPETITION_TYPE, COMPETITION_STATUS } from "@/app/lib/constants";
import CompetitionForm from "@/app/components/CompetitionForm";
import { CompetitionErrorBoundary } from "@/app/components/ErrorBoundary";

export default function CreateCompetitionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Competition created successfully!");
        router.push("/admin/competitions");
      } else {
        // Handle validation errors with field-specific feedback
        if (data.details?.errors) {
          data.details.errors.forEach((error: string) => {
            toast.error(error);
          });
        } else {
          toast.error(data.error || "Failed to create competition");
        }
        throw new Error(data.error || "Failed to create competition");
      }
    } catch (error) {
      console.error("Error creating competition:", error);
      // Error is already handled above, just re-throw for form handling
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/competitions");
  };

  return (
    <CompetitionErrorBoundary>
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

          {/* Enhanced Form with Validation */}
          <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-8'>
            <CompetitionForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitLabel='Create Competition'
            />
          </div>
        </div>
      </div>
    </CompetitionErrorBoundary>
  );
}
