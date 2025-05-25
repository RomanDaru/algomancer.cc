"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TestViewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deckId, setDeckId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect to sign in if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (status === "loading") {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  const handleTestView = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deckId.trim()) {
      setError("Please enter a deck ID");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/decks/test-view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deckId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to test view count");
      }

      setResult(data);
    } catch (error) {
      console.error("Error testing view count:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-2xl font-bold text-white mb-6'>
          Test Deck View Count
        </h1>

        <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6 mb-6'>
          <p className='text-gray-300 mb-4'>
            This tool will directly increment the view count for a specific
            deck. Use this to test if the view count feature is working
            properly.
          </p>

          <form onSubmit={handleTestView} className='space-y-4'>
            <div>
              <label
                htmlFor='deckId'
                className='block text-sm font-medium text-gray-300 mb-1'>
                Deck ID
              </label>
              <input
                type='text'
                id='deckId'
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                className='w-full p-2 bg-algomancy-dark border border-algomancy-purple/30 rounded text-white'
                placeholder='Enter deck ID'
              />
            </div>

            <button
              type='submit'
              disabled={isLoading}
              className='px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark text-white rounded disabled:opacity-50'>
              {isLoading ? "Testing..." : "Test View Count"}
            </button>
          </form>
        </div>

        {error && (
          <div className='bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-white'>
            <h2 className='text-lg font-semibold mb-2'>Error</h2>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className='bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 text-white'>
            <h2 className='text-lg font-semibold mb-2'>Success</h2>
            <p>{result.message}</p>
            <p className='mt-2'>Previous views: {result.previousViews}</p>
            <p>Current views: {result.currentViews}</p>
            <pre className='mt-4 bg-black/30 p-3 rounded overflow-auto custom-scrollbar text-xs'>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
