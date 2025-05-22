"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GuestDeckMigration } from '@/app/lib/utils/guestDeckMigration';
import { toast } from 'react-hot-toast';

export default function GuestDeckMigrationHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only run when user becomes authenticated
    if (status === 'authenticated' && session) {
      // Check if there's a pending migration flag (from Google sign-in)
      const hasPendingMigration = localStorage.getItem('algomancer_pending_migration') === 'true';
      
      // Check if there's a guest deck to migrate
      const hasGuestDeck = GuestDeckMigration.hasGuestDeckToMigrate();

      if (hasPendingMigration || hasGuestDeck) {
        // Clear the pending migration flag
        localStorage.removeItem('algomancer_pending_migration');

        // Perform migration if there's actually a guest deck
        if (hasGuestDeck) {
          handleMigration();
        }
      }
    }
  }, [status, session]);

  const handleMigration = async () => {
    try {
      const guestDeckInfo = GuestDeckMigration.getGuestDeckInfo();
      if (!guestDeckInfo) {
        return;
      }

      const result = await GuestDeckMigration.migrateGuestDeck();
      
      if (result.success && result.deckId) {
        toast.success(`Successfully saved "${guestDeckInfo.deckName}" to your account!`);
        // Redirect to the saved deck
        router.push(`/decks/${result.deckId}`);
      } else {
        toast.error(result.error || 'Failed to save your guest deck');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Failed to save your guest deck');
    }
  };

  // This component doesn't render anything
  return null;
}
