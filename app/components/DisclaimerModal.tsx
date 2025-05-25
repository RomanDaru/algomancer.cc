"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DisclaimerModal({
  isOpen,
  onClose,
}: DisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto custom-scrollbar'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div className='relative bg-algomancy-darker border border-algomancy-purple/30 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar'>
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-algomancy-purple/30'>
            <h2 className='text-xl font-semibold text-white'>
              Legal Disclaimer
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-white transition-colors'
              aria-label='Close disclaimer'>
              <XMarkIcon className='w-6 h-6' />
            </button>
          </div>

          {/* Content */}
          <div className='p-6 space-y-4 text-gray-300'>
            <div>
              <h3 className='text-lg font-medium text-algomancy-gold mb-2'>
                Game Ownership & Copyright
              </h3>
              <p className='text-sm leading-relaxed'>
                Algomancer.cc is an independent, fan-created website and is not
                affiliated with, endorsed by, or officially connected to the
                creators or publishers of the Algomancy card game. All game
                content, including but not limited to card images, names,
                artwork, rules, and game mechanics, are the intellectual
                property of their respective owners.
              </p>
            </div>

            <div>
              <h3 className='text-lg font-medium text-algomancy-gold mb-2'>
                Fair Use & Educational Purpose
              </h3>
              <p className='text-sm leading-relaxed'>
                This website is created for educational, informational, and
                community purposes under fair use principles. We provide tools
                for deck building, card database browsing, and community
                interaction to enhance the gaming experience for Algomancy
                players.
              </p>
            </div>

            <div>
              <h3 className='text-lg font-medium text-algomancy-gold mb-2'>
                No Commercial Use
              </h3>
              <p className='text-sm leading-relaxed'>
                Algomancer.cc is a non-commercial project created by fans for
                fans. We do not sell cards, game products, or any copyrighted
                material. Any donations received are solely to cover hosting and
                development costs.
              </p>
            </div>

            <div>
              <h3 className='text-lg font-medium text-algomancy-gold mb-2'>
                Content Removal
              </h3>
              <p className='text-sm leading-relaxed'>
                If you are a copyright holder and believe that any content on
                this website infringes your rights, please contact us
                immediately and we will promptly remove the disputed content.
              </p>
            </div>

            <div>
              <h3 className='text-lg font-medium text-algomancy-gold mb-2'>
                Disclaimer of Warranties
              </h3>
              <p className='text-sm leading-relaxed'>
                This website is provided "as is" without any warranties. We make
                no guarantees about the accuracy, completeness, or reliability
                of the information provided. Use of this website is at your own
                risk.
              </p>
            </div>

            <div className='pt-4 border-t border-algomancy-purple/20'>
              <p className='text-xs text-gray-400'>
                For questions or concerns regarding this disclaimer, please
                contact us through our support channels. This disclaimer may be
                updated from time to time.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className='flex justify-end p-6 border-t border-algomancy-purple/30'>
            <button
              onClick={onClose}
              className='px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark text-white rounded transition-colors'>
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
