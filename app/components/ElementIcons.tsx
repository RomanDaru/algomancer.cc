"use client";

import { ElementType } from "@/app/lib/utils/elements";
import ElementIcon from "./ElementIcon";

interface ElementIconsProps {
  elements: ElementType[];
  size?: number;
  className?: string;
  showTooltips?: boolean;
  maxDisplay?: number;
}

export default function ElementIcons({
  elements,
  size = 20,
  className = "",
  showTooltips = false,
  maxDisplay = 5,
}: ElementIconsProps) {
  if (!elements || elements.length === 0) {
    return null;
  }

  // Limit the number of elements to display
  const displayElements = elements.slice(0, maxDisplay);
  const hasMore = elements.length > maxDisplay;

  return (
    <div className={`flex items-center ${className}`}>
      <div className='flex space-x-1'>
        {displayElements.map((element, index) => (
          <ElementIcon
            key={`${element}-${index}`}
            element={element}
            size={size}
            className=''
            showTooltip={showTooltips}
          />
        ))}
      </div>

      {hasMore && (
        <span className='ml-1 text-xs text-gray-400'>
          +{elements.length - maxDisplay}
        </span>
      )}
    </div>
  );
}
