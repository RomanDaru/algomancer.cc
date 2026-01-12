import RankIcon from "@/app/components/RankIcon";
import { getRankForXp } from "@/app/lib/achievements/ranks";

interface UserNameWithRankProps {
  name?: string | null;
  username?: string | null;
  achievementXp?: number;
  className?: string;
  iconClassName?: string;
  iconSize?: number;
  showAt?: boolean;
}

export default function UserNameWithRank({
  name,
  username,
  achievementXp,
  className = "",
  iconClassName = "text-algomancy-gold",
  iconSize = 14,
  showAt = true,
}: UserNameWithRankProps) {
  const label = username
    ? `${showAt ? "@" : ""}${username}`
    : name || "Unknown User";
  const hasXp = typeof achievementXp === "number";
  const rank = hasXp ? getRankForXp(achievementXp || 0) : null;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {rank && (
        <RankIcon
          rankKey={rank.key}
          size={iconSize}
          className={iconClassName}
          title={`${rank.name} (${achievementXp} XP)`}
        />
      )}
      <span>{label}</span>
    </span>
  );
}

