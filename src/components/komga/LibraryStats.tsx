'use client';

import { useLibraryStats } from '@/lib/hooks/useKomga';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Library, BookMarked, BookCheck } from 'lucide-react';

export function LibraryStats() {
  const { data: stats, isLoading, error } = useLibraryStats();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-body-sm text-destructive">
            Failed to load library statistics. Please check your Komga connection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
            <Library className="h-4 w-4" />
            Total Series
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-title font-bold">{stats?.totalSeries || 0}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
            <BookMarked className="h-4 w-4" />
            Unread Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-title font-bold">{stats?.unreadBooks || 0}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
            <BookCheck className="h-4 w-4" />
            In Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-title font-bold">{stats?.inProgressBooks || 0}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
