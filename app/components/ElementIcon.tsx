"use client";

import Image from "next/image";
import { ElementType, ELEMENTS } from "@/app/lib/utils/elements";
import { useState } from "react";

interface ElementIconProps {
  element: ElementType;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

export default function ElementIcon({ 
  element, 
  size = 24, 
  className = "", 
  showTooltip = false 
}: ElementIconProps) {
  const [showTooltipState, setShowTooltipState] = useState(false);
  
  // Handle elements that might not be in our mapping
  const elementInfo = ELEMENTS[element] || ELEMENTS.Colorless;
  
  // Skip rendering for Colorless if it has no image
  if (element === 'Colorless' && !elementInfo.imageUrl) {
    return null;
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => showTooltip && setShowTooltipState(false)}
    >
      <div 
        className="rounded-full overflow-hidden"
        style={{ 
          width: size, 
          height: size,
          backgroundColor: elementInfo.color,
          border: `1px solid rgba(255, 255, 255, 0.2)`
        }}
      >
        {elementInfo.imageUrl && (
          <Image
            src={elementInfo.imageUrl}
            alt={`${element} element`}
            width={size}
            height={size}
            className="object-cover"
          />
        )}
      </div>
      
      {showTooltip && showTooltipState && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
          {element}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
