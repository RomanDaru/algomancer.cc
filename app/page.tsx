import Link from "next/link";
import { ArrowRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import StructuredData from "./components/StructuredData";
import WhatsNewButton from "./components/WhatsNewButton";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const metadata: Metadata = {
  title: "Algomancy Deck Builder - Build Powerful Decks | Algomancer.cc",
  description:
    "Create powerful Algomancy decks with our free deck builder. Search cards, analyze statistics, and share with the community. The ultimate tool for Algomancy players.",
  keywords: [
    "algomancy deck builder",
    "algomancy cards",
    "deck building tool",
    "algomancy database",
    "card game deck builder",
    "algomancy community",
    "free deck builder",
  ],
  openGraph: {
    title: "Algomancy Deck Builder - Build Powerful Decks",
    description:
      "Create powerful Algomancy decks with our free deck builder. Search cards, analyze statistics, and share with the community.",
    url: "https://algomancer.cc",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Algomancer.cc - Algomancy Deck Builder",
      },
    ],
  },
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const showCompetitions = Boolean(session?.user?.isAdmin);

  return (
    <>
      <StructuredData type='website' data={{}} />
      <StructuredData type='organization' data={{}} />
      <div className='min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-algomancy-dark to-black'>
        <div className='max-w-3xl w-full text-center'>
          <h1 className='text-4xl md:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-algomancy-gold via-algomancy-purple to-algomancy-blue bg-clip-text text-transparent'>
            Algomancer.cc
          </h1>

          <p className='text-lg md:text-2xl mb-6 md:mb-8 text-gray-300 leading-relaxed'>
            The Ultimate Algomancy Deck Builder & Card Database
          </p>

          {/* Desktop description - hidden on mobile */}
          <div className='hidden md:block max-w-2xl mx-auto text-gray-400 text-lg leading-relaxed'>
            <p>
              Build powerful Algomancy decks with our comprehensive deck
              builder. Search through the complete card database, analyze deck
              statistics, and share your creations with the Algomancy community.
              Free to use, no signup required to start building!
            </p>
          </div>
        </div>

        <div className='my-12 flex w-full justify-center'>
          <WhatsNewButton />
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            showCompetitions ? "lg:grid-cols-4" : "lg:grid-cols-3"
          } gap-4 md:gap-6 w-full max-w-6xl`}>
          <Link
            href='/decks/create'
            className='group flex flex-col items-center p-4 md:p-6 rounded-lg bg-gradient-to-br from-algomancy-darker to-algomancy-dark border border-algomancy-purple/30 hover:border-algomancy-purple/70 transition-all duration-300 hover:shadow-md hover:shadow-algomancy-purple/20 cursor-pointer'>
            <div className='w-12 h-12 md:w-12 md:h-12 mb-2 md:mb-4 rounded-full bg-algomancy-purple/20 flex items-center justify-center group-hover:bg-algomancy-purple/30 transition-all'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6 md:h-6 md:w-6 text-algomancy-purple'
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
            <h2 className='text-lg md:text-xl font-bold text-white group-hover:text-algomancy-purple transition-colors'>
              Deck Builder
            </h2>
            {/* Desktop-only description and action text */}
            <p className='hidden md:block text-gray-400 text-center text-sm mb-3 px-2'>
              Build powerful Algomancy decks (no signup required)
            </p>
            <span className='hidden md:flex items-center text-algomancy-purple text-sm font-medium'>
              Get Started{" "}
              <ArrowRightIcon className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform' />
            </span>
          </Link>

          <Link
            href='/decks'
            className='group flex flex-col items-center p-4 md:p-6 rounded-lg bg-gradient-to-br from-algomancy-darker to-algomancy-dark border border-algomancy-blue/30 hover:border-algomancy-blue/70 transition-all duration-300 hover:shadow-md hover:shadow-algomancy-blue/20 cursor-pointer'>
            <div className='w-12 h-12 md:w-12 md:h-12 mb-2 md:mb-4 rounded-full bg-algomancy-blue/20 flex items-center justify-center group-hover:bg-algomancy-blue/30 transition-all'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6 md:h-6 md:w-6 text-algomancy-blue'
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
            <h2 className='text-lg md:text-xl font-bold text-white group-hover:text-algomancy-blue transition-colors'>
              Browse Decks
            </h2>
            {/* Desktop-only description and action text */}
            <p className='hidden md:block text-gray-400 text-center text-sm mb-3 px-2'>
              Discover top Algomancy decks from the community
            </p>
            <span className='hidden md:flex items-center text-algomancy-blue text-sm font-medium'>
              Explore{" "}
              <ArrowRightIcon className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform' />
            </span>
          </Link>

          <Link
            href='/cards'
            className='group flex flex-col items-center p-4 md:p-6 rounded-lg bg-gradient-to-br from-algomancy-darker to-algomancy-dark border border-algomancy-gold/30 hover:border-algomancy-gold/70 transition-all duration-300 hover:shadow-md hover:shadow-algomancy-gold/20 cursor-pointer'>
            <div className='w-12 h-12 md:w-12 md:h-12 mb-2 md:mb-4 rounded-full bg-algomancy-gold/20 flex items-center justify-center group-hover:bg-algomancy-gold/30 transition-all'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6 md:h-6 md:w-6 text-algomancy-gold'
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
            <h2 className='text-lg md:text-xl font-bold text-white group-hover:text-algomancy-gold transition-colors'>
              Card Database
            </h2>
            {/* Desktop-only description and action text */}
            <p className='hidden md:block text-gray-400 text-center text-sm mb-3 px-2'>
              Search the complete Algomancy card database
            </p>
            <span className='hidden md:flex items-center text-algomancy-gold text-sm font-medium'>
              Browse{" "}
              <ArrowRightIcon className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform' />
            </span>
          </Link>

          {showCompetitions && (
            <Link
              href='/competitions'
              className='group flex flex-col items-center p-4 md:p-6 rounded-lg bg-gradient-to-br from-algomancy-darker to-algomancy-dark border border-red-500/30 hover:border-red-500/70 transition-all duration-300 hover:shadow-md hover:shadow-red-500/20 cursor-pointer'>
              <div className='w-12 h-12 md:w-12 md:h-12 mb-2 md:mb-4 rounded-full bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-all'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6 md:h-6 md:w-6 text-red-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
                  />
                </svg>
              </div>
              <h2 className='text-lg md:text-xl font-bold text-white group-hover:text-red-500 transition-colors'>
                Competitions
              </h2>
              {/* Desktop-only description and action text */}
              <p className='hidden md:block text-gray-400 text-center text-sm mb-3 px-2'>
                Join deck building competitions and showcase your skills
              </p>
              <span className='hidden md:flex items-center text-red-500 text-sm font-medium'>
                Compete{" "}
                <ArrowRightIcon className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform' />
              </span>
            </Link>
          )}
        </div>

        {/* Promote the official Algomancy game */}
        <div className='w-full max-w-6xl mt-8'>
          <div className='group relative overflow-hidden rounded-lg transition-all duration-300 p-5 md:p-6'>
            <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
              <div className='flex items-center'>
                <div>
                  <h2 className='text-lg md:text-xl text-center font-bold text-white pb-2'>
                    Play Algomancy
                  </h2>
                  <p className='text-gray-300 text-sm md:text-base'>
                    Get your physical copy of Algomancy and support the creator!
                  </p>
                </div>
              </div>
              <a
                href='https://algomancy.io/'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center px-4 py-2 rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark text-white font-medium transition-colors cursor-pointer'>
                Visit algomancy.io
                <ArrowRightIcon className='w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform' />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
