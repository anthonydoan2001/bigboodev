/**
 * Helper functions for Komga comic reader
 */

/**
 * Get URL for a comic page image (uses Next.js proxy route)
 */
export function getBookPageUrl(bookId: string, pageNumber: number): string {
  return `/api/komga/pages/${bookId}/${pageNumber}`;
}

/**
 * Preload a page image for instant navigation
 */
export function preloadPageImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to preload image'));
    img.src = url;
  });
}

/**
 * Preload multiple page images
 */
export function preloadPageImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(url => preloadPageImage(url).catch(() => {})));
}
