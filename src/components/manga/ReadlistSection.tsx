'use client';

import { useReadLists } from '@/lib/hooks/useManga';
import { ReadListCard } from './ReadlistCard';
import { Skeleton } from '@/components/ui/skeleton';
import { List, Loader2 } from 'lucide-react';

interface ReadListSectionProps {
  enabled?: boolean;
}

export function ReadListSection({ enabled = true }: ReadListSectionProps) {
  const { readLists, totalElements, isLoading, isFetching } = useReadLists({
    size: 12,
    enabled,
  });

  // Don't render anything if no reading lists
  if (!isLoading && readLists.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Reading Lists</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Reading Lists</h2>
          <span className="text-sm text-muted-foreground">
            ({totalElements} {totalElements === 1 ? 'list' : 'lists'})
          </span>
          {isFetching && !isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {readLists.map((readList) => (
          <ReadListCard key={readList.id} readList={readList} />
        ))}
      </div>
    </div>
  );
}
