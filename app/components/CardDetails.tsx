import Image from "next/image";
import { Card as CardType } from "@/app/lib/types/card";

interface CardDetailsProps {
  card: CardType;
  onClose?: () => void;
}

export default function CardDetails({ card, onClose }: CardDetailsProps) {
  return (
    <div className='flex flex-col md:flex-row gap-6'>
      {/* Close button */}
      {onClose && (
        <button
          className='absolute top-4 right-4 text-gray-400 hover:text-white bg-algomancy-purple/20 hover:bg-algomancy-purple/40 rounded-full p-2 transition-colors z-10'
          onClick={onClose}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
          <span className='sr-only'>Close</span>
        </button>
      )}

      {/* Card Image */}
      <div className='relative w-full md:w-1/2 aspect-[2/3]'>
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          className='object-cover rounded-lg'
          sizes='(max-width: 768px) 100vw, 50vw'
        />
      </div>

      {/* Card Details */}
      <div className='w-full md:w-1/2'>
        <h2 className='text-2xl font-bold text-algomancy-gold mb-2'>
          {card.name}
        </h2>

        <div className='grid grid-cols-2 gap-4 mt-4'>
          <div>
            <h3 className='font-semibold text-algomancy-blue-light'>
              Mana Cost
            </h3>
            <p className='text-white'>{card.manaCost}</p>
          </div>
          <div>
            <h3 className='font-semibold text-algomancy-blue-light'>Element</h3>
            <p>{card.element.type}</p>
          </div>
        </div>

        <div className='mt-4 grid grid-cols-2 gap-4'>
          <div>
            <h3 className='font-semibold text-algomancy-blue-light'>Type</h3>
            <p>
              {card.typeAndAttributes.subType} {card.typeAndAttributes.mainType}
            </p>
          </div>
          <div>
            <h3 className='font-semibold text-algomancy-blue-light'>Stats</h3>
            <p>
              Power: {card.stats.power} / Defense: {card.stats.defense}
            </p>
          </div>
          <div>
            <h3 className='font-semibold text-algomancy-blue-light'>Timing</h3>
            <p>{card.timing.type}</p>
          </div>
        </div>

        <div className='mt-4'>
          <h3 className='font-semibold text-algomancy-blue-light'>Abilities</h3>
          <ul className='list-disc pl-5'>
            {card.abilities.map((ability, index) => (
              <li key={index}>{ability}</li>
            ))}
          </ul>
        </div>

        {card.flavorText && (
          <div className='mt-4'>
            <h3 className='font-semibold text-algomancy-blue-light'>
              Flavor Text
            </h3>
            <p className='italic text-algomancy-gold-light'>
              {card.flavorText}
            </p>
          </div>
        )}

        <div className='mt-4'>
          <h3 className='font-semibold text-algomancy-blue-light'>Set</h3>
          <p>
            {card.set.name} ({card.set.complexity})
          </p>
        </div>
      </div>
    </div>
  );
}
