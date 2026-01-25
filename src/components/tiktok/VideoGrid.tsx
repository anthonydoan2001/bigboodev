'use client';

import { TikTokVideo } from '@prisma/client';
import { VideoCard } from './VideoCard';
import { VideoCardSkeleton } from './VideoCardSkeleton';

interface VideoGridProps {
  videos: TikTokVideo[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

export function VideoGrid({ videos, isLoading, onDelete, deletingId }: VideoGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground text-body">No videos found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onDelete={onDelete}
          isDeleting={deletingId === video.id}
        />
      ))}
    </div>
  );
}
