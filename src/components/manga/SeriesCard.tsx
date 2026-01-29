'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { getSeriesThumbnailUrl } from '@/lib/api/manga';
import { useThumbnailVersion } from '@/lib/stores/manga-store';
import { KomgaSeries } from '@/types/komga';
import { BookOpen, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface SeriesCardProps {
  series: KomgaSeries;
}

export function SeriesCard({ series }: SeriesCardProps) {
  const [imageError, setImageError] = useState(false);
  const thumbnailVersion = useThumbnailVersion();

  // Use lastModified + global thumbnail version as cache buster
  const thumbnailUrl = `${getSeriesThumbnailUrl(series.id)}?t=${new Date(series.lastModified).getTime()}&v=${thumbnailVersion}`;
  const totalBooks = series.booksCount;
  const readBooks = series.booksReadCount;
  const inProgressBooks = series.booksInProgressCount;

  const isComplete = readBooks === totalBooks && totalBooks > 0;
  const hasProgress = readBooks > 0 || inProgressBooks > 0;
  const progressPercent = totalBooks > 0 ? Math.round((readBooks / totalBooks) * 100) : 0;

  return (
    <Link
      href={`/manga/series/${series.id}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3] transition-transform group-hover:scale-[1.02]">
        {!imageError ? (
          <Image
            src={thumbnailUrl}
            alt={series.name}
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

        {/* Progress/Status Badge */}
        <div className="absolute top-2 right-2">
          {isComplete ? (
            <Badge className="bg-success hover:bg-success text-success-foreground border-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          ) : hasProgress ? (
            <Badge variant="secondary" className="bg-in-progress hover:bg-in-progress text-in-progress-foreground border-0">
              {readBooks}/{totalBooks}
            </Badge>
          ) : null}
        </div>

        {/* Book count */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-black/70 text-white border-0">
            {totalBooks} {totalBooks === 1 ? 'book' : 'books'}
          </Badge>
        </div>

        {/* Progress bar */}
        {hasProgress && !isComplete && (
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
          {series.metadata.title || series.name}
        </h3>
        {series.metadata.publisher && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {series.metadata.publisher}
          </p>
        )}
      </div>
    </Link>
  );
}
