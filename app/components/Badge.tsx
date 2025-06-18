import { Badge as BadgeType } from "@/app/lib/types/user";
import { BADGE_TYPE } from "@/app/lib/constants";

interface BadgeProps {
  badge: BadgeType;
  size?: "small" | "medium" | "large";
  showDescription?: boolean;
}

export default function Badge({
  badge,
  size = "medium",
  showDescription = false,
}: BadgeProps) {
  const sizeClasses = {
    small: "px-2 py-1 text-xs",
    medium: "px-3 py-2 text-sm",
    large: "px-4 py-3 text-base",
  };

  const iconSizes = {
    small: "text-sm",
    medium: "text-lg",
    large: "text-xl",
  };

  return (
    <div className='inline-flex flex-col items-center'>
      <div
        className={`inline-flex items-center rounded-full font-medium transition-all duration-200 hover:scale-105 ${sizeClasses[size]}`}
        style={{
          backgroundColor: badge.color + "20",
          border: `1px solid ${badge.color}`,
          color: badge.color,
        }}
        title={badge.description}>
        <span className={`mr-1 ${iconSizes[size]}`}>{badge.icon}</span>
        <span className='font-semibold'>{badge.title}</span>
      </div>

      {showDescription && (
        <div className='text-xs text-gray-400 mt-1 text-center max-w-32'>
          {badge.description}
        </div>
      )}
    </div>
  );
}

// Predefined badge configurations
export const BADGE_CONFIGS = {
  [BADGE_TYPE.BEST_CONSTRUCTED_MONTHLY]: {
    icon: "🏗️",
    color: "#F59E0B", // amber-500
    getTitle: (month: string) => `Best Constructed ${month}`,
    getDescription: (month: string) =>
      `Winner of the best constructed deck competition in ${month}`,
  },
  [BADGE_TYPE.BEST_DRAFT_MONTHLY]: {
    icon: "🎲",
    color: "#3B82F6", // blue-500
    getTitle: (month: string) => `Best Draft ${month}`,
    getDescription: (month: string) =>
      `Winner of the best draft deck competition in ${month}`,
  },
  [BADGE_TYPE.HALL_OF_FAME]: {
    icon: "👑",
    color: "#EF4444", // red-500
    getTitle: () => "Hall of Fame",
    getDescription: () =>
      "Inducted into the Algomancy Hall of Fame for exceptional achievements",
  },
} as const;
