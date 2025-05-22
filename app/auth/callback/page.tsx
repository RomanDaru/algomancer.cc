"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GuestDeckMigration } from "@/app/lib/utils/guestDeckMigration";
import { toast, Toaster } from "react-hot-toast";

export default function AuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      if (status === "loading") {
        return; // Still loading session
      }

      if (status === "unauthenticated") {
        // Not authenticated, redirect to sign in
        router.push("/auth/signin");
        return;
      }

      if (status === "authenticated" && session) {
        // Check if there's a pending migration flag or guest deck
        const hasPendingMigration =
          localStorage.getItem("algomancer_pending_migration") === "true";
        const hasGuestDeck = GuestDeckMigration.hasGuestDeckToMigrate();

        if (hasPendingMigration || hasGuestDeck) {
          // Clear the pending migration flag
          localStorage.removeItem("algomancer_pending_migration");

          if (hasGuestDeck) {
            try {
              const guestDeckInfo = GuestDeckMigration.getGuestDeckInfo();
              const result = await GuestDeckMigration.migrateGuestDeck();

              if (result.success && result.deckId) {
                toast.success(
                  `Successfully saved "${guestDeckInfo?.deckName}" to your account!`
                );
                router.push(`/decks/${result.deckId}`);
                return;
              } else {
                toast.error(result.error || "Failed to save your guest deck");
              }
            } catch (error) {
              console.error("Migration failed:", error);
              toast.error("Failed to save your guest deck");
            }
          }
        }

        // No migration needed or migration failed, go to homepage
        router.push("/");
      }
    };

    handleCallback();
  }, [status, session, router]);

  if (status === "loading" || isProcessing) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <Toaster position='top-right' />
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple mx-auto mb-4'></div>
          <p className='text-white text-lg'>Processing your sign-in...</p>
          <p className='text-gray-400 text-sm mt-2'>
            Checking for saved deck...
          </p>
        </div>
      </div>
    );
  }

  return <Toaster position='top-right' />;
}
