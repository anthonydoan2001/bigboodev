'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LibraryStats } from '@/components/komga/LibraryStats';
import { RecentlyAdded } from '@/components/komga/RecentlyAdded';
import { ContinueReading } from '@/components/komga/ContinueReading';
import { KomgaSearchBar } from '@/components/komga/SearchBar';
import { ComicCard } from '@/components/komga/ComicCard';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { useSearchBooks } from '@/lib/hooks/useKomga';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';

function MangaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const searchPage = parseInt(searchParams.get('page') || '0', 10);

  const { data: searchData, isLoading: searchLoading } = useSearchBooks(searchQuery, searchPage, 20);

  // Grid card width hook - viewport aware
  const { containerRef: searchContainerRef, itemsPerPage: searchItemsPerPage } = useViewportGrid({
    headerHeight: 180, // Nav + spacing
    footerHeight: 0,
  });

  // Paginate search results using viewport-aware items per page
  const paginatedSearchResults = useMemo(() => {
    if (!searchData?.books) return [];
    const startIndex = 0; // Already paginated by API
    return searchData.books.slice(startIndex, startIndex + searchItemsPerPage);
  }, [searchData?.books, searchItemsPerPage]);

  const totalSearchPages = searchData?.totalPages || 0;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    params.set('page', newPage.toString());
    router.push(`/manga?${params.toString()}`);
  };

  const showingSearch = searchQuery.length > 0;

  return (
    <div className={`w-full ${showingSearch ? 'h-screen flex flex-col overflow-hidden py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8' : 'min-h-screen py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8'}`}>
      <div className={`w-full space-y-4 sm:space-y-6 ${showingSearch ? 'flex flex-col h-full' : ''}`}>
        {/* Header */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-title font-semibold">Manga</h1>
            <p className="text-body-sm text-muted-foreground">Browse your comic library</p>
          </div>
          <KomgaSearchBar />
        </div>

        {/* Content */}
        {showingSearch ? (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {searchLoading ? (
              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <div ref={searchContainerRef} className="watchlist-grid gap-3 sm:gap-4 w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                  {Array.from({ length: searchItemsPerPage || 18 }).map((_, i) => (
                    <div key={i} style={{ width: '100%', minWidth: 0 }}>
                      <CardSkeleton />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0 space-y-4">
                {/* Pagination Controls */}
                {totalSearchPages > 1 && (
                  <div className="flex items-center justify-between min-h-[36px] flex-shrink-0">
                    <div></div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(0, searchPage - 1))}
                        disabled={searchPage === 0}
                        className="text-caption sm:text-body-sm"
                      >
                        Previous
                      </Button>
                      <span className="text-caption sm:text-body-sm text-muted-foreground whitespace-nowrap">
                        Page {searchPage + 1} of {totalSearchPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(totalSearchPages - 1, searchPage + 1))}
                        disabled={searchPage >= totalSearchPages - 1}
                        className="text-caption sm:text-body-sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                {/* Search Results - Grid Layout */}
                {paginatedSearchResults.length > 0 ? (
                  <div className="flex-1 min-h-0 w-full overflow-hidden">
                    <div ref={searchContainerRef} className="watchlist-grid gap-3 sm:gap-4 w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                      {paginatedSearchResults.map((book) => (
                        <div key={book.id} style={{ width: '100%', minWidth: 0 }}>
                          <ComicCard book={book} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-body text-muted-foreground">
                      <p>No results found for &quot;{searchQuery}&quot;</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Library Statistics */}
            <LibraryStats />

            {/* Recently Added */}
            <RecentlyAdded limit={10} />

            {/* Continue Reading */}
            <ContinueReading />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MangaPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex flex-col py-8 px-4 md:px-6 lg:px-8 overflow-hidden">
        <div className="w-full flex flex-col h-full space-y-6">
          <div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />
          <div className="h-full flex-1 overflow-hidden">
            <div className="grid gap-4 h-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <MangaContent />
    </Suspense>
  );
}
