"use client";

import { DeckReviewFlag } from "@/app/lib/types/user";

interface DeckReviewNoticeProps {
  reviewFlags?: DeckReviewFlag[];
  isOwner?: boolean;
  compact?: boolean;
  className?: string;
}

function formatFlagSummary(reviewFlags: DeckReviewFlag[]) {
  if (reviewFlags.length === 0) {
    return "This deck contains cards that changed after the last review.";
  }

  const cardNames = reviewFlags.map((flag) => flag.cardName).filter(Boolean);
  if (cardNames.length === 0) {
    return "This deck contains cards that changed after the last review.";
  }

  return `Changed cards: ${cardNames.join(", ")}`;
}

export default function DeckReviewNotice({
  reviewFlags = [],
  isOwner = false,
  compact = false,
  className = "",
}: DeckReviewNoticeProps) {
  if (compact) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200 ${className}`}
        title={formatFlagSummary(reviewFlags)}>
        Needs review
      </span>
    );
  }

  const summary = formatFlagSummary(reviewFlags);

  return (
    <div
      className={`rounded-lg border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100 ${className}`}>
      <p className='font-medium'>
        {isOwner
          ? "This deck needs review after a card update."
          : "This deck contains cards updated after the last owner review."}
      </p>
      <p className='mt-2 text-amber-100/80'>{summary}</p>
      {isOwner && (
        <p className='mt-2 text-amber-100/80'>
          Open the deck editor, verify the changed cards, and save the deck to
          clear this warning.
        </p>
      )}
    </div>
  );
}
