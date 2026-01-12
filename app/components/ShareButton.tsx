"use client";

import { useState } from "react";
import { ShareIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface ShareButtonProps {
  deckId: string;
  deckName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export default function ShareButton({
  deckId,
  deckName,
  size = "md",
  className = "",
  label = "Share Deck",
  showLabel = true,
}: ShareButtonProps) {
  const [loading, setLoading] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: "w-4 h-4",
      button: "px-2 py-1",
      text: "text-sm",
    },
    md: {
      icon: "w-5 h-5",
      button: "px-3 py-1.5",
      text: "text-sm",
    },
    lg: {
      icon: "w-6 h-6",
      button: "px-4 py-2",
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
        inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 text-white
        transition-all duration-200 hover:bg-white/20 hover:border-white/30
        ${config.button}
        cursor-pointer
        ${loading ? "opacity-50" : ""}
        ${className}
      `}
      title={label}
      aria-label={label}
    >
      <ShareIcon className={`${config.icon}`} />
      {showLabel && <span className={`${config.text} font-semibold`}>{label}</span>}
    </button>
  );
}
