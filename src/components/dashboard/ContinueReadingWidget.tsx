'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useBooksInProgress, useReadLists } from '@/lib/hooks/useManga';
import { getBookThumbnailUrl, getReadListThumbnailUrl } from '@/lib/api/manga';
import { BookOpen, Loader2, List } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

export function ContinueReadingWidget() {
  const { books, isLoading: booksLoading, error } = useBooksInProgress({ size: 1 });
  const { readLists, isLoading: readListsLoading } = useReadLists({ size: 100 });

  const book = books[0];

  // Find if the book is in any reading list
  const containingReadList = useMemo(() => {
    if (!book || !readLists.length) return null;
    return readLists.find(rl => rl.bookIds?.includes(book.id)) || null;
  }, [book, readLists]);

  // Determine the link - include readlist context if applicable
  const readLink = useMemo(() => {
    if (!book) return '#';
    if (containingReadList) {
      return `/manga/read/${book.id}?from=readlist&readlistId=${containingReadList.id}`;
    }
    return `/manga/read/${book.id}`;
  }, [book, containingReadList]);

  const isLoading = booksLoading || readListsLoading;

  if (isLoading) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm h-full">
        <CardContent className="p-3 flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !book) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm h-full">
        <CardContent className="p-3 flex flex-col items-center justify-center h-full text-center gap-2">
          <BookOpen className="h-7 w-7 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            No manga in progress
          </span>
        </CardContent>
      </Card>
    );
  }

  // Display reading list name if in a reading list, otherwise series title
  const displayTitle = containingReadList ? containingReadList.name : book.seriesTitle;

  // Use reading list thumbnail if in a reading list, otherwise book thumbnail
  const thumbnailUrl = containingReadList
    ? getReadListThumbnailUrl(containingReadList.id)
    : getBookThumbnailUrl(book.id);

  return (
    <Link href={readLink} className="block group h-full">
      <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm transition-all hover:bg-background/60 hover:shadow-md hover:scale-[1.01]">
        <CardContent className="p-2 h-full flex items-center justify-center gap-2">
          {/* Thumbnail */}
          <div className="relative w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-muted">
            <Image
              src={thumbnailUrl}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="40px"
              unoptimized
            />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              {containingReadList && (
                <List className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
              <h3 className="font-semibold text-xs leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {displayTitle}
              </h3>
            </div>
            <p className="text-[0.65rem] text-muted-foreground truncate">
              {book.metadata.title || book.name}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
