'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MySeries } from '@/components/komga/MySeries';
import { KomgaSearchBar } from '@/components/komga/SearchBar';
import { SeriesFilter, SeriesFilterType } from '@/components/komga/SeriesFilter';
import { ComicCard } from '@/components/komga/ComicCard';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { useSearchBooks, useSeries } from '@/lib/hooks/useKomga';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';
import { KomgaSeries } from '@/types/komga';
import { FolderOpen } from 'lucide-react';
import Link from 'next/link';

function MangaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const searchPage = parseInt(searchParams.get('page') || '0', 10);
  const filterParam = (searchParams.get('filter') as SeriesFilterType) || 'all';

  const { data: searchData, isLoading: searchLoading } = useSearchBooks(searchQuery, searchPage, 20);
  const { data: allSeries } = useSeries(1000); // Fetch all series for filtering

  // Filter series by type (comic vs manga)
  // This checks library name, tags, or genres for "comic" or "manga"
  const filterSeries = (series: KomgaSeries[], filter: SeriesFilterType): KomgaSeries[] => {
    if (filter === 'all') return series;
    
    return series.filter((s) => {
      const name = s.name?.toLowerCase() || '';
      const title = s.metadata?.title?.toLowerCase() || '';
      const tags = s.metadata?.tags?.map(t => t.toLowerCase()) || [];
      const genres = s.metadata?.genres?.map(g => g.toLowerCase()) || [];
      
      const searchText = `${name} ${title} ${tags.join(' ')} ${genres.join(' ')}`;
      
      if (filter === 'comic') {
        // Check if it's a comic (not manga)
        return searchText.includes('comic') && !searchText.includes('manga');
      } else if (filter === 'manga') {
        // Check if it's manga
        return searchText.includes('manga');
      }
      
      return true;
    });
  };

  // Calculate counts for filter buttons
  const filteredSeries = useMemo(() => {
    if (!allSeries) return [];
    return filterSeries(allSeries, filterParam);
  }, [allSeries, filterParam]);

  const comicCount = useMemo(() => {
    if (!allSeries) return 0;
    return filterSeries(allSeries, 'comic').length;
  }, [allSeries]);

  const mangaCount = useMemo(() => {
    if (!allSeries) return 0;
    return filterSeries(allSeries, 'manga').length;
  }, [allSeries]);

  const handleFilterChange = (newFilter: SeriesFilterType) => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    if (newFilter !== 'all') {
      params.set('filter', newFilter);
    }
    router.push(`/manga?${params.toString()}`);
  };

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
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SeriesFilter
              filter={filterParam}
              onFilterChange={handleFilterChange}
              comicCount={comicCount}
              mangaCount={mangaCount}
            />
            <Link href="/manga/collections">
              <Button variant="outline" size="sm" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Collections
              </Button>
            </Link>
          </div>
          <KomgaSearchBar />
        </div>

        {/* Content */}
        {showingSearch ? (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {searchLoading ? (
              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <div ref={searchContainerRef} className="watchlist-grid gap-3 sm:gap-4 w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                  {Array.from({ length: 12 }).map((_, i) => (
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
            {/* My Series */}
            <MySeries 
              limit={1000} 
              filter={(series) => filterSeries(series, filterParam)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MangaPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen py-8 px-4 md:px-6 lg:px-8">
        <div className="w-full space-y-6">
          <div className="h-10 w-48 bg-muted/50 rounded" />
          <div className="watchlist-grid gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <MangaContent />
    </Suspense>
  );
}
