"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

/**
 * Optimized session hook that memoizes session data to prevent unnecessary re-renders
 * Use this instead of useSession() in components that might re-render frequently
 */
export function useOptimizedSession() {
  const { data: session, status } = useSession();

  // Memoize session data to prevent unnecessary re-renders
  const memoizedSession = useMemo(() => {
    if (!session) return null;
    
    return {
      user: {
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
        username: session.user?.username,
      },
    };
  }, [
    session?.user?.id,
    session?.user?.name,
    session?.user?.email,
    session?.user?.image,
    session?.user?.username,
  ]);

  // Memoize status to prevent unnecessary re-renders
  const memoizedStatus = useMemo(() => status, [status]);

  return {
    data: memoizedSession,
    status: memoizedStatus,
  };
}

/**
 * Hook for components that only need to know if user is authenticated
 * More efficient than full session data
 */
export function useAuthStatus() {
  const { status } = useSession();
  
  return useMemo(() => ({
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isUnauthenticated: status === "unauthenticated",
  }), [status]);
}
