'use client';

import { useMemo } from 'react';
import { useSeries } from '@/lib/hooks/useKomga';
import { KomgaSeries } from '@/types/komga';
import { Card, CardContent } from '@/components/ui/card';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { Library } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface SeriesCardProps {
  series: KomgaSeries;
}

function SeriesCard({ series }: SeriesCardProps) {
  const thumbnailUrl = `/api/komga/series-thumbnail/${series.id}`;
  const seriesUrl = `${process.env.NEXT_PUBLIC_KOMGA_BASE_URL || 'https://komga.bigboo.dev'}/series/${series.id}`;
  
  const title = series.metadata?.title || series.name || 'Untitled';
  const booksCount = series.booksCount || 0;
  const booksReadCount = series.booksReadCount || 0;
  const booksUnreadCount = series.booksUnreadCount || 0;

  const handleClick = () => {
    window.open(seriesUrl, '_blank', 'noopener,noreferrer');
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
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%231f2937" width="200" height="300"/%3E%3Ctext fill="%239ca3af" font-family="Arial, sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>

        {/* Books Count Badge */}
        {booksCount > 0 && (
          <div className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-2 py-1 text-caption font-bold text-white backdrop-blur-md z-10">
            {booksCount} {booksCount === 1 ? 'book' : 'books'}
          </div>
        )}

        {/* Progress Badge */}
        {booksReadCount > 0 && booksCount > 0 && (
          <div className="absolute left-1.5 top-1.5 rounded-md bg-emerald-500/90 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md z-10">
            {Math.round((booksReadCount / booksCount) * 100)}% read
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
              View Series
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-1 w-full min-w-0 flex-shrink-0 overflow-visible">
        {booksUnreadCount > 0 && (
          <div className="text-caption text-muted-foreground">
            {booksUnreadCount} unread
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

interface MySeriesProps {
  limit?: number;
  filter?: (series: KomgaSeries[]) => KomgaSeries[];
}

export function MySeries({ limit = 50, filter }: MySeriesProps) {
  const { data: allSeries, isLoading, error } = useSeries(limit);
  
  // Apply filter if provided
  const series = useMemo(() => {
    if (!allSeries) return [];
    return filter ? filter(allSeries) : allSeries;
  }, [allSeries, filter]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-body-sm text-destructive">
            Failed to load series. Please check your Komga connection.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Library className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-title font-semibold">My Series</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!series || series.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Library className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-title font-semibold">My Series</h2>
        </div>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p>No series found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Library className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-title font-semibold">My Series</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {series.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
    </div>
  );
}
