"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function WhatsNewButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className='inline-flex items-center px-4 py-2 rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark text-white font-medium transition-colors'>
        What's New
      </button>

      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='fixed inset-0 bg-black/70'
            onClick={() => setIsOpen(false)}
          />
          <div className='relative w-full max-w-3xl rounded-2xl border border-algomancy-purple/30 bg-algomancy-darker p-6 text-left shadow-xl'>
            <div className='flex items-start justify-between gap-4 border-b border-algomancy-purple/20 pb-4'>
              <div>
                <p className='text-xs uppercase tracking-[0.2em] text-algomancy-purple/70'>
                  Patch Notes
                </p>
                <h2 className='text-2xl font-semibold text-white'>
                  Game Logs, Stats, and Achievements
                </h2>
              </div>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='rounded-full border border-white/10 p-1 text-gray-300 transition hover:text-white'
                aria-label='Close patch notes'>
                <XMarkIcon className='h-5 w-5' />
              </button>
            </div>

            <div className='mt-5 space-y-6 text-sm text-gray-200'>
              <section>
                <h3 className='text-base font-semibold text-white'>Game Logs</h3>
                <ul className='mt-2 space-y-2 text-gray-300'>
                  <li>
                    Create, edit, and delete logs for Constructed and Live Draft
                    matches.
                  </li>
                  <li>
                    Track date/time, duration, outcome, match type, and notes.
                  </li>
                  <li>
                    Add opponents with their elements and optional MVP cards.
                  </li>
                  <li>
                    Constructed: pick your deck (and teammate deck for 2v2) or
                    paste a deck link.
                  </li>
                  <li>
                    Live Draft: select elements played and add MVP cards (Top
                    3).
                  </li>
                </ul>
              </section>

              <section>
                <h3 className='text-base font-semibold text-white'>Stats</h3>
                <ul className='mt-2 space-y-2 text-gray-300'>
                  <li>
                    New <span className='text-white'>/stats</span> page with My
                    Stats and Community Stats tabs.
                  </li>
                  <li>
                    Time-range filters for win rate, total games, time played,
                    and average duration.
                  </li>
                  <li>
                    Most played and highest win-rate elements, plus MVP card
                    usage.
                  </li>
                  <li>Activity heatmap for recent logging streaks.</li>
                </ul>
              </section>

              <section>
                <h3 className='text-base font-semibold text-white'>
                  Achievements and Ranks
                </h3>
                <ul className='mt-2 space-y-2 text-gray-300'>
                  <li>Achievement system with XP and rank progression.</li>
                  <li>
                    Toasts on unlock plus a level-up modal when you rank up.
                  </li>
                  <li>Chain achievements with clear progress tracking.</li>
                </ul>
              </section>

              <section>
                <h3 className='text-base font-semibold text-white'>
                  Reputation XP
                </h3>
                <ul className='mt-2 space-y-2 text-gray-300'>
                  <li>XP for creating logs and building decks.</li>
                  <li>
                    Deck likes award XP (and remove XP on unlike) with
                    anti-abuse rules.
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
