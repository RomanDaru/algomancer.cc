import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import StructuredData from "./components/StructuredData";
import LandingBackdrop from "./components/LandingBackdrop";
import styles from "./components/LandingBackdrop.module.css";

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

      <LandingBackdrop>
        <section className={styles.hero} aria-labelledby='landing-title'>
          <div className={styles.intro}>
            <p className={styles.tagline}>
              A deck building companion for
            </p>
            <h1 id='landing-title' className={styles.title}>
              Algomancy.
            </h1>

            <p className={styles.description}>
              Create your own deck or explore decks built by the community.
            </p>

            <div className={styles.actions}>
              <Link
                href='/decks/create'
                className='inline-flex min-h-12 items-center justify-center rounded-md bg-algomancy-purple px-3 py-3 text-sm font-medium text-white transition-colors hover:bg-algomancy-purple-light sm:text-base'>
                Create a deck
              </Link>
              <Link
                href='/decks'
                className='inline-flex min-h-12 items-center justify-center rounded-md border border-white/25 bg-white/[0.06] px-3 py-3 text-sm font-medium text-white transition-colors hover:border-white/45 hover:bg-white/[0.1] sm:text-base'>
                Browse decks
              </Link>
            </div>

            <div className={styles.links}>
              <Link
                href='/cards'
                className='underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white/70'>
                Browse all cards
              </Link>
              <Link
                href='/stats'
                className='underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white/70'>
                Explore the meta
              </Link>
              {showCompetitions && (
                <Link
                  href='/competitions'
                  className='underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white/70'>
                  Manage competitions
                </Link>
              )}
            </div>
          </div>
          <div className={styles.figureSlot} aria-hidden='true'>
            <div
              className={styles.figure}
              data-parallax-depth='-0.085'
              data-parallax-layer='figure'>
              <Image
                src='/images/landing/algomancy-figure.webp'
                alt=''
                fill
                loading='eager'
                sizes='(min-width: 1200px) 450px, (min-width: 768px) 40vw, 100vw'
                className={styles.figureImage}
              />
            </div>
          </div>
        </section>

        <section className={styles.support}>
          <div className='mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-10'>
            <div className='max-w-3xl'>
              <h2 className='text-xl font-semibold text-white'>
                Buy Algomancy. Support its creator.
              </h2>
              <p className='mt-3 text-sm leading-6 text-gray-200'>
                Algomancer.cc is a companion for building, analyzing, and
                sharing decks—not a substitute for owning the game. Algomancy
                is a physical card game created by Caleb Gannon. If this site
                helps you enjoy it, please support the game through his
                official shop.
              </p>
              <p className='mt-3 text-xs leading-5 text-gray-400'>
                Both links go directly to Caleb Gannon&apos;s shop.
                Algomancer.cc uses no affiliate code and receives no
                commission.
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-1'>
              <a
                href='https://shop.calebgannon.com/products/algomancy-the-base-game'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex min-h-10 items-center justify-center rounded-md bg-algomancy-gold px-4 py-2 text-sm font-semibold text-algomancy-darker transition-colors hover:bg-algomancy-gold-light'>
                Buy the physical game →
              </a>
              <a
                href='https://shop.calebgannon.com/products/algomancy-print-and-play-edition'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex min-h-10 items-center justify-center rounded-md border border-white/25 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/45 hover:bg-white/[0.08]'>
                Buy the print-and-play →
              </a>
            </div>
          </div>
        </section>
      </LandingBackdrop>
    </>
  );
}
