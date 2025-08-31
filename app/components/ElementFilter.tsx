"use client";

import { useState } from "react";
import { ElementType, ELEMENTS } from "@/app/lib/utils/elements";
import ElementIcon from "./ElementIcon";

interface ElementFilterProps {
  onElementsChange: (selectedElements: ElementType[]) => void;
  className?: string;
}

export default function ElementFilter({
  onElementsChange,
  className = "",
}: ElementFilterProps) {
  const [selectedElements, setSelectedElements] = useState<ElementType[]>([]);

  // All basic elements (excluding Colorless for filtering)
  const basicElements: ElementType[] = [
    "Fire",
    "Water",
    "Earth",
    "Wood",
    "Metal",
  ];

  const toggleElement = (element: ElementType) => {
    const newSelectedElements = selectedElements.includes(element)
      ? selectedElements.filter((e) => e !== element)
      : [...selectedElements, element];

    setSelectedElements(newSelectedElements);
    onElementsChange(newSelectedElements);
  };

  const clearAllElements = () => {
    setSelectedElements([]);
    onElementsChange([]);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className='text-gray-400 text-sm'>Filter:</span>

      {basicElements.map((element) => {
        const isSelected = selectedElements.includes(element);
        const elementInfo = ELEMENTS[element];

        return (
          <button
            key={element}
            onClick={() => toggleElement(element)}
            className={`relative p-1.5 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer shrink-0 ${
              isSelected
                ? "bg-algomancy-purple/40 border border-algomancy-purple"
                : "hover:bg-algomancy-purple/20"
              }`}
            title={`${isSelected ? "Remove" : "Add"} ${element} filter`}>
            <ElementIcon element={element} size={28} showTooltip={false} />

            {/* Selection indicator */}
            {isSelected && (
              <div className='absolute -top-1 -right-1 w-3.5 h-3.5 bg-algomancy-purple rounded-full flex items-center justify-center'>
                <svg
                  className='w-2 h-2 text-white'
                  fill='currentColor'
                  viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}

      {selectedElements.length > 0 && (
        <button
          onClick={clearAllElements}
          className='text-xs text-algomancy-purple hover:text-algomancy-gold transition-colors ml-2 cursor-pointer'>
          Clear
        </button>
      )}
    </div>
  );
}
