import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className='min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-algomancy-dark to-black'>
      <div className='max-w-3xl w-full text-center mb-16'>
        <h1 className='text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-algomancy-gold via-algomancy-purple to-algomancy-blue bg-clip-text text-transparent'>
          Algomancer.cc
        </h1>

        <p className='text-xl md:text-2xl mb-8 text-gray-300 leading-relaxed'>
          Your ultimate companion for the Algomancy card game
        </p>

        <div className='max-w-2xl mx-auto mb-12 text-gray-400 text-lg leading-relaxed'>
          <p>
            Build powerful decks, explore the complete card database, and share
            your creations with the community. Analyze deck statistics, search
            cards by multiple criteria, and elevate your Algomancy experience.
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl'>
        <Link
          href='/decks/create'
          className='group flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-algomancy-darker to-algomancy-dark border border-algomancy-purple/30 hover:border-algomancy-purple/70 transition-all duration-300 hover:shadow-md hover:shadow-algomancy-purple/20'>
          <div className='w-12 h-12 mb-4 rounded-full bg-algomancy-purple/20 flex items-center justify-center group-hover:bg-algomancy-purple/30 transition-all'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6 text-algomancy-purple'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M12 4v16m8-8H4'
              />
            </svg>
          </div>
          <h2 className='text-xl font-bold mb-2 text-white group-hover:text-algomancy-purple transition-colors'>
            Create Deck
          </h2>
          <p className='text-gray-400 text-center text-sm mb-3'>
            Build your own custom deck (no signup required)
          </p>
          <span className='flex items-center text-algomancy-purple text-sm'>
            Get Started{" "}
            <ArrowRightIcon className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform' />
          </span>
        </Link>

        <Link
          href='/decks'
          className='group flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-algomancy-darker to-algomancy-dark border border-algomancy-blue/30 hover:border-algomancy-blue/70 transition-all duration-300 hover:shadow-md hover:shadow-algomancy-blue/20'>
          <div className='w-12 h-12 mb-4 rounded-full bg-algomancy-blue/20 flex items-center justify-center group-hover:bg-algomancy-blue/30 transition-all'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6 text-algomancy-blue'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
              />
            </svg>
          </div>
          <h2 className='text-xl font-bold mb-2 text-white group-hover:text-algomancy-blue transition-colors'>
            Browse Decks
          </h2>
          <p className='text-gray-400 text-center text-sm mb-3'>
            Explore community decks
          </p>
          <span className='flex items-center text-algomancy-blue text-sm'>
            Explore{" "}
            <ArrowRightIcon className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform' />
          </span>
        </Link>

        <Link
          href='/cards'
          className='group flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-algomancy-darker to-algomancy-dark border border-algomancy-gold/30 hover:border-algomancy-gold/70 transition-all duration-300 hover:shadow-md hover:shadow-algomancy-gold/20'>
          <div className='w-12 h-12 mb-4 rounded-full bg-algomancy-gold/20 flex items-center justify-center group-hover:bg-algomancy-gold/30 transition-all'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6 text-algomancy-gold'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M4 6h16M4 10h16M4 14h16M4 18h16'
              />
            </svg>
          </div>
          <h2 className='text-xl font-bold mb-2 text-white group-hover:text-algomancy-gold transition-colors'>
            Card Database
          </h2>
          <p className='text-gray-400 text-center text-sm mb-3'>
            Browse all available cards
          </p>
          <span className='flex items-center text-algomancy-gold text-sm'>
            Browse{" "}
            <ArrowRightIcon className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform' />
          </span>
        </Link>
      </div>
    </div>
  );
}
