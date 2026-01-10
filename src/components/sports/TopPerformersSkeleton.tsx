import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TopPerformersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-none shadow-none bg-transparent overflow-hidden">
          <CardHeader className="pb-3 px-4 flex flex-row justify-center">
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 px-2">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="p-3 px-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="w-6 h-4" /> {/* Rank */}
                    <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28 mb-1.5" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
