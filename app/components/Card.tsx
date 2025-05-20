"use client";

import Image from "next/image";
import { Card as CardType } from "@/app/lib/types/card";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  viewMode?: "large" | "compact";
}

export default function Card({ card, onClick, viewMode = "large" }: CardProps) {
  return (
    <div
      className={`relative w-full aspect-[3/4] rounded-md overflow-hidden shadow-md cursor-pointer group transition-all duration-300 hover:z-10 ${
        viewMode === "large"
          ? "hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-algomancy-purple/70"
          : "hover:shadow-md hover:ring-1 hover:ring-algomancy-purple/50 hover:[transform:scale(1.02)]"
      }`}
      onClick={onClick}
      title={card.name}>
      {/* Card Image Only */}
      <div className='relative h-full w-full'>
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          className='object-cover'
          sizes={
            viewMode === "large"
              ? "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              : "(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, (max-width: 1280px) 12vw, 8vw"
          }
        />
      </div>
    </div>
  );
}
