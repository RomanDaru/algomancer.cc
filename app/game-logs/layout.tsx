"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import LevelUpModalHost from "@/app/components/LevelUpModalHost";

interface GameLogsLayoutProps {
  children: ReactNode;
}

export default function GameLogsLayout({ children }: GameLogsLayoutProps) {
  return (
    <>
      <Toaster position='top-right' toastOptions={{ duration: 6000 }} />
      <LevelUpModalHost />
      {children}
    </>
  );
}
