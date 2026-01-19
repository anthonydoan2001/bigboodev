'use client';

import { useRouter } from 'next/navigation';
import { useBookMetadata, useSeriesBooks, useSeries } from '@/lib/hooks/useKomga';
import { CollectionItem } from '@/lib/hooks/useKomga';
import { CheckCircle2, BookOpen, Library } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CollectionItemListItemProps {
  item: CollectionItem;
  collectionId?: string;
}

export function CollectionItemListItem({ item, collectionId }: CollectionItemListItemProps) {
  const router = useRouter();
  
  // If it's a book, fetch book metadata
  const { data: book, isLoading: bookLoading } = useBookMetadata(item.bookId || null);
  
  // If it's a series, fetch series info and books
  const { data: seriesBooks, isLoading: seriesLoading } = useSeriesBooks(item.seriesId || null);
  const { data: allSeries } = useSeries(1000);
  const series = item.seriesId ? allSeries?.find(s => s.id === item.seriesId) : null;

  if (item.bookId) {
    // Display book as list item
    // Fetch series info for the book
    const bookSeries = book?.seriesId ? allSeries?.find(s => s.id === book.seriesId) : null;
    
    if (bookLoading) {
      return (
        <div className="py-1 px-2 flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      );
    }
    
    if (!book) {
      return (
        <div className="py-1 px-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Book not found</span>
        </div>
      );
    }

    const title = book.metadata?.title || book.name || 'Untitled';
    const seriesTitle = bookSeries?.metadata?.title || bookSeries?.name || null;
    const pageCount = book.media?.pagesCount || 0;
    const currentPage = book.readProgress?.page || 0;
    const isCompleted = book.readProgress?.completed || false;
    const progressPercent = pageCount > 0 && currentPage > 0 
      ? Math.round((currentPage / pageCount) * 100) 
      : 0;

    const handleClick = () => {
      // Pass collectionId as query parameter if we're in a collection
      const url = collectionId 
        ? `/manga/read/${book.id}?from=collection&collectionId=${collectionId}`
        : `/manga/read/${book.id}`;
      router.push(url);
    };

    return (
      <div 
        className="py-1 px-2 flex items-center gap-1.5 hover:bg-muted/50 transition-colors cursor-pointer rounded-sm"
        onClick={handleClick}
      >
        {isCompleted && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h3 className="text-sm font-semibold truncate">{title}</h3>
          {seriesTitle && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground truncate">{seriesTitle}</span>
            </>
          )}
        </div>
        {pageCount > 0 && (
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {isCompleted ? 'Read' : progressPercent > 0 ? `${progressPercent}%` : ''}
          </span>
        )}
      </div>
    );
  }

  if (item.seriesId) {
    // Display series as list item
    if (seriesLoading) {
      return (
        <div className="py-1 px-2 flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      );
    }

    const seriesTitle = series?.metadata?.title || series?.name || 'Untitled Series';
    const booksCount = seriesBooks?.length || 0;

    const handleClick = () => {
      router.push(`/manga/series/${item.seriesId}`);
    };

    return (
      <div 
        className="py-1 px-2 flex items-center gap-1.5 hover:bg-muted/50 transition-colors cursor-pointer rounded-sm"
        onClick={handleClick}
      >
        <Library className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <h3 className="text-sm font-semibold truncate flex-1 min-w-0">{seriesTitle}</h3>
        {booksCount > 0 && (
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {booksCount} {booksCount === 1 ? 'book' : 'books'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="py-1 px-2 flex items-center gap-1.5 text-sm text-muted-foreground">
      <span>Invalid item</span>
    </div>
  );
}
