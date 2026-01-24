'use client';

export function GameCardSkeleton() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted" />
      <div className="mt-1 space-y-1">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
      </div>
    </div>
  );
}
