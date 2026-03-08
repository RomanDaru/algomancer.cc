"use client";

import Link from "next/link";
import { useState } from "react";
import {
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function GameLogPrivacyInfoButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className='inline-flex items-center justify-center rounded-full text-gray-400 transition-colors hover:text-white'
        aria-label='Learn what making a game log public means'>
        <QuestionMarkCircleIcon className='h-5 w-5' />
      </button>

      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='fixed inset-0 bg-black/70'
            onClick={() => setIsOpen(false)}
          />
          <div className='relative w-full max-w-lg rounded-2xl border border-algomancy-purple/30 bg-algomancy-darker p-6 text-left shadow-xl'>
            <div className='flex items-start justify-between gap-4 border-b border-algomancy-purple/20 pb-4'>
              <div>
                <p className='text-xs uppercase tracking-[0.2em] text-algomancy-purple/70'>
                  Log Visibility
                </p>
                <h2 className='text-2xl font-semibold text-white'>
                  What happens when you share a log
                </h2>
              </div>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='rounded-full border border-white/10 p-1 text-gray-300 transition hover:text-white'
                aria-label='Close log privacy info'>
                <XMarkIcon className='h-5 w-5' />
              </button>
            </div>

            <div className='mt-5 space-y-4 text-sm text-gray-300'>
              <p>
                Public logs can be viewed by anyone with the link and show the
                full log details.
              </p>
              <p>
                This includes the result, format, decks or deck links,
                opponents, MVP cards, duration, and notes saved in the log.
              </p>
              <p>
                Private logs stay hidden from other users.
              </p>
              <div className='border-t border-white/10 pt-4'>
                <p className='text-sm text-gray-300'>
                  Want your private logs to help anonymous community stats?
                </p>
                <Link
                  href='/profile/edit'
                  className='mt-3 inline-flex items-center rounded-md bg-algomancy-purple px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-algomancy-purple-dark'>
                  Manage Stats Contribution
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
