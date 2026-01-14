"use client";

import { DeckBadge as DeckBadgeType } from "@/app/lib/constants";

const BADGE_STYLES: Record<DeckBadgeType, string> = {
  Casual: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
  Competitive: "bg-red-500/20 text-red-200 border-red-400/40",
  Fun: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40",
  Aggro: "bg-orange-500/20 text-orange-200 border-orange-400/40",
  Midrange: "bg-amber-500/20 text-amber-200 border-amber-400/40",
  Control: "bg-blue-500/20 text-blue-200 border-blue-400/40",
  Combo: "bg-cyan-500/20 text-cyan-200 border-cyan-400/40",
};

interface DeckBadgeProps {
  badge: DeckBadgeType;
  className?: string;
}

export default function DeckBadge({ badge, className = "" }: DeckBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${BADGE_STYLES[badge]} ${className}`}>
      {badge}
    </span>
  );
}
