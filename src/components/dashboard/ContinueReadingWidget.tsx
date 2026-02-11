'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBooksInProgress, useReadLists } from '@/lib/hooks/useManga';
import { BookOpen, ArrowRight, List } from 'lucide-react';
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
      <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
        <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)] flex items-center gap-2 md:gap-[var(--dash-gap-sm)]">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-3 ml-auto" rounded="full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
        <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)] flex items-center justify-center gap-2 md:gap-[var(--dash-gap-sm)]">
          <BookOpen className="h-4 w-4 md:h-[var(--dash-icon-md)] md:w-[var(--dash-icon-md)] text-muted-foreground" />
          <span className="text-xs md:text-[length:var(--dash-text-sm)] text-muted-foreground">Failed to load reading progress</span>
        </CardContent>
      </Card>
    );
  }

  if (!book) {
    return (
      <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
        <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)] flex items-center justify-center gap-2 md:gap-[var(--dash-gap-sm)]">
          <BookOpen className="h-4 w-4 md:h-[var(--dash-icon-md)] md:w-[var(--dash-icon-md)] text-muted-foreground" />
          <span className="text-xs md:text-[length:var(--dash-text-sm)] text-muted-foreground">No manga in progress</span>
        </CardContent>
      </Card>
    );
  }

  // Display reading list name if in a reading list, otherwise series title
  const displayTitle = containingReadList ? containingReadList.name : book.seriesTitle;

  return (
    <Link href={readLink} className="block group h-full">
      <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 transition-all hover:bg-background/60 hover:shadow-md">
        <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)] h-full flex items-center gap-2 md:gap-[var(--dash-gap-sm)]">
          <BookOpen className="h-4 w-4 md:h-[var(--dash-icon-md)] md:w-[var(--dash-icon-md)] text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] md:text-[length:var(--dash-text-xxs)] text-muted-foreground leading-none mb-0.5">Continue Reading</p>
            <div className="flex items-center gap-1">
              {containingReadList && (
                <List className="h-3 w-3 md:h-[var(--dash-icon-xs)] md:w-[var(--dash-icon-xs)] text-muted-foreground flex-shrink-0" />
              )}
              <h3 className="font-semibold text-xs md:text-[length:var(--dash-text-sm)] leading-tight truncate group-hover:text-primary transition-colors">
                {displayTitle}
              </h3>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 md:h-[var(--dash-icon-md)] md:w-[var(--dash-icon-md)] text-muted-foreground flex-shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
}
