/**
 * Image optimization utilities for Cloudinary URLs
 */

interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'scale' | 'crop';
  dpr?: 'auto' | number;
}

/**
 * Optimize a Cloudinary URL with performance parameters
 * @param originalUrl - The original Cloudinary URL
 * @param options - Optimization options
 * @returns Optimized Cloudinary URL
 */
export function optimizeCloudinaryUrl(
  originalUrl: string,
  options: OptimizationOptions = {}
): string {
  // Check if it's a Cloudinary URL
  if (!originalUrl || !originalUrl.includes('res.cloudinary.com')) {
    return originalUrl; // Return original if not Cloudinary
  }

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    dpr
  } = options;

  try {
    // Parse the Cloudinary URL
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v123456/path/image.jpg
    const urlParts = originalUrl.split('/upload/');
    
    if (urlParts.length !== 2) {
      return originalUrl; // Return original if URL format is unexpected
    }

    const [baseUrl, pathAndImage] = urlParts;
    
    // Build optimization parameters
    const params: string[] = [];
    
    // Format optimization (WebP/AVIF when supported, fallback to original)
    if (format === 'auto') {
      params.push('f_auto');
    } else {
      params.push(`f_${format}`);
    }
    
    // Quality optimization
    if (quality === 'auto') {
      params.push('q_auto');
    } else {
      params.push(`q_${quality}`);
    }
    
    // Width optimization
    if (width) {
      params.push(`w_${width}`);
    }
    
    // Height optimization
    if (height) {
      params.push(`h_${height}`);
    }

    // Crop mode (how to handle resizing)
    if (width || height) {
      params.push(`c_${crop}`);
    }

    // Device pixel ratio (sharpness on high-DPR screens)
    if (dpr) {
      params.push(
        dpr === 'auto' ? 'dpr_auto' : `dpr_${dpr}`
      );
    }
    
    // Combine parameters
    const paramString = params.join(',');
    
    // Reconstruct the URL with optimization parameters
    return `${baseUrl}/upload/${paramString}/${pathAndImage}`;
    
  } catch (error) {
    console.warn('Failed to optimize Cloudinary URL:', error);
    return originalUrl; // Return original URL if optimization fails
  }
}

/**
 * Preset optimization functions for common use cases
 */

/**
 * Optimize for card thumbnails in grids
 */
export function optimizeCardThumbnail(url: string): string {
  return optimizeCloudinaryUrl(url, {
    width: 500,
    quality: 'auto',
    format: 'auto',
    crop: 'fill',
    dpr: 'auto'
  });
}

/**
 * Optimize for card detail views
 */
export function optimizeCardDetail(url: string): string {
  return optimizeCloudinaryUrl(url, {
    width: 800,
    quality: 'auto',
    format: 'auto',
    crop: 'fit',
    dpr: 'auto'
  });
}

/**
 * Optimize for compact card views
 */
export function optimizeCardCompact(url: string): string {
  return optimizeCloudinaryUrl(url, {
    width: 320,
    quality: 'auto',
    format: 'auto',
    crop: 'fill',
    dpr: 'auto'
  });
}

/**
 * Optimize profile pictures
 */
export function optimizeProfilePicture(url: string, size: number = 96): string {
  return optimizeCloudinaryUrl(url, {
    width: size,
    height: size,
    quality: 'auto',
    format: 'auto',
    crop: 'fill',
    dpr: 'auto'
  });
}
