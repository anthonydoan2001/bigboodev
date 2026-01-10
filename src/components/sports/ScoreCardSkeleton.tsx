import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ScoreCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-muted/20">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
        </div>

        {/* Teams & Scores */}
        <div className="p-4 space-y-4">
          {/* Away Team */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-7 w-12" />
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-7 w-12" />
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-muted/10 border-t border-border/50">
          <div className="px-4 py-3 text-center">
            <Skeleton className="h-3 w-32 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
