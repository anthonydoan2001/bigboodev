'use client';

export function VideoCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="aspect-[9/16] rounded-xl bg-muted" />
      {/* Title skeleton */}
      <div className="mt-2 px-1 space-y-1.5">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
    </div>
  );
}
