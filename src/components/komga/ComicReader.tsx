'use client';

/**
 * ComicReader Component - Placeholder for Phase 2 Custom Reader
 * 
 * TODO: Phase 2 Implementation
 * - Replace Komga reader links with custom reader component
 * - Implement page navigation (prev/next)
 * - Add reading progress tracking
 * - Support different reading modes (single page, double page, webtoon)
 * - Add zoom controls
 * - Add keyboard shortcuts
 * - Implement bookmarking
 * 
 * Current: Links to Komga's built-in reader
 * Future: Custom reader implementation
 */

interface ComicReaderProps {
  bookId: string;
}

export function ComicReader({ bookId }: ComicReaderProps) {
  // Placeholder component - will be implemented in Phase 2
  return (
    <div className="p-4 text-center text-muted-foreground">
      <p className="text-body-sm">Custom reader coming in Phase 2</p>
      <p className="text-caption mt-2">Currently using Komga&apos;s built-in reader</p>
    </div>
  );
}
