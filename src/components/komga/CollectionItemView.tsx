'use client';

import { useRouter } from 'next/navigation';
import { useBookMetadata, useSeriesBooks } from '@/lib/hooks/useKomga';
import { CollectionItem } from '@/lib/hooks/useKomga';
import { Card, CardContent } from '@/components/ui/card';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { BookOpen, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComicCard } from '@/components/komga/ComicCard';
import Image from 'next/image';

interface CollectionItemViewProps {
  item: CollectionItem;
}

export function CollectionItemView({ item }: CollectionItemViewProps) {
  const router = useRouter();
  
  // If it's a book, fetch book metadata
  const { data: book, isLoading: bookLoading } = useBookMetadata(item.bookId || null);
  
  // If it's a series, fetch series books
  const { data: seriesBooks, isLoading: seriesLoading } = useSeriesBooks(item.seriesId || null);

  if (item.bookId) {
    // Display book
    if (bookLoading) {
      return <CardSkeleton />;
    }
    
    if (!book) {
      return (
        <Card>
          <CardContent className="p-4">
            <p className="text-caption text-muted-foreground">Book not found</p>
          </CardContent>
        </Card>
      );
    }

    return <ComicCard book={book} />;
  }

  if (item.seriesId) {
    // Display series - show first book or series thumbnail
    if (seriesLoading) {
      return <CardSkeleton />;
    }

    if (!seriesBooks || seriesBooks.length === 0) {
      return (
        <Card>
          <CardContent className="p-4">
            <p className="text-caption text-muted-foreground">Series not found</p>
          </CardContent>
        </Card>
      );
    }

    // Show first book of the series
    const firstBook = seriesBooks[0];
    return <ComicCard book={firstBook} />;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-caption text-muted-foreground">Invalid item</p>
      </CardContent>
    </Card>
  );
}
