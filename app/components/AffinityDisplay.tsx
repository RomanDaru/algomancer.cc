"use client";

import { AffinityRequirements, getNonZeroAffinityEntries, hasAffinityRequirements } from "@/app/lib/utils/affinityUtils";
import { ElementType, ELEMENTS } from "@/app/lib/utils/elements";
import ElementIcon from "./ElementIcon";

interface AffinityDisplayProps {
  affinity: AffinityRequirements;
  title?: string;
  showTitle?: boolean;
  variant?: "compact" | "detailed";
  className?: string;
}

export default function AffinityDisplay({
  affinity,
  title = "Affinity Requirements",
  showTitle = true,
  variant = "detailed",
  className = "",
}: AffinityDisplayProps) {
  // Don't render if no affinity requirements
  if (!hasAffinityRequirements(affinity)) {
    return null;
  }

  const nonZeroEntries = getNonZeroAffinityEntries(affinity);

  if (variant === "compact") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showTitle && (
          <span className="text-sm text-gray-400 mr-1">{title}:</span>
        )}
        <div className="flex items-center space-x-1">
          {nonZeroEntries.map(([element, value]) => {
            const elementType = element.charAt(0).toUpperCase() + element.slice(1) as ElementType;
            return (
              <div key={element} className="flex items-center space-x-1">
                <ElementIcon
                  element={elementType}
                  size={16}
                  showTooltip={true}
                />
                <span className="text-sm font-medium text-white">{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={className}>
      {showTitle && (
        <h4 className="text-sm font-medium text-algomancy-gold mb-3">
          {title}
        </h4>
      )}
      
      <div className="space-y-2">
        {nonZeroEntries.map(([element, value]) => {
          const elementType = element.charAt(0).toUpperCase() + element.slice(1) as ElementType;
          const elementInfo = ELEMENTS[elementType];
          
          return (
            <div
              key={element}
              className="flex justify-between items-center py-2 px-3 rounded-md"
              style={{
                background: `${elementInfo.color}20`, // 20 is hex for 12% opacity
              }}
            >
              <div className="flex items-center">
                <ElementIcon
                  element={elementType}
                  size={20}
                  showTooltip={false}
                />
                <span className="text-sm font-medium text-white ml-2 capitalize">
                  {element}
                </span>
              </div>
              <span className="text-sm font-bold text-white">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AffinityComparisonProps {
  totalAffinity: AffinityRequirements;
  peakAffinity: AffinityRequirements;
  className?: string;
}

/**
 * Component to display both total and peak affinity side by side
 */
export function AffinityComparison({
  totalAffinity,
  peakAffinity,
  className = "",
}: AffinityComparisonProps) {
  const hasTotalAffinity = hasAffinityRequirements(totalAffinity);
  const hasPeakAffinity = hasAffinityRequirements(peakAffinity);

  if (!hasTotalAffinity && !hasPeakAffinity) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {hasTotalAffinity && (
        <AffinityDisplay
          affinity={totalAffinity}
          title="Total Affinity"
          variant="detailed"
        />
      )}
      
      {hasPeakAffinity && (
        <AffinityDisplay
          affinity={peakAffinity}
          title="Peak Affinity"
          variant="detailed"
        />
      )}
    </div>
  );
}

interface AffinityBarProps {
  affinity: AffinityRequirements;
  maxValue?: number;
  className?: string;
}

/**
 * Component to display affinity as horizontal bars (useful for mana curve visualization)
 */
export function AffinityBar({
  affinity,
  maxValue,
  className = "",
}: AffinityBarProps) {
  if (!hasAffinityRequirements(affinity)) {
    return null;
  }

  const nonZeroEntries = getNonZeroAffinityEntries(affinity);
  const calculatedMaxValue = maxValue || Math.max(...nonZeroEntries.map(([_, value]) => value));

  return (
    <div className={`space-y-1 ${className}`}>
      {nonZeroEntries.map(([element, value]) => {
        const elementType = element.charAt(0).toUpperCase() + element.slice(1) as ElementType;
        const elementInfo = ELEMENTS[elementType];
        const percentage = (value / calculatedMaxValue) * 100;
        
        return (
          <div key={element} className="flex items-center space-x-2">
            <ElementIcon
              element={elementType}
              size={14}
              showTooltip={true}
            />
            <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: elementInfo.color,
                }}
              />
            </div>
            <span className="text-xs text-white font-medium w-6 text-right">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
