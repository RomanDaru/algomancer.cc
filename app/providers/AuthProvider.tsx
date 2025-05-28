"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      // Reduce session refetch frequency to prevent excessive API calls
      refetchInterval={5 * 60} // Refetch every 5 minutes instead of default (4 minutes)
      refetchOnWindowFocus={false} // Don't refetch when window gains focus
      refetchWhenOffline={false} // Don't refetch when coming back online
    >
      {children}
    </SessionProvider>
  );
}
