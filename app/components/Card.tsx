"use client";

import Image from "next/image";
import { Card as CardType } from "@/app/lib/types/card";

interface CardProps {
  card: CardType;
  onClick?: () => void;
}

export default function Card({ card, onClick }: CardProps) {
  return (
    <div
      className='relative w-full aspect-[3/4] rounded-md overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow'
      onClick={onClick}>
      {/* Card Image Only */}
      <div className='relative h-full w-full'>
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          className='object-cover'
          sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw'
        />
      </div>
    </div>
  );
}
