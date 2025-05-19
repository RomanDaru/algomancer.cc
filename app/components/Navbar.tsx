"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className='bg-algomancy-dark border-b border-algomancy-purple-DEFAULT/30 text-white'>
      <div className='container mx-auto px-4'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex items-center'>
            <Link
              href='/'
              className='text-xl font-bold text-algomancy-gold-DEFAULT'>
              Algomancer
            </Link>
          </div>
          <div className='hidden md:flex space-x-4'>
            <Link
              href='/'
              className='px-3 py-2 rounded-md hover:bg-algomancy-purple-dark/30'>
              Home
            </Link>
            <Link
              href='/cards'
              className='px-3 py-2 rounded-md hover:bg-algomancy-purple-dark/30'>
              Cards
            </Link>
            <Link
              href='/decks'
              className='px-3 py-2 rounded-md hover:bg-algomancy-purple-dark/30'>
              Decks
            </Link>
          </div>

          <div className='flex items-center'>
            {status === "authenticated" ? (
              <div className='relative'>
                <button
                  onClick={toggleMenu}
                  className='flex items-center space-x-2 focus:outline-none'>
                  <div className='w-8 h-8 rounded-full overflow-hidden bg-algomancy-purple flex items-center justify-center'>
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={32}
                        height={32}
                      />
                    ) : (
                      <span className='text-white text-sm'>
                        {session.user?.name?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  <span className='hidden md:block'>{session.user?.name}</span>
                </button>

                {isMenuOpen && (
                  <div className='absolute right-0 mt-2 w-48 bg-algomancy-darker border border-algomancy-purple/30 rounded-md shadow-lg z-10'>
                    <div className='py-1'>
                      <Link
                        href='/profile'
                        className='block px-4 py-2 text-sm hover:bg-algomancy-purple/20'
                        onClick={() => setIsMenuOpen(false)}>
                        Profile
                      </Link>
                      <Link
                        href='/profile/decks'
                        className='block px-4 py-2 text-sm hover:bg-algomancy-purple/20'
                        onClick={() => setIsMenuOpen(false)}>
                        My Decks
                      </Link>
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: "/" });
                          setIsMenuOpen(false);
                        }}
                        className='block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10'>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex space-x-2'>
                <Link
                  href='/auth/signin'
                  className='px-3 py-1.5 text-sm rounded-md border border-algomancy-purple/50 hover:bg-algomancy-purple/20'>
                  Sign In
                </Link>
                <Link
                  href='/auth/signup'
                  className='px-3 py-1.5 text-sm rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark'>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
