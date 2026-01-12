import type { RankKey } from "@/app/lib/achievements/ranks";
import { RANKS } from "@/app/lib/achievements/ranks";

interface RankIconProps {
  rankKey: RankKey;
  size?: number;
  className?: string;
  title?: string;
}

export default function RankIcon({
  rankKey,
  size = 14,
  className = "",
  title,
}: RankIconProps) {
  const rank = RANKS.find((entry) => entry.key === rankKey) || RANKS[0];
  const iconPath = rank.iconPath;

  return (
    <span
      className={`inline-block align-middle ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
        maskImage: `url(${iconPath})`,
        WebkitMaskImage: `url(${iconPath})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
      aria-hidden={title ? undefined : true}
      title={title}
    />
  );
}

