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
        What&apos;s New
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
                  Recent Updates
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
                <p className='text-xs uppercase tracking-[0.18em] text-algomancy-gold/80'>
                  March 8, 2026
                </p>
                <h3 className='mt-2 text-base font-semibold text-white'>
                  Privacy, Search, and Card Filtering
                </h3>
                <ul className='mt-3 space-y-2 text-gray-300'>
                  <li>
                    Game logs now use clearer privacy language, with a dedicated
                    log visibility explainer and a direct link to anonymous
                    stats settings in your profile.
                  </li>
                  <li>
                    Public log pages now include a simple{" "}
                    <span className='text-white'>Copy Link</span> action for
                    sharing.
                  </li>
                  <li>
                    Log creation and editing recover cleanly after auth expiry,
                    with draft restore on re-sign-in and a smoother redirect
                    after saving.
                  </li>
                  <li>
                    Public deck browsing now supports search by deck name,
                    author, and cards contained in a deck, plus compact filters
                    for elements and deck types.
                  </li>
                  <li>
                    Card filters now support{" "}
                    <span className='text-white'>Any of these</span>,{" "}
                    <span className='text-white'>All of these</span>, and{" "}
                    <span className='text-white'>Exactly these</span> for
                    multi-element searches.
                  </li>
                  <li>
                    Background colors were also unified and slightly lightened
                    across decks and game log pages.
                  </li>
                </ul>
              </section>

              <details className='border-t border-algomancy-purple/20 pt-5'>
                <summary className='cursor-pointer list-none text-sm font-medium text-gray-300 transition hover:text-white'>
                  Previous Updates
                </summary>
                <div className='mt-5 space-y-6'>
                  <section>
                    <p className='text-xs uppercase tracking-[0.18em] text-algomancy-gold/80'>
                      March 7, 2026
                    </p>
                    <h3 className='mt-2 text-base font-semibold text-white'>
                      Public Meta Refresh
                    </h3>
                    <ul className='mt-3 space-y-2 text-gray-300'>
                      <li>
                        Stats were refocused around{" "}
                        <span className='text-white'>Public Meta</span> so deck
                        visibility and named deck performance are easier to
                        explore.
                      </li>
                      <li>
                        Public deck sections were reworked to better highlight
                        deck performance, meta share, and direct links to deck
                        details.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <p className='text-xs uppercase tracking-[0.18em] text-algomancy-gold/80'>
                      January 12, 2026
                    </p>
                    <h3 className='mt-2 text-base font-semibold text-white'>
                      Game Logs, Stats, and Achievements
                    </h3>
                    <ul className='mt-3 space-y-2 text-gray-300'>
                      <li>
                        Create, edit, and delete logs for Constructed and Live
                        Draft matches.
                      </li>
                      <li>
                        Track date/time, duration, outcome, match type, and
                        notes.
                      </li>
                      <li>
                        Add opponents with their elements and optional MVP
                        cards.
                      </li>
                      <li>
                        Constructed: pick your deck (and teammate deck for 2v2)
                        or paste a deck link.
                      </li>
                      <li>
                        Live Draft: select elements played and add MVP cards
                        (Top 3).
                      </li>
                      <li>
                        New <span className='text-white'>/stats</span> page with
                        My Stats, Public Meta, and community-facing tracking.
                      </li>
                      <li>
                        Achievement system with XP, ranks, unlock toasts, and a
                        level-up modal.
                      </li>
                      <li>
                        Deck and logging actions now contribute reputation XP
                        with anti-abuse protections.
                      </li>
                    </ul>
                  </section>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
