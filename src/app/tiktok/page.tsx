'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Video } from 'lucide-react';
import { TikTokVideo } from '@prisma/client';
import { VideoGrid } from '@/components/tiktok/VideoGrid';
import { MonthYearFilter } from '@/components/tiktok/MonthYearFilter';
import { TikTokPagination } from '@/components/tiktok/TikTokPagination';
import { getAuthHeaders } from '@/lib/api-client';

interface TikTokResponse {
  videos: TikTokVideo[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface MonthsResponse {
  months: Array<{
    value: string;
    label: string;
    month: number;
    year: number;
  }>;
}

function TikTokContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const monthYear = searchParams.get('filter');

  // Parse month/year from filter
  const [year, month] = monthYear ? monthYear.split('-').map(Number) : [null, null];

  // Fetch videos
  const { data, isLoading, error } = useQuery<TikTokResponse>({
    queryKey: ['tiktok-videos', page, monthYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (month !== null && year !== null) {
        params.set('month', month.toString());
        params.set('year', year.toString());
      }

      const res = await fetch(`/api/tiktok?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch videos');
      }

      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });

  // Fetch available months for filter
  const { data: monthsData } = useQuery<MonthsResponse>({
    queryKey: ['tiktok-months'],
    queryFn: async () => {
      const res = await fetch('/api/tiktok', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch months');
      }

      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tiktok?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to delete video');
      }

      return res.json();
    },
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tiktok-videos'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-months'] });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleFilterChange = (value: string | null) => {
    const params = new URLSearchParams();
    params.set('page', '1'); // Reset to page 1 when filter changes
    if (value) {
      params.set('filter', value);
    }
    router.push(`/tiktok?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    if (monthYear) {
      params.set('filter', monthYear);
    }
    router.push(`/tiktok?${params.toString()}`);
  };

  if (error) {
    return (
      <div className="w-full py-6 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="flex items-center justify-center py-16">
          <p className="text-destructive text-body">Failed to load videos. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6 text-primary" />
          <h1 className="text-heading">TikTok Likes</h1>
          {data && (
            <span className="text-muted-foreground text-body-sm">
              ({data.totalCount} videos)
            </span>
          )}
        </div>

        <MonthYearFilter
          options={monthsData?.months || []}
          value={monthYear}
          onChange={handleFilterChange}
        />
      </div>

      {/* Video Grid */}
      <VideoGrid
        videos={data?.videos || []}
        isLoading={isLoading}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      {/* Pagination */}
      {data && (
        <TikTokPagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default function TikTokPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-6 px-4 sm:px-6 lg:px-8 min-h-screen">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Video className="h-6 w-6 text-primary" />
              <h1 className="text-heading">TikTok Likes</h1>
            </div>
            <div className="w-[180px] h-9 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <TikTokContent />
    </Suspense>
  );
}
