"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloudArrowUpIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface GuestDeckMigrationBannerProps {
  deckName: string;
  totalCards: number;
  onMigrate: () => Promise<{ success: boolean; deckId?: string; error?: string } | null>;
  onDiscard: () => void;
  onDismiss?: () => void;
}

export default function GuestDeckMigrationBanner({
  deckName,
  totalCards,
  onMigrate,
  onDiscard,
  onDismiss,
}: GuestDeckMigrationBannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();

  if (isDismissed) {
    return null;
  }

  const handleMigrate = async () => {
    setIsLoading(true);
    try {
      const result = await onMigrate();
      if (result?.success && result.deckId) {
        // Redirect to the newly created deck
        router.push(`/decks/${result.deckId}`);
      }
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (confirm(`Are you sure you want to discard "${deckName}"? This action cannot be undone.`)) {
      onDiscard();
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-gradient-to-r from-algomancy-gold/20 to-algomancy-purple/20 border border-algomancy-gold/30 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <CloudArrowUpIcon className="h-8 w-8 text-algomancy-gold" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              Save Your Guest Deck
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              You have a deck "{deckName}" with {totalCards} cards from your guest session. 
              Would you like to save it to your account?
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleMigrate}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 bg-algomancy-gold hover:bg-algomancy-gold-dark text-black px-4 py-2 rounded-md transition-colors font-medium disabled:opacity-50"
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                <span>{isLoading ? 'Saving...' : 'Save to Account'}</span>
              </button>
              
              <button
                onClick={handleDiscard}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors font-medium disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Discard</span>
              </button>
              
              <button
                onClick={handleDismiss}
                disabled={isLoading}
                className="text-gray-400 hover:text-white transition-colors px-4 py-2 disabled:opacity-50"
              >
                Remind me later
              </button>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          disabled={isLoading}
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Dismiss"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
