'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ReadingMode } from '@/lib/reader-settings';
import { ContinuousViewer } from './ContinuousViewer';

interface PageViewerProps {
  bookId: string;
  pageNumber: number;
  readingMode: ReadingMode;
  zoom: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onScrolledToPosition?: () => void;
  onRetry?: () => void;
}

export function PageViewer({ 
  bookId, 
  pageNumber, 
  readingMode, 
  zoom, 
  totalPages,
  onPageChange,
  onScrolledToPosition,
  onRetry 
}: PageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const pageUrl = `/api/komga/pages/${bookId}/${pageNumber}`;

  const isContinuous = readingMode.startsWith('continuous');

  // Reset loading state when page number changes (only for paged mode)
  useEffect(() => {
    if (!isContinuous) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [pageNumber, bookId, isContinuous]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    // Force image reload by incrementing retry key
    setRetryKey(prev => prev + 1);
    if (onRetry) {
      onRetry();
    }
  };

  // Continuous mode: show all pages in scrollable view
  if (isContinuous) {
    return (
      <ContinuousViewer
        bookId={bookId}
        totalPages={totalPages}
        readingMode={readingMode}
        zoom={zoom}
        currentPage={pageNumber}
        onPageChange={onPageChange}
        onScrolledToPosition={onScrolledToPosition}
      />
    );
  }

  // Paged mode: show single page
  const imageStyle: React.CSSProperties = {
    transform: `scale(${zoom})`,
    transformOrigin: 'center center',
    willChange: 'transform',
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {hasError ? (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-body text-muted-foreground">Failed to load page</p>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center" style={imageStyle}>
          <Image
            key={`${bookId}-${pageNumber}-${retryKey}`}
            src={pageUrl}
            alt={`Page ${pageNumber}`}
            fill
            className="object-contain"
            unoptimized={true}
            onLoad={handleLoad}
            onError={handleError}
            priority
            loading="eager"
          />
        </div>
      )}
    </div>
  );
}
