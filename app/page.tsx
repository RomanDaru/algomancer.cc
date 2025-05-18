import Image from "next/image";
import Link from "next/link";
import { cardService } from "@/app/lib/services/cardService";
import Card from "@/app/components/Card";

// Mark the component as async
export default async function Home() {
  // Get a few featured cards to display
  const allCards = await cardService.getAllCards();
  const featuredCards = allCards.slice(0, 3);

  return (
    <div className='container mx-auto px-4 py-12'>
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold mb-4 text-algomancy-gold'>
          Welcome to Algomancer
        </h1>
        <p className='text-xl max-w-2xl mx-auto text-gray-300'>
          Your ultimate resource for Algomancy card game - browse cards, build
          decks, and join live drafts.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
        <div className='bg-algomancy-darker border border-algomancy-purple/30 p-6 rounded-lg'>
          <h2 className='text-2xl font-bold mb-4 text-algomancy-blue-light'>
            Card Database
          </h2>
          <p className='mb-4 text-gray-300'>
            Browse and search the complete collection of Algomancy cards.
          </p>
          <Link
            href='/cards'
            className='inline-block bg-algomancy-purple text-white px-4 py-2 rounded-md hover:bg-algomancy-purple-dark transition-colors'>
            Browse Cards
          </Link>
        </div>

        <div className='bg-algomancy-darker border border-algomancy-blue/30 p-6 rounded-lg'>
          <h2 className='text-2xl font-bold mb-4 text-algomancy-teal-light'>
            Deck Builder
          </h2>
          <p className='mb-4 text-gray-300'>
            Create and save your custom Algomancy decks.
          </p>
          <Link
            href='/decks'
            className='inline-block bg-algomancy-blue text-white px-4 py-2 rounded-md hover:bg-algomancy-blue-dark transition-colors'>
            Build Decks
          </Link>
        </div>

        <div className='bg-algomancy-darker border border-algomancy-gold/30 p-6 rounded-lg'>
          <h2 className='text-2xl font-bold mb-4 text-algomancy-gold-light'>
            Live Draft
          </h2>
          <p className='mb-4 text-gray-300'>
            Join or create live draft sessions with other players.
          </p>
          <Link
            href='/draft'
            className='inline-block bg-algomancy-gold text-algomancy-darker px-4 py-2 rounded-md hover:bg-algomancy-gold-dark transition-colors'>
            Start Drafting
          </Link>
        </div>
      </div>

      <div className='mb-12'>
        <h2 className='text-2xl font-bold mb-6 text-center text-algomancy-teal'>
          Featured Cards
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
          {featuredCards.map((card) => (
            <Link key={card.id} href={`/cards/${card.id}`}>
              <Card card={card} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
