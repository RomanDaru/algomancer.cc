"use client";

import { useState } from "react";
import DisclaimerModal from "./DisclaimerModal";
import ContactModal from "./ContactModal";

export default function Footer() {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <footer className='mt-auto border-t border-algomancy-purple/30 bg-algomancy-darker text-white'>
      <div className='mx-auto w-full max-w-6xl px-4 py-8 sm:px-6'>
        <div className='grid gap-8 pb-7 md:grid-cols-2 md:items-center'>
          <div>
            <p className='font-semibold text-algomancy-gold'>Algomancer.cc</p>
            <p className='mt-1 text-sm text-gray-400'>
              A free deck-building companion for the Algomancy community.
            </p>
          </div>

          <div className='md:text-right'>
            <p className='text-sm text-gray-300'>Support Algomancer.cc</p>
            <p className='mt-1 text-xs leading-5 text-gray-400'>
              Optional support helps cover hosting and continued development.
            </p>
            <a
              href='https://www.buymeacoffee.com/RomanDaru'
              target='_blank'
              rel='noopener noreferrer'
              className='mt-3 inline-flex min-h-9 items-center justify-center rounded-md border border-algomancy-gold/50 px-3 py-2 text-sm font-medium text-algomancy-gold transition-colors hover:border-algomancy-gold hover:text-white'>
              Support this project
            </a>
          </div>
        </div>

        <div className='border-t border-white/10 pt-5 text-xs leading-5 text-gray-500'>
          <p className='max-w-4xl'>
            Algomancer.cc is an unofficial, independent fan project and is not
            affiliated with or endorsed by Caleb Gannon. Algomancy, its rules,
            card text, and artwork are shown only to support players and remain
            the property of their respective rights holders.
          </p>

          <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p>
              © {new Date().getFullYear()} Algomancer.cc. Built for the
              Algomancy community.
            </p>
            <div className='flex flex-wrap gap-x-4 gap-y-2'>
              <a
                href='https://algomancy.online/'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-400 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white'>
                Play online
              </a>
              <button
                type='button'
                onClick={() => setIsContactOpen(true)}
                className='text-gray-400 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white'>
                Contact & Feedback
              </button>
              <button
                type='button'
                onClick={() => setIsDisclaimerOpen(true)}
                className='text-gray-400 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white'>
                Legal Disclaimer
              </button>
            </div>
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
    </footer>
  );
}
