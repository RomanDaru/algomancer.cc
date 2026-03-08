"use client";

import { useState } from "react";
import { LinkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function GameLogShareButton() {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Log link copied to clipboard!");
    } catch (error) {
      console.error("Error sharing game log:", error);

      try {
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast.success("Log link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link. Please copy the URL manually.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type='button'
      onClick={handleShare}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20 hover:border-white/30 ${
        loading ? "opacity-50" : ""
      }`}
      title='Copy Link'
      aria-label='Copy Link'>
      <LinkIcon className='h-5 w-5' />
      <span className='font-semibold'>Copy Link</span>
    </button>
  );
}
