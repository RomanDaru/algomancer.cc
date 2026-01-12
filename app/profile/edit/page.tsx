"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import { validateUsername } from "@/app/lib/utils/validation";

export default function EditProfile() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [includePrivateLogsInCommunityStats, setIncludePrivateLogsInCommunityStats] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Load user data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");

      // Access username safely
      const username =
        session.user.username !== undefined ? session.user.username : "";
      setUsername(username);
      setIncludePrivateLogsInCommunityStats(
        session.user.includePrivateLogsInCommunityStats ?? false
      );
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        const message = usernameValidation.error || "Invalid username";
        setUsernameError(message);
        throw new Error(message);
      }

      // Call API to update user profile
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username,
          includePrivateLogsInCommunityStats,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const updatedUser = await response.json();

      // Update the session
      try {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatedUser.name,
            username: updatedUser.username,
            includePrivateLogsInCommunityStats:
              updatedUser.includePrivateLogsInCommunityStats ?? false,
          },
        });
        console.log("Session updated successfully");
      } catch (sessionError) {
        console.error("Error updating session:", sessionError);
        // Continue even if session update fails - the database was updated
      }

      toast.success("Profile updated successfully");

      // Redirect back to profile page
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const normalized = value.replace(/\s+/g, "");
    setUsername(normalized);
    if (usernameError) {
      const validation = validateUsername(normalized);
      if (validation.isValid) {
        setUsernameError("");
      }
    }
  };

  if (status === "loading") {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <Toaster position='top-right' />
      <div className='max-w-md mx-auto'>
        <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg overflow-hidden'>
          <div className='p-6'>
            <div className='flex justify-between items-center mb-6'>
              <h1 className='text-xl font-bold text-white'>Edit Profile</h1>
              <Link
                href='/profile'
                className='text-sm text-algomancy-purple hover:text-algomancy-gold'>
                Back to Profile
              </Link>
            </div>

            {error && (
              <div className='bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-white'>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='bg-algomancy-purple/10 border border-algomancy-purple/30 rounded-lg p-4'>
                <label
                  htmlFor='username'
                  className='block text-sm font-medium text-algomancy-gold mb-1'>
                  Username (Public)
                </label>
                <div className='flex'>
                  <span className='inline-flex items-center px-3 rounded-l-md border border-r-0 border-algomancy-purple/30 bg-algomancy-dark text-gray-400'>
                    @
                  </span>
                  <input
                    id='username'
                    type='text'
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    autoComplete='username'
                    autoCapitalize='none'
                    autoCorrect='off'
                    spellCheck={false}
                    className={`w-full p-2 bg-algomancy-dark border rounded-r text-white ${
                      usernameError
                        ? "border-red-500"
                        : "border-algomancy-purple/30"
                    }`}
                    placeholder='Choose a username'
                  />
                </div>
                {usernameError && (
                  <p className='text-xs text-red-400 mt-1'>
                    {usernameError}
                  </p>
                )}
                <p className='text-xs text-gray-300 mt-2'>
                  Your username will be displayed publicly on your profile and
                  decks. It should be unique and recognizable.
                </p>
                {!username && (
                  <p className='text-xs text-yellow-500 mt-1'>
                    Setting a username is recommended for community interaction.
                  </p>
                )}
              </div>

              <div className='mt-4'>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-300 mb-1'>
                  Real Name (Private)
                </label>
                <input
                  id='name'
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete='name'
                  autoCapitalize='words'
                  className='w-full p-2 bg-algomancy-dark border border-algomancy-purple/30 rounded text-white'
                  placeholder='Your real name'
                  required
                />
                <p className='text-xs text-gray-400 mt-1'>
                  Your real name is only used for account purposes and is not
                  displayed publicly.
                </p>
              </div>

              <div className='rounded-lg border border-white/10 bg-black/30 p-4'>
                <label className='flex items-start gap-3 text-sm text-gray-200'>
                  <input
                    type='checkbox'
                    checked={includePrivateLogsInCommunityStats}
                    onChange={(e) =>
                      setIncludePrivateLogsInCommunityStats(e.target.checked)
                    }
                    className='mt-1 h-4 w-4 accent-algomancy-gold'
                  />
                  <span>
                    Include my private logs in anonymous community stats.
                  </span>
                </label>
                <p className='text-xs text-gray-400 mt-2'>
                  This only affects aggregated stats and never exposes your
                  private logs directly.
                </p>
              </div>

              <div className='pt-4'>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark text-white rounded disabled:opacity-50'>
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
