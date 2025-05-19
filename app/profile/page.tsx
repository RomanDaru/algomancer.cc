"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-algomancy-darker border border-algomancy-purple/30 rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 sm:p-8 border-b border-algomancy-purple/30">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-algomancy-purple flex items-center justify-center">
                {session.user?.image ? (
                  <Image 
                    src={session.user.image} 
                    alt={session.user.name || "User"} 
                    width={96} 
                    height={96} 
                  />
                ) : (
                  <span className="text-white text-3xl">
                    {session.user?.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white">{session.user.name}</h1>
                <p className="text-gray-400">{session.user.email}</p>
                <div className="mt-4">
                  <Link 
                    href="/profile/edit" 
                    className="px-4 py-2 text-sm rounded-md bg-algomancy-dark border border-algomancy-purple/30 hover:bg-algomancy-purple/20"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* My Decks Section */}
              <div className="bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">My Decks</h2>
                <div className="space-y-4">
                  {/* This will be populated with actual decks later */}
                  <div className="text-gray-400 text-center py-8">
                    <p>You haven't created any decks yet.</p>
                    <Link 
                      href="/decks/create" 
                      className="mt-4 inline-block px-4 py-2 text-sm rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark"
                    >
                      Create Your First Deck
                    </Link>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-algomancy-darker border border-algomancy-purple/10 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm">Decks Created</p>
                    <p className="text-2xl font-bold text-algomancy-gold">0</p>
                  </div>
                  <div className="bg-algomancy-darker border border-algomancy-purple/10 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm">Favorite Cards</p>
                    <p className="text-2xl font-bold text-algomancy-gold">0</p>
                  </div>
                  <div className="bg-algomancy-darker border border-algomancy-purple/10 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm">Account Age</p>
                    <p className="text-2xl font-bold text-algomancy-gold">New</p>
                  </div>
                  <div className="bg-algomancy-darker border border-algomancy-purple/10 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm">Last Login</p>
                    <p className="text-2xl font-bold text-algomancy-gold">Today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
