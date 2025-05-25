"use client";

import Image from "next/image";
import { useState } from "react";
import { Card as CardType } from "@/app/lib/types/card";
import CardImageSkeleton from "./CardImageSkeleton";
import ElementIcon from "./ElementIcon";
import { ElementType } from "@/app/lib/utils/elements";
import {
  optimizeCardThumbnail,
  optimizeCardCompact,
} from "@/app/lib/utils/imageOptimization";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  viewMode?: "large" | "compact" | "list";
}

export default function Card({ card, onClick, viewMode = "large" }: CardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Optimize image URL based on view mode
  const optimizedImageUrl =
    viewMode === "large" || viewMode === "list"
      ? optimizeCardThumbnail(card.imageUrl)
      : optimizeCardCompact(card.imageUrl);

  // List view layout
  if (viewMode === "list") {
    // Parse element type for hybrid cards
    const elementType = card.element.type;
    const isHybrid = elementType.includes("/");
    const elements = isHybrid
      ? elementType.split("/").map((e) => e.trim() as ElementType)
      : [elementType as ElementType];

    return (
      <div
        className='flex items-center justify-between py-2 px-3 border border-algomancy-purple/30 hover:border-algomancy-purple hover:bg-algomancy-purple/10 rounded-lg cursor-pointer transition-colors'
        onClick={onClick}>
        <div className='flex items-center space-x-2'>
          {/* Element Indicator(s) - Handle both single and hybrid elements */}
          <div className='flex items-center'>
            {elements.map((element, index) => (
              <ElementIcon
                key={`${element}-${index}`}
                element={element}
                size={16}
                showTooltip={false}
                className={index > 0 ? "-ml-1" : ""}
              />
            ))}
          </div>

          {/* Mana Cost */}
          <span className='text-sm text-algomancy-gold font-medium min-w-[20px]'>
            {card.manaCost}
          </span>

          {/* Card Name */}
          <span className='text-sm text-white truncate'>{card.name}</span>
        </div>
      </div>
    );
  }

  // Grid view layout (large and compact)
  return (
    <div
      className={`relative w-full aspect-[3/4] rounded-md overflow-hidden shadow-md cursor-pointer group transition-all duration-300 hover:z-10 ${
        viewMode === "large"
          ? "hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-algomancy-purple/70"
          : "hover:shadow-md hover:ring-1 hover:ring-algomancy-purple/50 hover:[transform:scale(1.02)]"
      }`}
      onClick={onClick}
      title={card.name}>
      {/* Card Image with Loading State */}
      <div className='relative h-full w-full'>
        {/* Show skeleton while loading */}
        {!imageLoaded && !imageError && (
          <CardImageSkeleton className='absolute inset-0' />
        )}

        {/* Show error state if image fails to load */}
        {imageError && (
          <div className='absolute inset-0 bg-algomancy-darker flex items-center justify-center'>
            <div className='text-center text-gray-400'>
              <div className='text-2xl mb-2'>🃏</div>
              <div className='text-xs'>Image unavailable</div>
            </div>
          </div>
        )}

        {/* Actual image */}
        <Image
          src={optimizedImageUrl}
          alt={card.name}
          fill
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          sizes={
            viewMode === "large"
              ? "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              : "(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, (max-width: 1280px) 12vw, 8vw"
          }
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </div>
    </div>
  );
}
