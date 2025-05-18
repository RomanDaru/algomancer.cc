import Link from "next/link";

export default function Navbar() {
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
          <div className='flex space-x-4'>
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
        </div>
      </div>
    </nav>
  );
}
