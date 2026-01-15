import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton() {
  return (
    <div className="space-y-2 flex-shrink-0 w-full" style={{ maxWidth: 'var(--item-max-width, 100%)' }}>
      <Skeleton className="h-[232px] w-full rounded-xl" />
      <div className="space-y-1">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
