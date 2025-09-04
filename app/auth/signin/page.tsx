"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GuestDeckMigration } from "@/app/lib/utils/guestDeckMigration";

function SignInInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = useMemo(() => {
    const cb = searchParams?.get("callbackUrl") || searchParams?.get("returnTo");
    // Fallback to homepage
    return cb && cb.length > 0 ? cb : "/";
  }, [searchParams]);

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      // Check if there's a guest deck before signing in
      const hasGuestDeck = GuestDeckMigration.hasGuestDeckToMigrate();

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      // If there was a guest deck, migrate it and redirect to the saved deck
      if (hasGuestDeck) {
        try {
          const migrationResult = await GuestDeckMigration.migrateGuestDeck();
          if (migrationResult.success && migrationResult.deckId) {
            router.push(`/decks/${migrationResult.deckId}`);
            return;
          }
        } catch (migrationError) {
          console.error("Failed to migrate guest deck:", migrationError);
          // Fall back to default redirect if migration fails
        }
      }

      router.push(callbackUrl || "/");
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [email, password, router]);

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
      <div className='w-full max-w-md p-8 space-y-8 bg-algomancy-darker border border-algomancy-purple/30 rounded-lg'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-white'>Sign In</h1>
          <p className='mt-2 text-gray-400'>Welcome back to Algomancer</p>
        </div>

        <div className='mt-8 space-y-6'>
          {error && (
            <div className='p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md'>
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-300'>
              Email
            </label>
            <input
              id='email'
              name='email'
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='mt-1 block w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-algomancy-purple focus:border-algomancy-purple'
              placeholder='your@email.com'
            />
          </div>

          <div>
            <div className='flex justify-between items-center'>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-300'>
                Password
              </label>
              <Link
                href='/auth/forgot-password'
                className='text-sm text-algomancy-purple hover:text-algomancy-purple-light'>
                Forgot password?
              </Link>
            </div>
            <input
              id='password'
              name='password'
              type='password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='mt-1 block w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-algomancy-purple focus:border-algomancy-purple'
              placeholder='••••••••'
            />
          </div>

          <div>
            <button
              onClick={login}
              disabled={isLoading}
              className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-algomancy-purple hover:bg-algomancy-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-algomancy-purple disabled:opacity-50 disabled:cursor-not-allowed'>
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <div className='flex items-center justify-center'>
            <div className='text-sm'>
              <span className='text-gray-400'>Don't have an account?</span>{" "}
              <Link
                href='/auth/signup'
                className='font-medium text-algomancy-purple hover:text-algomancy-purple-light'>
                Sign up
              </Link>
            </div>
          </div>

          <div className='mt-6'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-700'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-algomancy-darker text-gray-400'>
                  Or continue with
                </span>
              </div>
            </div>

            <div className='mt-6'>
              <button
                onClick={() => {
                  // For Google sign-in, we'll handle migration in the callback
                  // Set a flag in localStorage to indicate we should check for migration
                  if (GuestDeckMigration.hasGuestDeckToMigrate()) {
                    localStorage.setItem(
                      "algomancer_pending_migration",
                      "true"
                    );
                  }
                  const returnTo = callbackUrl && callbackUrl !== "/" ? `?returnTo=${encodeURIComponent(callbackUrl)}` : "";
                  signIn("google", { callbackUrl: `/auth/callback${returnTo}` });
                }}
                className='w-full flex justify-center py-2 px-4 border border-algomancy-purple/30 rounded-md shadow-sm text-sm font-medium text-white bg-algomancy-dark hover:bg-algomancy-dark/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-algomancy-purple'>
                <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
                  <path
                    fill='currentColor'
                    d='M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z'
                  />
                </svg>
                Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple mx-auto mb-4'></div>
            <p className='text-white text-lg'>Loading…</p>
          </div>
        </div>
      }>
      <SignInInner />
    </Suspense>
  );
}
