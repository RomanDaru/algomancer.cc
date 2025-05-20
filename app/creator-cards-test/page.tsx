'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card as CardType } from '@/app/lib/types/card';

export default function CreatorCardsTest() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCards() {
      try {
        // Load the converted cards from the JSON file
        const response = await fetch('/cards/ConvertedCards.json');
        if (!response.ok) {
          throw new Error(`Failed to load cards: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Take just the first 20 cards for this test
        setCards(data.slice(0, 20));
        setLoading(false);
      } catch (err) {
        console.error('Error loading cards:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    loadCards();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-algomancy-gold">Creator Cards Test</h1>
        <p className="text-white">Loading cards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-algomancy-gold">Creator Cards Test</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-algomancy-gold">Creator Cards Test</h1>
        <Link href="/" className="bg-algomancy-purple hover:bg-algomancy-purple-dark text-white px-4 py-2 rounded">
          Back to Home
        </Link>
      </div>
      
      <p className="text-white mb-8">
        This page displays cards from the converted creator&apos;s JSON file to test if the Cloudinary URLs work correctly.
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.id} className="flex flex-col items-center">
            <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden shadow-md mb-2">
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              />
            </div>
            <h3 className="text-sm text-center text-white">{card.name}</h3>
            <p className="text-xs text-center text-gray-400">{card.element.type}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-algomancy-darker rounded-lg">
        <h2 className="text-xl font-bold text-algomancy-gold mb-4">Card Details</h2>
        <pre className="text-xs text-white overflow-auto max-h-96">
          {JSON.stringify(cards[0], null, 2)}
        </pre>
      </div>
    </div>
  );
}
