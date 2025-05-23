"use client";

/**
 * Footer component for Algomancer.gg
 * Provides site footer with BuyMeACoffee link and other information
 */
export default function Footer() {
  return (
    <footer className='bg-algomancy-darker border-t border-algomancy-purple/30 text-white mt-auto'>
      <div className='container mx-auto px-4 py-6'>
        <div className='flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0'>
          {/* Left side - Site info */}
          <div className='flex flex-col items-center md:items-start space-y-2'>
            <div className='text-algomancy-gold font-semibold'>
              Algomancer.gg
            </div>
            <div className='text-sm text-gray-400'>
              Your ultimate companion for the Algomancy card game
            </div>
          </div>

          {/* Right side - Support section */}
          <div className='flex flex-col md:flex-row items-center md:items-center space-y-3 md:space-y-0 md:space-x-4'>
            <div className='text-center md:text-right'>
              <p className='text-sm text-gray-300 mb-1'>
                Supporting Algomancer.gg
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
              title='Support the development of Algomancer.gg'>
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
            © {new Date().getFullYear()} Algomancer.gg. Built for the Algomancy
            community.
          </p>
        </div>
      </div>
    </footer>
  );
}
