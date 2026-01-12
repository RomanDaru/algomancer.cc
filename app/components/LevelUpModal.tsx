"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import RankIcon from "@/app/components/RankIcon";
import { RANKS } from "@/app/lib/achievements/ranks";
import type { LevelUpPayload } from "@/app/lib/types/levelUp";

interface LevelUpModalProps {
  isOpen: boolean;
  payload: LevelUpPayload | null;
  onClose: () => void;
}

const AUTO_CLOSE_MS = 6000;
const AUTO_CLOSE_SECONDS = Math.ceil(AUTO_CLOSE_MS / 1000);

export default function LevelUpModal({
  isOpen,
  payload,
  onClose,
}: LevelUpModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(AUTO_CLOSE_SECONDS);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(AUTO_CLOSE_SECONDS);
      return;
    }
    setSecondsRemaining(AUTO_CLOSE_SECONDS);
    const interval = window.setInterval(() => {
      setSecondsRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !payload) return null;

  const previousRank =
    RANKS.find((rank) => rank.key === payload.previousRankKey) || RANKS[0];
  const newRank =
    RANKS.find((rank) => rank.key === payload.newRankKey) || RANKS[0];

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'>
      <div
        className='absolute inset-0 bg-black/70 backdrop-blur-sm'
        onClick={onClose}
      />
      <div className='relative z-10 w-full max-w-2xl rounded-2xl p-10'>
        <button
          type='button'
          onClick={onClose}
          className='absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors'
          aria-label='Close level up modal'>
          <XMarkIcon className='h-4 w-4' />
        </button>

        <div className='flex flex-col items-center text-center'>
          <div className='relative flex h-28 w-28 items-center justify-center text-algomancy-gold'>
            <span
              className='level-up-rank-old absolute inset-0 flex items-center justify-center'
              style={{ animationDelay: "2s" }}>
              <RankIcon rankKey={previousRank.key} size={64} />
            </span>
            <span
              className='level-up-rank-new absolute inset-0 flex items-center justify-center'
              style={{ animationDelay: "2s" }}>
              <RankIcon rankKey={newRank.key} size={64} />
            </span>
          </div>
          <p className='mt-4 text-xs uppercase tracking-[0.3em] text-algomancy-purple-light'>
            Level up
          </p>
          <h2 className='mt-2 text-3xl font-semibold text-white'>
            Congratulations!
          </h2>
          <p className='mt-2 text-base text-gray-200'>
            You reached{" "}
            <span className='text-algomancy-gold font-semibold'>
              {newRank.name}
            </span>
            .
          </p>
        </div>

        <div className='mt-8 space-y-3'>
          <div className='flex items-center justify-between text-xs text-gray-400'>
            <span>{previousRank.name}</span>
            <span>{newRank.name}</span>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-white/10'>
            <div className='level-up-fill h-full w-full rounded-full bg-gradient-to-r from-algomancy-purple via-algomancy-purple-light to-algomancy-gold' />
          </div>
          <div className='flex items-center justify-between text-xs text-gray-400'>
            <span>{payload.newXp} XP</span>
            <span>Auto closes in {secondsRemaining}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
