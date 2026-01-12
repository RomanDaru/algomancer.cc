"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LevelUpModal from "@/app/components/LevelUpModal";
import { LEVEL_UP_EVENT, LEVEL_UP_STORAGE_KEY } from "@/app/lib/constants";
import type { LevelUpPayload } from "@/app/lib/types/levelUp";

const readLevelUpPayload = () => {
  const raw = sessionStorage.getItem(LEVEL_UP_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LevelUpPayload;
  } catch {
    sessionStorage.removeItem(LEVEL_UP_STORAGE_KEY);
    return null;
  }
};

export default function LevelUpModalHost() {
  const [payload, setPayload] = useState<LevelUpPayload | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const openFromStorage = useCallback(() => {
    const next = readLevelUpPayload();
    if (!next) return;
    sessionStorage.removeItem(LEVEL_UP_STORAGE_KEY);
    setPayload(next);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    openFromStorage();
    const handleLevelUp = (event: Event) => {
      const detailPayload =
        event instanceof CustomEvent ? (event.detail as LevelUpPayload) : null;
      if (detailPayload) {
        setPayload(detailPayload);
        setIsOpen(true);
        return;
      }
      openFromStorage();
    };
    window.addEventListener(LEVEL_UP_EVENT, handleLevelUp);
    return () => {
      window.removeEventListener(LEVEL_UP_EVENT, handleLevelUp);
    };
  }, [openFromStorage]);

  useEffect(() => {
    if (!pathname) return;
    openFromStorage();
  }, [pathname, openFromStorage]);

  const handleClose = () => {
    setIsOpen(false);
    setPayload(null);
  };

  return (
    <LevelUpModal isOpen={isOpen} payload={payload} onClose={handleClose} />
  );
}
