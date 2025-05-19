"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/app/lib/types/card";
import Image from "next/image";

interface CardHoverPreviewProps {
  card: Card;
  children: React.ReactNode;
  onClick?: () => void;
}

export default function CardHoverPreview({
  card,
  children,
  onClick,
}: CardHoverPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewPosition, setPreviewPosition] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }>({ top: 0, left: 0 });

  // Calculate preview position based on container position
  const calculatePosition = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const previewHeight = 420; // Height of the preview card
    const previewWidth = 300; // Width of the preview card
    const buffer = 20; // Buffer space from window edges

    // Determine horizontal position
    let horizontalPosition: { left?: number; right?: number } = {};

    if (rect.right + previewWidth + buffer < windowWidth) {
      // Position to the right if there's enough space
      horizontalPosition = { left: rect.right + 10 };
    } else if (rect.left > previewWidth + buffer) {
      // Position to the left if there's enough space
      horizontalPosition = { right: windowWidth - rect.left + 10 };
    } else {
      // Center horizontally if there's not enough space on either side
      horizontalPosition = {
        left: Math.max(buffer, windowWidth / 2 - previewWidth / 2),
      };
    }

    // Determine vertical position
    let verticalPosition: { top?: number; bottom?: number } = {};

    // Check if there's enough space below
    if (rect.bottom + previewHeight + buffer < windowHeight) {
      // Position below the element
      verticalPosition = { top: rect.top };
    } else if (rect.top > previewHeight + buffer) {
      // Position above the element if there's enough space
      verticalPosition = { bottom: windowHeight - rect.top + 10 };
    } else {
      // Position at the top of the viewport with scrolling if needed
      verticalPosition = {
        top: Math.max(buffer, windowHeight - previewHeight - buffer),
      };
    }

    // Set the final position
    setPreviewPosition({
      ...horizontalPosition,
      ...verticalPosition,
    });
  };

  // Handle mouse enter/leave
  const handleMouseEnter = () => {
    calculatePosition();
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  // Update position on window resize or scroll
  useEffect(() => {
    if (showPreview) {
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition, true); // true for capture phase to catch all scroll events

      return () => {
        window.removeEventListener("resize", calculatePosition);
        window.removeEventListener("scroll", calculatePosition, true);
      };
    }
  }, [showPreview]);

  return (
    <div
      ref={containerRef}
      className='relative'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}>
      {children}

      {showPreview && (
        <div
          ref={previewRef}
          className='fixed z-50 w-[300px] h-[420px] rounded-lg overflow-hidden shadow-xl'
          style={{
            top:
              previewPosition.top !== undefined
                ? `${previewPosition.top}px`
                : undefined,
            bottom:
              previewPosition.bottom !== undefined
                ? `${previewPosition.bottom}px`
                : undefined,
            left:
              previewPosition.left !== undefined
                ? `${previewPosition.left}px`
                : undefined,
            right:
              previewPosition.right !== undefined
                ? `${previewPosition.right}px`
                : undefined,
          }}>
          <div className='relative w-full h-full'>
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              className='object-cover'
              sizes='300px'
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
