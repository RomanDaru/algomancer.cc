"use client";

import { useState } from "react";
import {
  PlayIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { getYouTubeVideoInfo } from "@/app/lib/utils/youtube";

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
  showTitle?: boolean;
  autoplay?: boolean;
}

export default function YouTubeEmbed({
  url,
  title = "Deck Showcase Video",
  className = "",
  showTitle = true,
  autoplay = false,
}: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentThumbnailIndex, setCurrentThumbnailIndex] = useState(0);
  const [allThumbnailsFailed, setAllThumbnailsFailed] = useState(false);

  const videoInfo = getYouTubeVideoInfo(url);

  if (!videoInfo) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 text-center ${className}`}>
        <p className='text-gray-400'>Invalid YouTube URL</p>
      </div>
    );
  }

  const { videoId, embedUrl, thumbnailUrl, thumbnailUrls, watchUrl } =
    videoInfo;

  const handleLoadVideo = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  const handleThumbnailError = () => {
    if (currentThumbnailIndex < thumbnailUrls.length - 1) {
      // Try next thumbnail URL
      setCurrentThumbnailIndex(currentThumbnailIndex + 1);
    } else {
      // All thumbnails failed
      setAllThumbnailsFailed(true);
    }
  };

  // Get current thumbnail URL to try
  const currentThumbnailUrl =
    thumbnailUrls[currentThumbnailIndex] || thumbnailUrl;

  if (hasError) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 text-center ${className}`}>
        <div className='text-gray-400 mb-4'>
          <PlayIcon className='w-12 h-12 mx-auto mb-2 opacity-50' />
          <p>Video unavailable</p>
        </div>
        <a
          href={watchUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'>
          <ArrowTopRightOnSquareIcon className='w-4 h-4 mr-2' />
          Watch on YouTube
        </a>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {showTitle && (
        <div className='px-4 py-3 bg-gray-800 border-b border-gray-700'>
          <h3 className='text-white font-semibold flex items-center'>
            <PlayIcon className='w-5 h-5 mr-2 text-red-500' />
            {title}
          </h3>
        </div>
      )}

      <div className='relative aspect-video'>
        {!isLoaded ? (
          // Direct YouTube thumbnail - single click to play
          <div
            className='relative w-full h-full cursor-pointer'
            onClick={handleLoadVideo}>
            {!allThumbnailsFailed ? (
              <img
                src={currentThumbnailUrl}
                alt={title}
                className='w-full h-full object-cover rounded'
                onError={handleThumbnailError}
                loading='lazy'
              />
            ) : (
              // Fallback when all thumbnails fail to load
              <div className='w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center rounded'>
                <div className='text-center text-gray-400'>
                  <PlayIcon className='w-16 h-16 mx-auto mb-2 opacity-50' />
                  <p className='text-sm'>YouTube Video</p>
                  <p className='text-xs opacity-75'>Click to play</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Embedded iframe
          <iframe
            src={`${embedUrl}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            className='w-full h-full rounded'
            frameBorder='0'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}
