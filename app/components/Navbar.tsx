"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

/**
 * Navbar component for Algomancer.gg
 * Provides navigation, authentication controls, and responsive mobile menu
 */
export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLDivElement>(null);

  // Handle menu toggle with a single function to avoid race conditions
  const handleMenuToggle = (
    e: React.MouseEvent,
    forceState?: boolean,
    allowNavigation: boolean = false
  ) => {
    // Only prevent default if we're not allowing navigation (i.e., not a link click)
    if (!allowNavigation) {
      e.preventDefault();
    }

    e.stopPropagation(); // Prevent event bubbling

    // Use a callback to ensure we're working with the latest state
    setIsMenuOpen((currentState) => {
      // If forceState is provided, use that, otherwise toggle
      const newState = forceState !== undefined ? forceState : !currentState;

      // If opening the menu, close the profile menu
      if (newState === true) {
        setIsProfileMenuOpen(false);
      }

      return newState;
    });
  };

  const toggleProfileMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsProfileMenuOpen(!isProfileMenuOpen);
    // Close mobile menu when toggling profile menu
    setIsMenuOpen(false);
  };

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Get the target element
      const target = event.target as Node;

      // Check if the click is on a menu button - if so, don't close the menu
      if (menuButtonRef.current && menuButtonRef.current.contains(target)) {
        return;
      }

      // Close mobile menu when clicking outside (but not on menu buttons)
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }

      // Close profile menu when clicking outside
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    }

    // Handle keyboard navigation for accessibility
    function handleKeyDown(event: KeyboardEvent) {
      // Close menus on Escape key
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsProfileMenuOpen(false);
      }
    }

    // Use capture phase for mousedown listener to ensure it runs before events on target elements
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <nav
      className='bg-algomancy-dark border-b border-algomancy-purple-DEFAULT/30 text-white'
      aria-label='Main navigation'
      role='navigation'>
      <div className='container mx-auto px-4'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex items-center'>
            <Link
              href='/'
              className='text-xl font-bold text-algomancy-gold-DEFAULT'
              aria-label='Algomancer.gg Home'
              title='Go to Algomancer.gg Home'>
              Algomancer
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:block'>
            <ul
              className='flex space-x-4'
              role='menubar'
              aria-label='Main menu'>
              <li role='none'>
                <Link
                  href='/'
                  className='px-3 py-2 rounded-md hover:bg-algomancy-purple-dark/30 inline-block'
                  role='menuitem'
                  aria-current={
                    typeof window !== "undefined" &&
                    window.location.pathname === "/"
                      ? "page"
                      : undefined
                  }>
                  Home
                </Link>
              </li>
              <li role='none'>
                <Link
                  href='/cards'
                  className='px-3 py-2 rounded-md hover:bg-algomancy-purple-dark/30 inline-block'
                  role='menuitem'
                  aria-current={
                    typeof window !== "undefined" &&
                    window.location.pathname === "/cards"
                      ? "page"
                      : undefined
                  }>
                  Cards
                </Link>
              </li>
              <li role='none'>
                <Link
                  href='/decks'
                  className='px-3 py-2 rounded-md hover:bg-algomancy-purple-dark/30 inline-block'
                  role='menuitem'
                  aria-current={
                    typeof window !== "undefined" &&
                    window.location.pathname === "/decks"
                      ? "page"
                      : undefined
                  }>
                  Decks
                </Link>
              </li>
            </ul>
          </div>

          {/* Placeholder for layout balance on mobile */}
          <div className='md:hidden'></div>

          <div className='flex items-center'>
            {status === "authenticated" ? (
              <div className='flex items-center'>
                {/* Mobile Menu Buttons - Moved to right */}
                <div className='md:hidden mr-3' ref={menuButtonRef}>
                  {!isMenuOpen ? (
                    <button
                      onClick={(e) => handleMenuToggle(e, true)}
                      className='p-2 rounded-md hover:bg-algomancy-purple/20 focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'
                      aria-label='Open menu'
                      aria-expanded='false'
                      aria-controls='mobile-menu'>
                      <span className='sr-only'>Open main menu</span>
                      <svg
                        className='h-6 w-6'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        aria-hidden='true'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 6h16M4 12h16M4 18h16'
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleMenuToggle(e, false)}
                      className='p-2 rounded-md hover:bg-algomancy-purple/20 focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'
                      aria-label='Close menu'
                      aria-expanded='true'
                      aria-controls='mobile-menu'>
                      <span className='sr-only'>Close main menu</span>
                      <svg
                        className='h-6 w-6'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        aria-hidden='true'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Profile Menu - Hidden on mobile */}
                <div className='relative hidden md:block' ref={profileMenuRef}>
                  <button
                    onClick={(e) => toggleProfileMenu(e)}
                    className='flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50 hover:opacity-80 cursor-pointer transition-opacity rounded-md p-1'
                    aria-expanded={isProfileMenuOpen ? "true" : "false"}
                    aria-haspopup='true'
                    aria-controls='profile-menu'
                    aria-label='User profile menu'>
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
                    <span className='max-w-[120px] truncate'>
                      {session.user?.name}
                    </span>
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      id='profile-menu'
                      className='absolute right-0 mt-2 w-48 bg-algomancy-darker border border-algomancy-purple/30 rounded-md shadow-lg z-10'
                      role='menu'
                      aria-orientation='vertical'
                      aria-labelledby='user-menu-button'>
                      <div className='py-1'>
                        <Link
                          href='/profile'
                          className='block px-4 py-2 text-sm hover:bg-algomancy-purple/20'
                          onClick={() => setIsProfileMenuOpen(false)}
                          role='menuitem'
                          tabIndex={0}>
                          Profile
                        </Link>
                        <Link
                          href='/profile/decks'
                          className='block px-4 py-2 text-sm hover:bg-algomancy-purple/20'
                          onClick={() => setIsProfileMenuOpen(false)}
                          role='menuitem'
                          tabIndex={0}>
                          My Decks
                        </Link>
                        <button
                          onClick={() => {
                            signOut({ callbackUrl: "/" });
                            setIsProfileMenuOpen(false);
                          }}
                          className='block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10'
                          role='menuitem'
                          tabIndex={0}>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='flex items-center'>
                {/* Mobile Menu Buttons for non-authenticated users */}
                <div className='md:hidden mr-3' ref={menuButtonRef}>
                  {!isMenuOpen ? (
                    <button
                      onClick={(e) => handleMenuToggle(e, true)}
                      className='p-2 rounded-md hover:bg-algomancy-purple/20 focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'
                      aria-label='Open menu'
                      aria-expanded='false'
                      aria-controls='mobile-menu'>
                      <span className='sr-only'>Open main menu</span>
                      <svg
                        className='h-6 w-6'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        aria-hidden='true'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 6h16M4 12h16M4 18h16'
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleMenuToggle(e, false)}
                      className='p-2 rounded-md hover:bg-algomancy-purple/20 focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50'
                      aria-label='Close menu'
                      aria-expanded='true'
                      aria-controls='mobile-menu'>
                      <span className='sr-only'>Close main menu</span>
                      <svg
                        className='h-6 w-6'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        aria-hidden='true'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Auth Buttons */}
                <div className='flex space-x-2'>
                  <Link
                    href='/auth/signin'
                    className='px-3 py-1.5 text-sm rounded-md border border-algomancy-purple/50 hover:bg-algomancy-purple/20 focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50 transition-colors'
                    aria-label='Sign in to your account'
                    title='Sign in to your account'>
                    Sign In
                  </Link>
                  <Link
                    href='/auth/signup'
                    className='px-3 py-1.5 text-sm rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50 transition-colors'
                    aria-label='Create a new account'
                    title='Create a new account'>
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Fixed position to prevent jumping */}
      {isMenuOpen && (
        <div
          id='mobile-menu'
          className='md:hidden bg-algomancy-darker border-t border-algomancy-purple/30 absolute top-16 left-0 right-0 z-20 shadow-lg'
          ref={menuRef}
          aria-labelledby='mobile-menu-button'
          role='menu'>
          <div className='px-4 pt-2 pb-3 space-y-1'>
            <ul className='space-y-1' role='menu'>
              <li role='none'>
                <Link
                  href='/'
                  className='block px-3 py-2 rounded-md hover:bg-algomancy-purple/20'
                  onClick={(e) => handleMenuToggle(e, false, true)} // Close menu on link click, allow navigation
                  role='menuitem'
                  aria-current={
                    typeof window !== "undefined" &&
                    window.location.pathname === "/"
                      ? "page"
                      : undefined
                  }>
                  Home
                </Link>
              </li>
              <li role='none'>
                <Link
                  href='/cards'
                  className='block px-3 py-2 rounded-md hover:bg-algomancy-purple/20'
                  onClick={(e) => handleMenuToggle(e, false, true)} // Close menu on link click, allow navigation
                  role='menuitem'
                  aria-current={
                    typeof window !== "undefined" &&
                    window.location.pathname === "/cards"
                      ? "page"
                      : undefined
                  }>
                  Cards
                </Link>
              </li>
              <li role='none'>
                <Link
                  href='/decks'
                  className='block px-3 py-2 rounded-md hover:bg-algomancy-purple/20'
                  onClick={(e) => handleMenuToggle(e, false, true)} // Close menu on link click, allow navigation
                  role='menuitem'
                  aria-current={
                    typeof window !== "undefined" &&
                    window.location.pathname === "/decks"
                      ? "page"
                      : undefined
                  }>
                  Decks
                </Link>
              </li>
            </ul>

            {status === "authenticated" && (
              <>
                <div className='border-t border-algomancy-purple/20 my-2'></div>

                {/* User Profile Info in Mobile Menu */}
                <div className='flex items-center px-3 py-2'>
                  <div className='w-8 h-8 rounded-full overflow-hidden bg-algomancy-purple flex items-center justify-center mr-3'>
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
                  <div>
                    <div className='text-white font-medium'>
                      {session.user?.name}
                    </div>
                    {/* Username display removed to fix TypeScript errors */}
                  </div>
                </div>

                <Link
                  href='/profile'
                  className='block px-3 py-2 rounded-md hover:bg-algomancy-purple/20'
                  onClick={(e) => handleMenuToggle(e, false, true)} // Close menu on link click, allow navigation
                >
                  Profile
                </Link>
                <Link
                  href='/profile/decks'
                  className='block px-3 py-2 rounded-md hover:bg-algomancy-purple/20'
                  onClick={(e) => handleMenuToggle(e, false, true)} // Close menu on link click, allow navigation
                >
                  My Decks
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    signOut({ callbackUrl: "/" });
                    handleMenuToggle(e, false, true);
                  }}
                  className='block w-full text-left px-3 py-2 rounded-md text-red-400 hover:bg-red-500/10'>
                  Sign Out
                </button>
              </>
            )}

            {status !== "authenticated" && (
              <>
                <div className='border-t border-algomancy-purple/20 my-2'></div>
                <Link
                  href='/auth/signin'
                  className='block px-3 py-2 rounded-md hover:bg-algomancy-purple/20'
                  onClick={(e) => handleMenuToggle(e, false, true)} // Close menu on link click, allow navigation
                >
                  Sign In
                </Link>
                <Link
                  href='/auth/signup'
                  className='block px-3 py-2 rounded-md hover:bg-algomancy-purple/20'
                  onClick={(e) => handleMenuToggle(e, false, true)} // Close menu on link click, allow navigation
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
