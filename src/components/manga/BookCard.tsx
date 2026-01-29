'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBookThumbnailUrl } from '@/lib/api/manga';
import { KomgaBook } from '@/types/komga';
import { BookOpen, CheckCircle, Play } from 'lucide-react';
import { useState } from 'react';

interface BookCardProps {
  book: KomgaBook;
  showSeriesTitle?: boolean;
  hideProgress?: boolean;
}

export function BookCard({ book, showSeriesTitle = false, hideProgress = false }: BookCardProps) {
  const [imageError, setImageError] = useState(false);

  const thumbnailUrl = getBookThumbnailUrl(book.id);
  const totalPages = book.media.pagesCount;
  const currentPage = book.readProgress?.page || 0;
  const isComplete = book.readProgress?.completed || false;
  const hasProgress = currentPage > 0;
  const progressPercent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <Link
      href={`/manga/read/${book.id}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3] transition-transform group-hover:scale-[1.02]">
        {!imageError ? (
          <Image
            src={thumbnailUrl}
            alt={book.name}
            fill
            unoptimized
            className="object-cover transition-opacity group-hover:opacity-90"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Hover overlay with play button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-primary rounded-full p-3">
              <Play className="h-6 w-6 text-primary-foreground fill-current" />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {!hideProgress && (
          <div className="absolute top-2 right-2">
            {isComplete ? (
              <Badge className="bg-success hover:bg-success text-success-foreground border-0">
                <CheckCircle className="h-3 w-3 mr-1" />
                Read
              </Badge>
            ) : hasProgress ? (
              <Badge variant="secondary" className="bg-in-progress hover:bg-in-progress text-in-progress-foreground border-0">
                {progressPercent}%
              </Badge>
            ) : null}
          </div>
        )}

        {/* Page count */}
        {!hideProgress && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-black/70 text-white border-0">
              {totalPages} pages
            </Badge>
          </div>
        )}

        {/* Progress bar */}
        {!hideProgress && hasProgress && !isComplete && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-in-progress"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {book.metadata.title || book.name}
        </h3>
        {showSeriesTitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {book.seriesTitle}
          </p>
        )}
        {!hideProgress && hasProgress && !isComplete && (
          <div className="flex items-center gap-2">
            <Progress value={progressPercent} className="h-1 flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentPage}/{totalPages}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
