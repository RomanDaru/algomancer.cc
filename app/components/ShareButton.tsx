"use client";

import { useState } from "react";
import { ShareIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface ShareButtonProps {
  deckId: string;
  deckName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ShareButton({
  deckId,
  deckName,
  size = "md",
  className = "",
}: ShareButtonProps) {
  const [loading, setLoading] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: "w-4 h-4",
      button: "p-1",
      text: "text-xs",
    },
    md: {
      icon: "w-5 h-5",
      button: "p-2",
      text: "text-sm",
    },
    lg: {
      icon: "w-6 h-6",
      button: "p-3",
      text: "text-base",
    },
  };

  const config = sizeConfig[size];

  const handleShare = async () => {
    if (loading) return;

    setLoading(true);
    try {
      // Get current page URL
      const currentUrl = window.location.href;
      
      // Try to use the Web Share API if available (mobile devices)
      if (navigator.share && navigator.canShare) {
        try {
          await navigator.share({
            title: deckName ? `${deckName} - Algomancer.cc` : "Deck - Algomancer.cc",
            text: deckName ? `Check out this ${deckName} deck on Algomancer.cc!` : "Check out this deck on Algomancer.cc!",
            url: currentUrl,
          });
          toast.success("Deck shared successfully!");
          return;
        } catch (shareError) {
          // If user cancels share dialog, don't show error
          if ((shareError as Error).name === "AbortError") {
            return;
          }
          // Fall back to clipboard copy
        }
      }

      // Fallback to clipboard copy
      await navigator.clipboard.writeText(currentUrl);
      toast.success("Deck link copied to clipboard!");
    } catch (error) {
      console.error("Error sharing deck:", error);
      
      // Final fallback - try to select and copy using older method
      try {
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast.success("Deck link copied to clipboard!");
      } catch (fallbackError) {
        toast.error("Failed to copy link. Please copy the URL manually.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className={`
        flex items-center space-x-1 rounded-md transition-all duration-200
        ${config.button}
        text-gray-400 hover:text-algomancy-purple hover:bg-gray-800/50 cursor-pointer
        ${loading ? "opacity-50" : ""}
        ${className}
      `}
      title="Share this deck"
      aria-label="Share this deck"
    >
      <ShareIcon className={`${config.icon}`} />
    </button>
  );
}
