"use client";

import { useState, useEffect } from "react";
import { ChevronUpIcon } from "@heroicons/react/24/outline";

interface ScrollToTopProps {
  showAfter?: number; // Show button after scrolling this many pixels
  className?: string;
}

export default function ScrollToTop({ 
  showAfter = 300, 
  className = "" 
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show/hide button based on scroll position
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Add scroll event listener
    window.addEventListener("scroll", toggleVisibility);

    // Clean up
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, [showAfter]);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-40 p-3 bg-algomancy-purple hover:bg-algomancy-purple/80 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl cursor-pointer group ${className}`}
      aria-label="Scroll to top"
      title="Back to top"
    >
      <ChevronUpIcon className="w-6 h-6 transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}
