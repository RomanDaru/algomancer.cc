"use client";

interface CardImageSkeletonProps {
  className?: string;
}

export default function CardImageSkeleton({ className = "" }: CardImageSkeletonProps) {
  return (
    <div 
      className={`relative w-full h-full bg-gradient-to-br from-algomancy-darker to-algomancy-dark animate-pulse ${className}`}
    >
      {/* Card frame outline */}
      <div className="absolute inset-2 border border-algomancy-purple/20 rounded-md">
        {/* Top section - where card name would be */}
        <div className="absolute top-3 left-3 right-3">
          <div className="h-3 bg-algomancy-purple/30 rounded animate-pulse"></div>
        </div>
        
        {/* Center section - main card art area */}
        <div className="absolute top-8 left-3 right-3 bottom-12 bg-algomancy-purple/10 rounded flex items-center justify-center">
          {/* Algomancy logo/icon placeholder */}
          <div className="w-8 h-8 bg-algomancy-purple/40 rounded-full animate-pulse"></div>
        </div>
        
        {/* Bottom section - where stats would be */}
        <div className="absolute bottom-3 left-3 right-3 space-y-1">
          <div className="h-2 bg-algomancy-purple/30 rounded animate-pulse"></div>
          <div className="h-2 bg-algomancy-purple/20 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
      
      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
    </div>
  );
}
