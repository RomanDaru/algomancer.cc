"use client";

import { Deck } from "@/app/lib/types/user";
import { Card } from "@/app/lib/types/card";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { PlayIcon } from "@heroicons/react/24/solid";
import ElementIcons from "./ElementIcons";
import LikeButton from "./LikeButton";
import DeckBadge from "./DeckBadge";
import {
  ElementType,
  generateElementGradient,
  getAllDeckElements,
} from "@/app/lib/utils/elements";
import UserNameWithRank from "./UserNameWithRank";

interface DeckCardProps {
  deck: Deck;
  user: {
    name: string;
    username: string | null;
    achievementXp?: number;
  };
  cards?: Card[];
  deckElements?: string[];
  className?: string;
  isLikedByCurrentUser?: boolean;
  onLikeChange?: (liked: boolean, likes: number) => void;
}

export default function DeckCard({
  deck,
  user,
  cards,
  deckElements: serverDeckElements,
  className = "",
  isLikedByCurrentUser,
  onLikeChange,
}: DeckCardProps) {
  const deckBadges = deck.deckBadges || [];
  const visibleBadges = deckBadges.slice(0, 2);
  const hiddenBadgeCount = Math.max(
    deckBadges.length - visibleBadges.length,
    0,
  );

  const totalCards =
    typeof deck.totalCards === "number"
      ? deck.totalCards
      : deck.cards?.reduce((sum, card) => sum + card.quantity, 0) || 0;

  let deckElements: ElementType[] = ["Colorless"];

  if (serverDeckElements && serverDeckElements.length > 0) {
    deckElements = serverDeckElements as ElementType[];
  } else if (deck.deckElements && deck.deckElements.length > 0) {
    deckElements = deck.deckElements as ElementType[];
  } else if (cards && cards.length > 0 && deck.cards.length > 0) {
    const cardsWithQuantities = deck.cards
      .map((deckCard) => {
        const card = cards.find((c) => c.id === deckCard.cardId);
        return {
          card,
          quantity: deckCard.quantity,
        };
      })
      .filter((item) => item.card !== undefined) as {
      card: Card;
      quantity: number;
    }[];

    if (cardsWithQuantities.length > 0) {
      deckElements = getAllDeckElements(cardsWithQuantities);
    }
  } else {
    const idSum = deck._id
      .toString()
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    const allElements: ElementType[] = [
      "Fire",
      "Water",
      "Earth",
      "Wood",
      "Metal",
    ];

    const deckName = deck.name.toLowerCase();
    if (deckName.includes("fire")) {
      deckElements = ["Fire"];
    } else if (deckName.includes("water")) {
      deckElements = ["Water"];
    } else if (deckName.includes("earth")) {
      deckElements = ["Earth"];
    } else if (deckName.includes("wood") || deckName.includes("forest")) {
      deckElements = ["Wood"];
    } else if (deckName.includes("metal")) {
      deckElements = ["Metal"];
    } else {
      const primaryElementIndex = idSum % allElements.length;
      deckElements = [allElements[primaryElementIndex]];

      if (idSum % 2 === 0) {
        const secondaryElementIndex = (idSum + 1) % allElements.length;
        if (secondaryElementIndex !== primaryElementIndex) {
          deckElements.push(allElements[secondaryElementIndex]);
        }
      }
    }
  }

  const gradientStyle = {
    background: generateElementGradient(deckElements, "135deg", false),
  };

  return (
    <Link
      href={`/decks/${deck._id.toString()}`}
      className={`block h-full ${className}`}>
      <div className='group relative flex h-48 flex-col overflow-hidden rounded-lg border border-algomancy-purple/30 bg-algomancy-darker transition-colors hover:border-algomancy-purple'>
        <div
          className='absolute inset-0 opacity-30 transition-opacity group-hover:opacity-40'
          style={gradientStyle}
        />

        <div className='relative z-10 flex h-full flex-col p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <h2 className='h-8 line-clamp-2 text-lg font-medium leading-5 text-white'>
                {deck.name}
              </h2>

              <div className='mt-0.5 flex h-5 items-center gap-1.5 overflow-hidden'>
                {visibleBadges.map((badge) => (
                  <DeckBadge
                    key={badge}
                    badge={badge}
                    className='shrink-0 scale-[0.92] origin-left'
                  />
                ))}
                {hiddenBadgeCount > 0 && (
                  <span className='inline-flex h-5 shrink-0 items-center rounded-md border border-white/15 px-1.5 text-[10px] font-semibold text-white/70'>
                    +{hiddenBadgeCount}
                  </span>
                )}
              </div>
            </div>

            <div className='ml-2 shrink-0 pt-0.5'>
              <ElementIcons
                elements={deckElements}
                size={18}
                showTooltips={true}
              />
            </div>
          </div>

          <div className='mt-auto pt-3'>
            <div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[13px]'>
              <div className='flex min-w-0 items-center gap-3 text-white/85'>
                <span className='shrink-0 text-white'>{totalCards} cards</span>
                <span
                  className='flex shrink-0 items-center text-white/80'
                  title={`${deck.views || 0} views`}>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='mr-1 h-3.5 w-3.5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                  {typeof deck.views === "number" ? deck.views : 0}
                </span>
                <div className='shrink-0' onClick={(e) => e.preventDefault()}>
                  <LikeButton
                    deckId={deck._id.toString()}
                    initialLikes={deck.likes || 0}
                    initialLiked={isLikedByCurrentUser}
                    size='sm'
                    showCount={true}
                    onLikeChange={onLikeChange}
                  />
                </div>
              </div>

              <span className='shrink-0 text-[11px] text-white/70 sm:text-xs'>
                {formatDistanceToNow(new Date(deck.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <div className='mt-2 flex items-center justify-between gap-3 text-[13px]'>
              <div className='flex min-w-0 items-center'>
                <span className='shrink-0 text-white/80'>By </span>
                <UserNameWithRank
                  name={user.name}
                  username={user.username}
                  achievementXp={user.achievementXp}
                  truncate={true}
                  className={`ml-1 min-w-0 ${
                    user.username ? "text-white" : "text-white/80"
                  }`}
                  iconClassName='text-algomancy-gold'
                  iconSize={12}
                />
              </div>

              <div className='flex h-4 w-4 shrink-0 items-center justify-center'>
                {deck.youtubeUrl && (
                  <div
                    className='rounded-full bg-red-600 p-0.5 shadow-sm'
                    title='Has video showcase'>
                    <PlayIcon className='h-2.5 w-2.5 text-white' />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
