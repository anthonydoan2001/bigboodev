'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback, memo } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete' | 'onLoad'> {
  fallback?: React.ReactNode;
  showLoadingState?: boolean;
  blurDataURL?: string;
}

// Default blur placeholder - tiny 1x1 gray pixel as base64
const DEFAULT_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Shimmer effect blur placeholder generator
function generateShimmerDataURL(w: number, h: number): string {
  const shimmer = `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

  const toBase64 = (str: string) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str);

  return `data:image/svg+xml;base64,${toBase64(shimmer)}`;
}

/**
 * OptimizedImage - Enhanced Next.js Image with blur placeholders and loading states
 *
 * Performance benefits:
 * - Blur placeholder prevents layout shift (CLS improvement)
 * - Progressive loading improves perceived performance
 * - Priority loading for above-the-fold images
 * - Automatic fallback for failed loads
 *
 * Use for:
 * - All images that need blur-up effect
 * - Card images, thumbnails, hero images
 * - Images where layout shift is a concern
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallback,
  showLoadingState = true,
  blurDataURL,
  placeholder = 'blur',
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // Use provided blur or generate shimmer effect
  const effectiveBlurDataURL = blurDataURL || DEFAULT_BLUR_DATA_URL;

  if (hasError) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <span className="text-xs text-muted-foreground">No Image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {showLoadingState && isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-xl" />
      )}
      <Image
        src={src}
        alt={alt}
        placeholder={placeholder}
        blurDataURL={effectiveBlurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        {...props}
      />
    </div>
  );
});

/**
 * Generate a shimmer placeholder for dynamic sizes
 */
export function getShimmerPlaceholder(width = 700, height = 475): string {
  return generateShimmerDataURL(width, height);
}

export default OptimizedImage;
