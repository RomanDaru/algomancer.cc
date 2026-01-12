"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
  session?: any;
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider
      session={session}
      // Disable periodic polling; session is fetched on mount only.
      // Re-enable refetchInterval if we need auto refresh.
      refetchInterval={0}
      refetchOnWindowFocus={false} // Don't refetch when window gains focus
      refetchWhenOffline={false} // Don't refetch when coming back online
    >
      {children}
    </SessionProvider>
  );
}
