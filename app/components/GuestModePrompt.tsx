"use client";

import { useState } from 'react';
import Link from 'next/link';
import { UserPlusIcon, BookmarkIcon, ShareIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface GuestModePromptProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
  variant?: 'banner' | 'modal' | 'inline';
  deckName?: string;
}

export default function GuestModePrompt({ 
  onDismiss, 
  showDismiss = true, 
  variant = 'banner',
  deckName 
}: GuestModePromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  const benefits = [
    {
      icon: BookmarkIcon,
      title: 'Save Your Decks',
      description: 'Keep your deck builds permanently and access them anywhere'
    },
    {
      icon: ShareIcon,
      title: 'Share with Community',
      description: 'Publish your decks and discover builds from other players'
    },
    {
      icon: ChartBarIcon,
      title: 'Track Statistics',
      description: 'View detailed analytics and deck performance metrics'
    }
  ];

  const baseClasses = "bg-gradient-to-r from-algomancy-purple/20 to-algomancy-blue/20 border border-algomancy-purple/30 rounded-lg";
  
  const variantClasses = {
    banner: "p-4 mb-6",
    modal: "p-6 max-w-md mx-auto",
    inline: "p-4"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <UserPlusIcon className="h-8 w-8 text-algomancy-gold" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {deckName ? `Save "${deckName}"` : 'Save Your Deck'}
            </h3>
            <p className="text-gray-300 text-sm">
              You're building as a guest. Sign in to unlock all features!
            </p>
          </div>
        </div>
        
        {showDismiss && (
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {variant !== 'banner' && (
        <div className="grid grid-cols-1 gap-3 mb-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-3">
              <benefit.icon className="h-5 w-5 text-algomancy-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium text-sm">{benefit.title}</h4>
                <p className="text-gray-400 text-xs">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/auth/signin"
          className="flex-1 bg-algomancy-purple hover:bg-algomancy-purple-dark text-white text-center py-2 px-4 rounded-md transition-colors font-medium"
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="flex-1 bg-algomancy-gold hover:bg-algomancy-gold-dark text-black text-center py-2 px-4 rounded-md transition-colors font-medium"
        >
          Create Account
        </Link>
      </div>

      {variant === 'banner' && (
        <div className="mt-3 text-xs text-gray-400">
          <span>Benefits: Save decks permanently • Share with community • Track statistics</span>
        </div>
      )}
    </div>
  );
}
