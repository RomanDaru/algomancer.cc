"use client";

import Image from "next/image";
import { ElementType, ELEMENTS } from "@/app/lib/utils/elements";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const [tooltipPosition, setTooltipPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);
  
  // Handle elements that might not be in our mapping
  const elementInfo = ELEMENTS[element] || ELEMENTS.Colorless;
  
  // Skip rendering for Colorless if it has no image
  if (element === 'Colorless' && !elementInfo.imageUrl) {
    return null;
  }

  useEffect(() => {
    if (!showTooltip || !showTooltipState || !iconRef.current) {
      return;
    }

    const updateTooltipPosition = () => {
      if (!iconRef.current) {
        return;
      }

      const rect = iconRef.current.getBoundingClientRect();
      setTooltipPosition({
        left: rect.left + rect.width / 2,
        top: rect.top - 8,
      });
    };

    updateTooltipPosition();

    window.addEventListener("scroll", updateTooltipPosition, true);
    window.addEventListener("resize", updateTooltipPosition);

    return () => {
      window.removeEventListener("scroll", updateTooltipPosition, true);
      window.removeEventListener("resize", updateTooltipPosition);
    };
  }, [showTooltip, showTooltipState]);

  return (
    <div 
      ref={iconRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => {
        setShowTooltipState(false);
        setTooltipPosition(null);
      }}
    >
      <div 
        className="rounded-full overflow-hidden"
        style={{ 
          width: size, 
          height: size
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
      
      {showTooltip &&
        showTooltipState &&
        tooltipPosition &&
        createPortal(
          <div
            className="pointer-events-none fixed px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-[9999]"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              transform: "translate(-50%, -100%)",
            }}
          >
            {element}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>,
          document.body
        )
      }
    </div>
  );
}
