"use client";

import { useState } from "react";
import DisclaimerModal from "./DisclaimerModal";
import ContactModal from "./ContactModal";

export default function Footer() {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <footer className='mt-auto border-t border-algomancy-purple/30 bg-algomancy-darker text-white'>
      <div className='container mx-auto px-4 py-6'>
        <div className='flex flex-row gap-8 max-md:flex-col md:items-center md:justify-between'>
          <div className='w-full text-center md:w-auto md:text-left'>
            <div className='font-semibold text-algomancy-gold'>
              Algomancer.cc
            </div>
            <div className='mt-1 text-sm text-gray-400'>
              Your ultimate companion for the Algomancy card game
            </div>
          </div>

          <div className='flex flex-row max-md:flex-col items-center gap-4 sm:justify-center md:justify-end'>
            <div className='max-w-sm text-center sm:text-right md:text-left'>
              <p className='mb-1 text-sm md:text-right text-gray-300'>
                Supporting Algomancer.cc
              </p>
              <p className='text-xs md:text-right text-gray-400'>
                This project is self-funded and built with passion for the
                Algomancy community. Your support helps keep it running and
                growing!
              </p>
            </div>

            <a
              href='https://www.buymeacoffee.com/RomanDaru'
              target='_blank'
              rel='noopener noreferrer'
              className='shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-algomancy-purple/20'
              title='Support the development of Algomancer.cc'>
              <img
                src='https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png'
                alt='Buy Me A Coffee'
                style={{ height: "60px", width: "217px" }}
                className='h-auto w-full max-w-[217px] rounded-md'
              />
            </a>
          </div>
        </div>

        <div className='mt-6 border-t border-algomancy-purple/20 pt-4 text-center'>
          <p className='text-xs text-gray-500'>
            (c) {new Date().getFullYear()} Algomancer.cc. Built for the
            Algomancy community.{" "}
            <button
              onClick={() => setIsContactOpen(true)}
              className='cursor-pointer text-algomancy-purple underline transition-colors hover:text-algomancy-gold'>
              Contact & Feedback
            </button>
            {" | "}
            <button
              onClick={() => setIsDisclaimerOpen(true)}
              className='cursor-pointer text-algomancy-purple underline transition-colors hover:text-algomancy-gold'>
              Legal Disclaimer
            </button>
          </p>
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
