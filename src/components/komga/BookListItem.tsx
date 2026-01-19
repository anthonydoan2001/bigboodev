'use client';

import { useRouter } from 'next/navigation';
import { KomgaBook } from '@/types/komga';
import { CheckCircle2 } from 'lucide-react';

interface BookListItemProps {
  book: KomgaBook;
}

export function BookListItem({ book }: BookListItemProps) {
  const router = useRouter();
  const title = book.metadata?.title || book.name || 'Untitled';
  const pageCount = book.media?.pagesCount || 0;
  const currentPage = book.readProgress?.page || 0;
  const isCompleted = book.readProgress?.completed || false;
  const progressPercent = pageCount > 0 && currentPage > 0 
    ? Math.round((currentPage / pageCount) * 100) 
    : 0;

  const handleClick = () => {
    router.push(`/manga/read/${book.id}`);
  };

  return (
    <div 
      className="py-1 px-2 flex items-center gap-1.5 hover:bg-muted/50 transition-colors cursor-pointer rounded-sm"
      onClick={handleClick}
    >
      {isCompleted && (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
      )}
      <h3 className="text-sm font-semibold truncate flex-1 min-w-0">{title}</h3>
      {pageCount > 0 && (
        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
          {isCompleted ? 'Read' : progressPercent > 0 ? `${progressPercent}%` : ''}
        </span>
      )}
    </div>
  );
}
