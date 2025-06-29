"use client";

import { useState } from "react";
import DisclaimerModal from "./DisclaimerModal";
import ContactModal from "./ContactModal";

/**
 * Footer component for Algomancer.cc
 * Provides site footer with BuyMeACoffee link and other information
 */
export default function Footer() {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  return (
    <footer className='bg-algomancy-darker border-t border-algomancy-purple/30 text-white mt-auto'>
      <div className='container mx-auto px-4 py-6'>
        <div className='md:flex items-center justify-between space-y-4 md:space-y-0'>
          {/* Left side - Site title */}
          <div className='flex-shrink-0 text-center md:text-left'>
            <div className='text-algomancy-gold font-semibold'>
              Algomancer.cc
            </div>
            {/* Center - Description */}
            <div className='text-sm text-gray-400 text-center flex-grow px-4'>
              Your ultimate companion for the Algomancy card game
            </div>
          </div>

          {/* Right side - Support section */}
          <div className='flex items-center justify-center md:justify-end md:space-x-4'>
            <div className='text-right'>
              <p className='text-sm text-gray-300 mb-1'>
                Supporting Algomancer.cc
              </p>
              <p className='text-xs text-gray-400 max-w-xs'>
                This project is self-funded and built with passion for the
                Algomancy community. Your support helps keep it running and
                growing!
              </p>
            </div>
            <a
              href='https://www.buymeacoffee.com/RomanDaru'
              target='_blank'
              rel='noopener noreferrer'
              className='transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-algomancy-purple/20 flex-shrink-0'
              title='Support the development of Algomancer.cc'>
              <img
                src='https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png'
                alt='Buy Me A Coffee'
                style={{ height: "60px", width: "217px" }}
                className='rounded-md'
              />
            </a>
          </div>
        </div>

        {/* Bottom section - Copyright */}
        <div className='mt-6 pt-4 border-t border-algomancy-purple/20 text-center'>
          <p className='text-xs text-gray-500'>
            © {new Date().getFullYear()} Algomancer.cc. Built for the Algomancy
            community.{" "}
            <button
              onClick={() => setIsContactOpen(true)}
              className='text-algomancy-purple hover:text-algomancy-gold transition-colors underline cursor-pointer'>
              Contact & Feedback
            </button>
            {" • "}
            <button
              onClick={() => setIsDisclaimerOpen(true)}
              className='text-algomancy-purple hover:text-algomancy-gold transition-colors underline cursor-pointer'>
              Legal Disclaimer
            </button>
          </p>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Disclaimer Modal */}
      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
    </footer>
  );
}
