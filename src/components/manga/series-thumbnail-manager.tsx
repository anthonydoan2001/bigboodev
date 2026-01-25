'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { useSeries } from '@/lib/hooks/useManga';
import { getSeriesThumbnailUrl } from '@/lib/api/manga';
import { ThumbnailUploadDialog } from './thumbnail-upload-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { KomgaSeries } from '@/types/komga';
import { Search, Edit, ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';

export function SeriesThumbnailManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedSeries, setSelectedSeries] = useState<KomgaSeries | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
    // Simple debounce
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const { series, totalPages, isLoading, isFetching } = useSeries({
    page,
    size: 12,
    search: debouncedSearch || undefined,
  });

  const handleEdit = (s: KomgaSeries) => {
    setSelectedSeries(s);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    // Invalidate series queries to refresh thumbnails
    queryClient.invalidateQueries({ queryKey: ['manga', 'series'] });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search series..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : series.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {debouncedSearch ? `No series found for "${debouncedSearch}"` : 'No series found'}
        </div>
      ) : (
        <>
          {/* Series Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {series.map((s) => (
              <SeriesThumbnailCard
                key={s.id}
                series={s}
                onEdit={() => handleEdit(s)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0 || isFetching}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Page ${page + 1} of ${totalPages}`
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1 || isFetching}
                onClick={() => setPage(p => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <ThumbnailUploadDialog
        series={selectedSeries}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

interface SeriesThumbnailCardProps {
  series: KomgaSeries;
  onEdit: () => void;
}

function SeriesThumbnailCard({ series, onEdit }: SeriesThumbnailCardProps) {
  const [imageError, setImageError] = useState(false);
  const thumbnailUrl = getSeriesThumbnailUrl(series.id);

  return (
    <div className="group relative">
      <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden">
        {!imageError ? (
          <Image
            src={thumbnailUrl}
            alt={series.name}
            fill
            unoptimized
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}

        {/* Edit overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium line-clamp-2">
        {series.metadata.title || series.name}
      </p>
    </div>
  );
}
