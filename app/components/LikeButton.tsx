"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";

interface LikeButtonProps {
  deckId: string;
  initialLikes?: number;
  initialLiked?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
  onLikeChange?: (liked: boolean, likes: number) => void;
}

export default function LikeButton({
  deckId,
  initialLikes = 0,
  initialLiked = false,
  size = "md",
  showCount = true,
  className = "",
  onLikeChange,
}: LikeButtonProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  // Fetch initial like status when component mounts
  // Only fetch if initialLiked is not provided (undefined)
  useEffect(() => {
    async function fetchLikeStatus() {
      if (!session?.user?.id) return;

      // 🎯 KEY FIX: Only fetch if we don't have initial data
      if (initialLiked !== undefined) {
        // We already have the like status from the parent component
        return;
      }

      try {
        const response = await fetch(`/api/decks/${deckId}/like`);
        if (response.ok) {
          const data = await response.json();
          setLiked(data.liked);
          setLikes(data.likes);
        }
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    }

    fetchLikeStatus();
  }, [deckId, session?.user?.id, initialLiked]);

  const handleLike = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to like decks");
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikes(data.likes);

        // Call the callback if provided
        onLikeChange?.(data.liked, data.likes);

        // Show success message
        toast.success(data.liked ? "Deck liked!" : "Deck unliked");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update like status");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like status");
    } finally {
      setLoading(false);
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: "w-4 h-4",
      text: "text-xs",
      button: "p-1",
    },
    md: {
      icon: "w-5 h-5",
      text: "text-sm",
      button: "p-2",
    },
    lg: {
      icon: "w-6 h-6",
      text: "text-base",
      button: "p-2",
    },
  };

  const config = sizeConfig[size];

  return (
    <button
      onClick={handleLike}
      disabled={loading || !session?.user?.id}
      className={`
        flex items-center space-x-1 rounded-md transition-all duration-200
        ${config.button}
        ${
          liked
            ? "text-red-500 hover:text-red-600"
            : "text-gray-400 hover:text-red-500"
        }
        ${
          !session?.user?.id
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-800/50 cursor-pointer"
        }
        ${loading ? "opacity-50" : ""}
        ${className}
      `}
      title={
        !session?.user?.id
          ? "Sign in to like decks"
          : liked
          ? "Unlike this deck"
          : "Like this deck"
      }>
      {liked ? (
        <HeartIconSolid className={`${config.icon} text-red-500`} />
      ) : (
        <HeartIcon className={config.icon} />
      )}
      {showCount && (
        <span className={`${config.text} font-medium`}>
          {likes.toLocaleString()}
        </span>
      )}
    </button>
  );
}
