import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton() {
  return (
    <div className="flex flex-col w-full h-full" style={{ width: '100%', minWidth: 0 }}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
      <div className="mt-1 space-y-0.5 w-full min-w-0 flex-shrink-0">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
