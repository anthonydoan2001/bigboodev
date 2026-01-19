'use client';

import { KomgaBook } from '@/types/komga';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { getBookThumbnailUrl, getBookReaderUrl } from '@/lib/api/komga';

interface ComicCardProps {
  book: KomgaBook;
  showProgress?: boolean;
}

export function ComicCard({ book, showProgress = false }: ComicCardProps) {
  const thumbnailUrl = getBookThumbnailUrl(book.id);
  const readerUrl = getBookReaderUrl(book.id);
  
  const title = book.metadata?.title || book.name || 'Untitled';
  const pageCount = book.media?.pagesCount || 0;
  const currentPage = book.readProgress?.page || 0;
  const progressPercent = pageCount > 0 ? Math.round((currentPage / pageCount) * 100) : 0;

  const handleClick = () => {
    window.open(readerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="group relative space-y-2 w-full flex flex-col" style={{ width: '100%', maxWidth: 'var(--item-max-width, 100%)', minWidth: 0 }}>
      <div 
        className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20 cursor-pointer"
        onClick={handleClick}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, var(--item-width, 200px)"
            unoptimized={true}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%231f2937" width="200" height="300"/%3E%3Ctext fill="%239ca3af" font-family="Arial, sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>

        {/* Progress Bar Overlay */}
        {showProgress && book.readProgress && pageCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Hover Overlay - Open Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center justify-end">
            <Button
              size="sm"
              variant="default"
              className="opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-1 w-full min-w-0 flex-shrink-0 overflow-visible">
        {showProgress && book.readProgress && pageCount > 0 && (
          <div className="text-caption text-muted-foreground">
            Page {currentPage} of {pageCount} ({progressPercent}%)
          </div>
        )}
        <h3
          className="text-body-sm font-semibold leading-snug text-foreground/90" 
          style={{ 
            width: '100%',
            minWidth: 0,
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
            overflow: 'visible',
            textOverflow: 'clip',
            display: 'block',
            maxWidth: '100%',
          }} 
          title={title}
        >
          {title}
        </h3>
      </div>
    </div>
  );
}
