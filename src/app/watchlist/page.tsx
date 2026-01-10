'use client';

import { UniversalSearchResult } from '@/app/api/watchlist/search/universal/route';
import { TopItem } from '@/app/api/watchlist/top/route';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel } from '@/components/watchlist/Carousel';
import { SearchBar } from '@/components/watchlist/SearchBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WatchlistItem } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Eye, ListVideo, MoreVertical, Plus, Trash2, Trophy } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState, useEffect, useRef } from 'react';

type ViewMode = 'list' | 'watched' | 'watching' | 'search' | 'top';

export default function WatchlistPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'anime' | 'movie' | 'show'>('all');
  const [searchPage, setSearchPage] = useState(1);
  const [watchedFilter, setWatchedFilter] = useState<'all' | 'anime' | 'movie' | 'show'>('all');
  const [watchedPage, setWatchedPage] = useState(1);
  const queryClient = useQueryClient();
  
  const ITEMS_PER_PAGE = 24; // 8 columns × 3 rows
  
  // Stable randomized order - only created once per page load
  const randomizedOrderRef = useRef<Map<string, number>>(new Map());
  const hasInitializedRef = useRef(false);

  // Fetch user's watchlist (always loaded)
  const { data: watchlistData, isLoading: listLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const res = await fetch('/api/watchlist');
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      return res.json();
    },
    staleTime: 60000,
  });

  // Search all content
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['universal-search', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/watchlist/search/universal?query=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Failed to search');
      return res.json();
    },
    enabled: searchQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top items
  const { data: topData, isLoading: topLoading } = useQuery({
    queryKey: ['top-items'],
    queryFn: async () => {
      const res = await fetch('/api/watchlist/top');
      if (!res.ok) throw new Error('Failed to fetch top items');
      return res.json();
    },
    enabled: viewMode === 'top',
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

  // Add to watchlist mutation
  const addMutation = useMutation({
    mutationFn: async (item: UniversalSearchResult) => {
      console.log('Adding to watchlist:', item);
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: String(item.externalId),
          type: item.type.toUpperCase(),
          title: item.title,
          imageUrl: item.image,
          year: item.year,
          rating: item.rating,
          episodes: item.episodes,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error: Error) => {
      console.error('Add error:', error);
      alert(error.message);
    },
  });

  // Delete from watchlist mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/watchlist?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      // Clean up the order reference
      randomizedOrderRef.current.delete(id);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchFilter('all'); // Reset filter when searching
    setSearchPage(1); // Reset to page 1 when searching
    if (query) {
      setViewMode('search');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchFilter('all'); // Reset filter when clearing
    setSearchPage(1); // Reset to page 1 when clearing
    setViewMode('list');
  };

  const allItems: WatchlistItem[] = watchlistData?.items || [];
  // Filter out watched items from regular watchlist
  const watchlistItems: WatchlistItem[] = allItems.filter(item => item.status !== 'WATCHED' && item.status !== 'WATCHING');
  // Get only watched items, sorted by date added (most recent first)
  const watchedItems: WatchlistItem[] = allItems
    .filter(item => item.status === 'WATCHED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // Get only watching items
  const watchingItems: WatchlistItem[] = allItems
    .filter(item => item.status === 'WATCHING')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Recently added on top
  
  // Filter out items without images from search results
  const searchResults: UniversalSearchResult[] = (searchData?.results || []).filter((result: UniversalSearchResult) => result.image && result.image.trim() !== '');
  // Filter out items without images from top items
  const topItems: TopItem[] = (topData?.results || []).filter((item: TopItem) => item.image && item.image.trim() !== '');

  // Helper to check if item is in watchlist
  const isInWatchlist = (externalId: number, type: string) => {
    return watchlistItems.some(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
  };

  // Helper to check if item is watched
  const isWatched = (externalId: number, type: string) => {
    return watchedItems.some(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
  };

  // Helper to check if item is watching
  const isWatching = (externalId: number, type: string) => {
    return watchingItems.some(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
  };

  // Helper to get watchlist item ID by externalId and type
  const getWatchlistItemId = (externalId: number, type: string): string | null => {
    const item = allItems.find(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
    return item?.id || null;
  };

  // Create stable randomized order only on initial load
  useEffect(() => {
    // Only initialize once when data is first loaded (not loading and data exists)
    if (!hasInitializedRef.current && !listLoading && watchlistData) {
      // Initialize random order for watchlist items (only those not watched)
      const currentWatchlist = watchlistData.items.filter((item: WatchlistItem) => item.status !== 'WATCHED');
      if (currentWatchlist.length > 0) {
        const watchlistOrder = currentWatchlist.map((_: WatchlistItem, index: number) => index);
        for (let i = watchlistOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [watchlistOrder[i], watchlistOrder[j]] = [watchlistOrder[j], watchlistOrder[i]];
        }
        currentWatchlist.forEach((item: WatchlistItem, originalIndex: number) => {
          randomizedOrderRef.current.set(item.id, watchlistOrder[originalIndex]);
        });
      }

      // Initialize random order for watched items
      const currentWatched = watchlistData.items.filter((item: WatchlistItem) => item.status === 'WATCHED');
      if (currentWatched.length > 0) {
        const watchedOrder = currentWatched.map((_: WatchlistItem, index: number) => index);
        for (let i = watchedOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [watchedOrder[i], watchedOrder[j]] = [watchedOrder[j], watchedOrder[i]];
        }
        currentWatched.forEach((item: WatchlistItem, originalIndex: number) => {
          randomizedOrderRef.current.set(item.id, watchedOrder[originalIndex] + 10000); // Offset to separate from watchlist
        });
      }

      // Mark as initialized even if there are no items
      hasInitializedRef.current = true;
    }
  }, [watchlistData, listLoading]);

  // Get randomized watchlist items - filter to only include current items, maintain stable order
  const randomizedWatchlist = useMemo(() => {
    // If not initialized yet but we have items, initialize now
    if (!hasInitializedRef.current && watchlistItems.length > 0) {
      const watchlistOrder = watchlistItems.map((_: WatchlistItem, index: number) => index);
      for (let i = watchlistOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [watchlistOrder[i], watchlistOrder[j]] = [watchlistOrder[j], watchlistOrder[i]];
      }
      watchlistItems.forEach((item: WatchlistItem, originalIndex: number) => {
        randomizedOrderRef.current.set(item.id, watchlistOrder[originalIndex]);
      });
      hasInitializedRef.current = true;
    }
    
    if (!hasInitializedRef.current) return watchlistItems;
    
    // Assign orders: existing items keep their order, new items get random order at end
    const watchlistOrders = Array.from(randomizedOrderRef.current.values()).filter(v => v < 10000);
    const maxWatchlistOrder = watchlistOrders.length > 0 ? Math.max(...watchlistOrders) : -1;
    
    const itemsWithOrder = watchlistItems
      .map(item => {
        let order = randomizedOrderRef.current.get(item.id);
        if (order === undefined || order >= 10000) {
          // New item - assign it a random position at the end
          order = Math.random() * 1000 + maxWatchlistOrder + 1000;
          randomizedOrderRef.current.set(item.id, order);
        }
        return { item, order };
      })
      .sort((a, b) => a.order - b.order);
    
    return itemsWithOrder.map(({ item }) => item);
  }, [watchlistItems]);

  // Get randomized watched items - filter to only include current items, maintain stable order
  const randomizedWatched = useMemo(() => {
    // If not initialized yet but we have items, initialize now
    if (!hasInitializedRef.current && watchedItems.length > 0) {
      const watchedOrder = watchedItems.map((_: WatchlistItem, index: number) => index);
      for (let i = watchedOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [watchedOrder[i], watchedOrder[j]] = [watchedOrder[j], watchedOrder[i]];
      }
      watchedItems.forEach((item: WatchlistItem, originalIndex: number) => {
        randomizedOrderRef.current.set(item.id, watchedOrder[originalIndex] + 10000);
      });
      hasInitializedRef.current = true;
    }
    
    if (!hasInitializedRef.current) return watchedItems;
    
    // Assign orders: existing items keep their order, new items get random order at end
    const watchedOrders = Array.from(randomizedOrderRef.current.values()).filter(v => v >= 10000);
    const maxWatchedOrder = watchedOrders.length > 0 ? Math.max(...watchedOrders) : 9999;
    
    const itemsWithOrder = watchedItems
      .map(item => {
        let order = randomizedOrderRef.current.get(item.id);
        if (order === undefined || order < 10000) {
          // New item (or moved from watchlist) - assign it a random position at the end
          order = Math.random() * 1000 + maxWatchedOrder + 1000;
          randomizedOrderRef.current.set(item.id, order);
        }
        return { item, order };
      })
      .sort((a, b) => a.order - b.order);
    
    return itemsWithOrder.map(({ item }) => item);
  }, [watchedItems]);

  // Group watchlist by type (excluding watched)
  const animeList = watchlistItems.filter(item => item.type === 'ANIME');
  const moviesList = watchlistItems.filter(item => item.type === 'MOVIE');
  const showsList = watchlistItems.filter(item => item.type === 'SHOW');

  // Filter watched items based on selected filter
  const filteredWatchedItems = useMemo(() => {
    if (watchedFilter === 'all') return watchedItems;
    const filterType = watchedFilter.toUpperCase();
    return watchedItems.filter(item => item.type === filterType);
  }, [watchedItems, watchedFilter]);

  // Paginate filtered watched items
  const paginatedWatchedItems = useMemo(() => {
    const startIndex = (watchedPage - 1) * ITEMS_PER_PAGE;
    return filteredWatchedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredWatchedItems, watchedPage]);

  const totalWatchedPages = Math.ceil(filteredWatchedItems.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setWatchedPage(1);
  }, [watchedFilter]);

  // Group top items by type
  const topAnime = topItems.filter(item => item.type === 'anime');
  const topMovies = topItems.filter(item => item.type === 'movie');
  const topShows = topItems.filter(item => item.type === 'show');

  // Filter search results based on selected filter
  const filteredSearchResults = useMemo(() => {
    if (searchFilter === 'all') return searchResults;
    return searchResults.filter(item => item.type.toLowerCase() === searchFilter);
  }, [searchResults, searchFilter]);

  // Paginate filtered search results
  const paginatedSearchResults = useMemo(() => {
    const startIndex = (searchPage - 1) * ITEMS_PER_PAGE;
    return filteredSearchResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSearchResults, searchPage]);

  const totalSearchPages = Math.ceil(filteredSearchResults.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setSearchPage(1);
  }, [searchFilter]);

  // Mark as watched mutation
  const markWatchedMutation = useMutation({
    mutationFn: async ({ id, item }: { id?: string; item?: UniversalSearchResult | WatchlistItem }) => {
      if (id) {
        // Update existing item
        const res = await fetch('/api/watchlist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'WATCHED' }),
        });
        if (!res.ok) throw new Error('Failed to mark as watched');
        return res.json();
      } else if (item) {
        // Add new item as watched
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            externalId: String(item.externalId || (item as WatchlistItem).externalId),
            type: ((item as UniversalSearchResult).type || (item as WatchlistItem).type).toUpperCase(),
            title: (item as UniversalSearchResult).title || (item as WatchlistItem).title,
            imageUrl: (item as UniversalSearchResult).image || (item as WatchlistItem).imageUrl,
            year: (item as UniversalSearchResult).year || (item as WatchlistItem).year,
            rating: (item as UniversalSearchResult).rating || (item as WatchlistItem).rating,
            episodes: (item as UniversalSearchResult).episodes || (item as WatchlistItem).episodes,
            status: 'WATCHED',
          }),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to add to watched');
        }
        return res.json();
      }
      throw new Error('Invalid parameters');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error: Error) => {
      console.error('Mark watched error:', error);
      alert(error.message);
    },
  });

  // Mark as watching mutation
  const markWatchingMutation = useMutation({
    mutationFn: async ({ id, item }: { id?: string; item?: UniversalSearchResult | WatchlistItem }) => {
      if (id) {
        // Update existing item
        const res = await fetch('/api/watchlist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'WATCHING' }),
        });
        if (!res.ok) throw new Error('Failed to mark as watching');
        return res.json();
      } else if (item) {
        // Add new item as watching
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            externalId: String(item.externalId || (item as WatchlistItem).externalId),
            type: ((item as UniversalSearchResult).type || (item as WatchlistItem).type).toUpperCase(),
            title: (item as UniversalSearchResult).title || (item as WatchlistItem).title,
            imageUrl: (item as UniversalSearchResult).image || (item as WatchlistItem).imageUrl,
            year: (item as UniversalSearchResult).year || (item as WatchlistItem).year,
            rating: (item as UniversalSearchResult).rating || (item as WatchlistItem).rating,
            episodes: (item as UniversalSearchResult).episodes || (item as WatchlistItem).episodes,
            status: 'WATCHING',
          }),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to add to watching');
        }
        return res.json();
      }
      throw new Error('Invalid parameters');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error: Error) => {
      console.error('Mark watching error:', error);
      alert(error.message);
    },
  });

  // Show search results if there's a query, otherwise show list
  const showingSearch = searchQuery.length > 0;
  const showingTop = viewMode === 'top';
  const showingWatched = viewMode === 'watched';
  const showingWatching = viewMode === 'watching';

  return (
    <div className="container mx-auto py-8 px-8 min-h-screen max-w-full">
      <div className="w-full space-y-6">
        {/* Navigation and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'watching' && !showingSearch ? 'default' : 'outline'}
              onClick={() => {
                setSearchQuery('');
                setViewMode('watching');
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' && !showingSearch ? 'default' : 'outline'}
              onClick={() => {
                setSearchQuery('');
                setViewMode('list');
              }}
            >
              <ListVideo className="h-4 w-4 mr-2" />
              Watchlist ({watchlistItems.length})
            </Button>
            <Button
              variant={viewMode === 'watched' && !showingSearch ? 'default' : 'outline'}
              onClick={() => {
                setSearchQuery('');
                setViewMode('watched');
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Watched ({watchedItems.length})
            </Button>
            <Button
              variant={viewMode === 'top' ? 'default' : 'outline'}
              onClick={() => {
                setSearchQuery('');
                setViewMode('top');
              }}
            >
              <Trophy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 max-w-md">
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              placeholder="Search anime, movies, and shows..."
              isLoading={searchLoading}
            />
          </div>
        </div>

        {/* Content */}
        {showingWatching ? (
          <div className="space-y-8">
            {listLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : watchingItems.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                  <p className="text-lg">No items currently watching</p>
                  <p className="text-sm">Mark items from your watchlist as watching to see them here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {watchingItems.map((item) => (
                  <WatchlistCard 
                    key={item.id}
                    item={item} 
                    onDelete={() => deleteMutation.mutate(item.id)}
                    onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                    hideStatusBadge={true}
                  />
                ))}
              </div>
            )}
          </div>
        ) : showingSearch ? (
          <div className="space-y-6">
            {/* Search Filters */}
            {searchResults.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={searchFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilter('all')}
                >
                  All ({searchResults.length})
                </Button>
                <Button
                  variant={searchFilter === 'anime' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilter('anime')}
                >
                  Anime ({searchResults.filter(item => item.type.toLowerCase() === 'anime').length})
                </Button>
                <Button
                  variant={searchFilter === 'movie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilter('movie')}
                >
                  Movie ({searchResults.filter(item => item.type.toLowerCase() === 'movie').length})
                </Button>
                <Button
                  variant={searchFilter === 'show' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilter('show')}
                >
                  TV Show ({searchResults.filter(item => item.type.toLowerCase() === 'show').length})
                </Button>
              </div>
            )}

            {/* Search Results - Grid Layout 8 columns × 3 rows */}
            {searchLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {Array.from({ length: 24 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : paginatedSearchResults.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {paginatedSearchResults.map((result) => {
                    const alreadyInList = isInWatchlist(result.externalId, result.type);
                    const itemWatched = isWatched(result.externalId, result.type);
                    const itemWatching = isWatching(result.externalId, result.type);
                    const itemId = getWatchlistItemId(result.externalId, result.type);
                    return (
                      <SearchResultCard
                        key={result.id}
                        result={result}
                        onAdd={() => addMutation.mutate(result)}
                        isAdding={addMutation.isPending}
                        alreadyInList={alreadyInList}
                        isWatched={itemWatched}
                        isWatching={itemWatching}
                        onMarkWatched={() => markWatchedMutation.mutate({ item: result })}
                        isMarkingWatched={markWatchedMutation.isPending}
                        onMarkWatching={() => markWatchingMutation.mutate({ item: result })}
                        isMarkingWatching={markWatchingMutation.isPending}
                        onDelete={itemId ? () => deleteMutation.mutate(itemId) : undefined}
                      />
                    );
                  })}
                </div>
                
                {/* Pagination Controls */}
                {totalSearchPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchPage(prev => Math.max(1, prev - 1))}
                      disabled={searchPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {searchPage} of {totalSearchPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchPage(prev => Math.min(totalSearchPages, prev + 1))}
                      disabled={searchPage === totalSearchPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : searchResults.length > 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p>No {searchFilter === 'all' ? '' : searchFilter} results found for "{searchQuery}"</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p>No results found for "{searchQuery}"</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : showingWatched ? (
          <div className="space-y-6">
            {/* Watched Filters */}
            {watchedItems.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={watchedFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWatchedFilter('all')}
                >
                  All ({watchedItems.length})
                </Button>
                <Button
                  variant={watchedFilter === 'anime' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWatchedFilter('anime')}
                >
                  Anime ({watchedItems.filter(item => item.type === 'ANIME').length})
                </Button>
                <Button
                  variant={watchedFilter === 'movie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWatchedFilter('movie')}
                >
                  Movie ({watchedItems.filter(item => item.type === 'MOVIE').length})
                </Button>
                <Button
                  variant={watchedFilter === 'show' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWatchedFilter('show')}
                >
                  TV Show ({watchedItems.filter(item => item.type === 'SHOW').length})
                </Button>
              </div>
            )}

            {/* Watched Results - Grid Layout 8 columns × 3 rows */}
            {listLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {Array.from({ length: 24 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : paginatedWatchedItems.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {paginatedWatchedItems.map((item) => (
                    <WatchlistCard
                      key={item.id}
                      item={item}
                      onDelete={() => deleteMutation.mutate(item.id)}
                      disableContextMenu={true}
                      hideStatusBadge={true}
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalWatchedPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWatchedPage(prev => Math.max(1, prev - 1))}
                      disabled={watchedPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {watchedPage} of {totalWatchedPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWatchedPage(prev => Math.min(totalWatchedPages, prev + 1))}
                      disabled={watchedPage === totalWatchedPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : watchedItems.length > 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p>No {watchedFilter === 'all' ? '' : watchedFilter} watched items found</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                  <p className="text-lg">No watched items yet</p>
                  <p className="text-sm">Mark items from your watchlist or search results as watched</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : showingTop ? (
          <div className="space-y-8">
            {topLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <div className="flex gap-4 overflow-hidden">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <CardSkeleton key={j} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : topItems.length > 0 ? (
              <>
                {/* Top Anime Section */}
                {topAnime.length > 0 && (
                  <Carousel title="Top Anime" count={topAnime.length} icon={<ListVideo className="h-4 w-4" />}>
                    {topAnime.map((item) => {
                      const alreadyInList = isInWatchlist(item.externalId, item.type);
                      const itemWatched = isWatched(item.externalId, item.type);
                      const itemWatching = isWatching(item.externalId, item.type);
                      const itemId = getWatchlistItemId(item.externalId, item.type);
                      return (
                        <div key={item.id} className="flex-shrink-0 w-[180px]">
                          <SearchResultCard
                            result={item}
                            onAdd={() => addMutation.mutate(item as any)}
                            isAdding={addMutation.isPending}
                            alreadyInList={alreadyInList}
                            isWatched={itemWatched}
                            isWatching={itemWatching}
                            onMarkWatched={() => markWatchedMutation.mutate({ item: item as any })}
                            isMarkingWatched={markWatchedMutation.isPending}
                            onMarkWatching={() => markWatchingMutation.mutate({ item: item as any })}
                            isMarkingWatching={markWatchingMutation.isPending}
                            onDelete={itemId ? () => deleteMutation.mutate(itemId) : undefined}
                          />
                        </div>
                      );
                    })}
                  </Carousel>
                )}

                {/* Top Movies Section */}
                {topMovies.length > 0 && (
                  <Carousel title="Top Movies" count={topMovies.length} icon={<ListVideo className="h-4 w-4" />}>
                    {topMovies.map((item) => {
                      const alreadyInList = isInWatchlist(item.externalId, item.type);
                      const itemWatched = isWatched(item.externalId, item.type);
                      const itemWatching = isWatching(item.externalId, item.type);
                      const itemId = getWatchlistItemId(item.externalId, item.type);
                      return (
                        <div key={item.id} className="flex-shrink-0 w-[180px]">
                          <SearchResultCard
                            result={item}
                            onAdd={() => addMutation.mutate(item as any)}
                            isAdding={addMutation.isPending}
                            alreadyInList={alreadyInList}
                            isWatched={itemWatched}
                            isWatching={itemWatching}
                            onMarkWatched={() => markWatchedMutation.mutate({ item: item as any })}
                            isMarkingWatched={markWatchedMutation.isPending}
                            onMarkWatching={() => markWatchingMutation.mutate({ item: item as any })}
                            isMarkingWatching={markWatchingMutation.isPending}
                            onDelete={itemId ? () => deleteMutation.mutate(itemId) : undefined}
                          />
                        </div>
                      );
                    })}
                  </Carousel>
                )}

                {/* Top TV Shows Section */}
                {topShows.length > 0 && (
                  <Carousel title="Top TV Shows" count={topShows.length} icon={<ListVideo className="h-4 w-4" />}>
                    {topShows.map((item) => {
                      const alreadyInList = isInWatchlist(item.externalId, item.type);
                      const itemWatched = isWatched(item.externalId, item.type);
                      const itemWatching = isWatching(item.externalId, item.type);
                      const itemId = getWatchlistItemId(item.externalId, item.type);
                      return (
                        <div key={item.id} className="flex-shrink-0 w-[180px]">
                          <SearchResultCard
                            result={item}
                            onAdd={() => addMutation.mutate(item as any)}
                            isAdding={addMutation.isPending}
                            alreadyInList={alreadyInList}
                            isWatched={itemWatched}
                            isWatching={itemWatching}
                            onMarkWatched={() => markWatchedMutation.mutate({ item: item as any })}
                            isMarkingWatched={markWatchedMutation.isPending}
                            onMarkWatching={() => markWatchingMutation.mutate({ item: item as any })}
                            isMarkingWatching={markWatchingMutation.isPending}
                            onDelete={itemId ? () => deleteMutation.mutate(itemId) : undefined}
                          />
                        </div>
                      );
                    })}
                  </Carousel>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p>Failed to load top items</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {listLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <div className="flex gap-4 overflow-hidden">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <CardSkeleton key={j} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : watchlistItems.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                  <p className="text-lg">Your watchlist is empty</p>
                  <p className="text-sm">Use the search bar above to find and add anime, movies, or shows</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Watchlist Section - All items combined in random order */}
                {randomizedWatchlist.length > 0 && (
                  <Carousel title="Watchlist" count={randomizedWatchlist.length} icon={<ListVideo className="h-4 w-4" />}>
                    {randomizedWatchlist.map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-[180px]">
                        <WatchlistCard 
                          item={item} 
                          onDelete={() => deleteMutation.mutate(item.id)}
                          onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                          onMarkWatching={() => markWatchingMutation.mutate({ id: item.id })}
                        />
                      </div>
                    ))}
                  </Carousel>
                )}

                {/* Anime Section */}
                {animeList.length > 0 && (
                  <Carousel title="Anime" count={animeList.length} icon={<ListVideo className="h-4 w-4" />}>
                    {animeList.map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-[180px]">
                        <WatchlistCard 
                          item={item} 
                          onDelete={() => deleteMutation.mutate(item.id)}
                          onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                          onMarkWatching={() => markWatchingMutation.mutate({ id: item.id })}
                        />
                      </div>
                    ))}
                  </Carousel>
                )}

                {/* Movies Section */}
                {moviesList.length > 0 && (
                  <Carousel title="Movies" count={moviesList.length} icon={<ListVideo className="h-4 w-4" />}>
                    {moviesList.map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-[180px]">
                        <WatchlistCard 
                          item={item} 
                          onDelete={() => deleteMutation.mutate(item.id)}
                          onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                          onMarkWatching={() => markWatchingMutation.mutate({ id: item.id })}
                        />
                      </div>
                    ))}
                  </Carousel>
                )}

                {/* Shows Section */}
                {showsList.length > 0 && (
                  <Carousel title="TV Shows" count={showsList.length} icon={<ListVideo className="h-4 w-4" />}>
                    {showsList.map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-[180px]">
                        <WatchlistCard 
                          item={item} 
                          onDelete={() => deleteMutation.mutate(item.id)}
                          onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                          onMarkWatching={() => markWatchingMutation.mutate({ id: item.id })}
                        />
                      </div>
                    ))}
                  </Carousel>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

// Loading Skeleton Component
function CardSkeleton() {
  return (
    <div className="space-y-2 w-[180px]">
      <Skeleton className="h-[270px] w-full rounded-xl" />
      <div className="space-y-1">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

// Watchlist Card Component
function WatchlistCard({ item, onDelete, onMarkWatched, onMarkWatching, disableContextMenu = false, hideStatusBadge = false }: { item: WatchlistItem; onDelete: () => void; onMarkWatched?: () => void; onMarkWatching?: () => void; disableContextMenu?: boolean; hideStatusBadge?: boolean }) {
  const isWatched = item.status === 'WATCHED';
  const isWatching = item.status === 'WATCHING';
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuIdRef = useRef(`menu-${item.id}-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    if (open && position.x > 0 && position.y > 0) {
      const positionMenu = () => {
        const menuElements = document.querySelectorAll('[data-slot="dropdown-menu-content"]');
        if (menuElements.length === 0) return;
        
        // Get the last one (most recently opened)
        const menuElement = Array.from(menuElements)[menuElements.length - 1] as HTMLElement;
        
        if (menuElement) {
          // Force position to mouse location
          menuElement.style.position = 'fixed';
          menuElement.style.left = `${position.x}px`;
          menuElement.style.top = `${position.y}px`;
          menuElement.style.transform = 'translate(10px, 0)';
          menuElement.style.margin = '0';
          menuElement.style.zIndex = '9999';
          // Prevent Radix from repositioning
          menuElement.style.setProperty('--radix-dropdown-menu-content-transform-origin', 'var(--radix-popper-transform-origin)');
        }
      };
      
      // Use multiple attempts to catch the menu when it appears
      const timeout1 = setTimeout(positionMenu, 0);
      const timeout2 = setTimeout(positionMenu, 10);
      const timeout3 = setTimeout(positionMenu, 50);
      const timeout4 = setTimeout(positionMenu, 100);
      
      // Also use MutationObserver to catch when menu is added to DOM
      const observer = new MutationObserver(() => {
        positionMenu();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
        observer.disconnect();
      };
    }
  }, [open, position]);

  // Close dropdown on scroll - don't interfere with scrolling
  useEffect(() => {
    if (open) {
      const handleScroll = () => {
        // Close after scroll has happened
        setOpen(false);
        // Clean up positioned flag
        const menuElements = document.querySelectorAll('[data-slot="dropdown-menu-content"]');
        menuElements.forEach(el => {
          delete (el as HTMLElement).dataset.positioned;
        });
      };
      // Only listen to actual scroll events, not wheel (to not interfere)
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [open]);
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <div className="group relative w-[180px] space-y-2">
        <div 
          className="relative aspect-[2/3] overflow-visible rounded-xl bg-muted shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20 cursor-context-menu"
          onContextMenu={(e) => {
            if (disableContextMenu) return;
            e.preventDefault();
            e.stopPropagation();
            setPosition({ x: e.clientX, y: e.clientY });
            setOpen(true);
          }}
          onMouseDown={(e) => {
            // Prevent middle mouse button (button 1) from scrolling
            if (e.button === 1) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <DropdownMenuTrigger asChild className="hidden">
            <div />
          </DropdownMenuTrigger>
            {/* Tooltip */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-50 px-3 py-2 bg-black/90 text-white text-sm font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-[220px] break-words text-center">
              {item.title}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
            </div>

            <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 180px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                  <span className="text-sm font-medium">No Image</span>
                </div>
              )}
            </div>

            {/* Watched Badge */}
            {!hideStatusBadge && isWatched && (
              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1 text-xs font-bold text-white backdrop-blur-md shadow-sm z-10">
                <CheckCircle2 className="h-3 w-3" />
                Watched
              </div>
            )}

            {/* Watching Badge */}
            {!hideStatusBadge && isWatching && (
              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-blue-500/90 px-2 py-1 text-xs font-bold text-white backdrop-blur-md shadow-sm z-10">
                <Eye className="h-3 w-3" />
                Watching
              </div>
            )}

            {/* Hover Overlay - Remove Button Icon */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-3 pointer-events-none gap-2">
              <div className="pointer-events-auto flex items-center justify-end gap-2">
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 hover:rotate-12"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4 transition-transform duration-200" />
                </Button>
              </div>
            </div>

            {/* Rating Badge */}
            {item.rating && (
              <div className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-md flex items-center gap-1 z-10">
                <span className="text-yellow-400">★</span> {item.rating.toFixed(1)}
              </div>
            )}
          </div>
        <DropdownMenuContent 
          align="end" 
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-48 p-1 bg-background/80 backdrop-blur-xl border-border/50 shadow-xl rounded-xl"
        >
          {!isWatched && onMarkWatched && (
            <DropdownMenuItem onClick={onMarkWatched} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Watched
            </DropdownMenuItem>
          )}
          {!isWatching && onMarkWatching && (
            <DropdownMenuItem onClick={onMarkWatching} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              Mark Watching
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
        
        <div className="space-y-1.5">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground/90 min-h-[2.5rem]" title={item.title}>
            {item.title}
          </h3>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {item.year && <span>{item.year}</span>}
            {item.episodes && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <span>{item.episodes} eps</span>
              </>
            )}
          </div>
        </div>
      </div>
    </DropdownMenu>
  );
}

// Search Result Card Component
function SearchResultCard({
  result,
  onAdd,
  isAdding,
  alreadyInList,
  isWatched,
  isWatching,
  onMarkWatched,
  isMarkingWatched,
  onMarkWatching,
  isMarkingWatching,
  onDelete,
  disableContextMenu = false,
}: {
  result: UniversalSearchResult;
  onAdd: () => void;
  isAdding: boolean;
  alreadyInList: boolean;
  isWatched?: boolean;
  isWatching?: boolean;
  onMarkWatched?: () => void;
  isMarkingWatched?: boolean;
  onMarkWatching?: () => void;
  isMarkingWatching?: boolean;
  onDelete?: () => void;
  disableContextMenu?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const menuIdRef = useRef(`menu-${result.id}-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    if (open && position.x > 0 && position.y > 0) {
      const positionMenu = () => {
        const menuElements = document.querySelectorAll('[data-slot="dropdown-menu-content"]');
        if (menuElements.length === 0) return;
        
        // Get the last one (most recently opened)
        const menuElement = Array.from(menuElements)[menuElements.length - 1] as HTMLElement;
        
        if (menuElement) {
          // Force position to mouse location
          menuElement.style.position = 'fixed';
          menuElement.style.left = `${position.x}px`;
          menuElement.style.top = `${position.y}px`;
          menuElement.style.transform = 'translate(10px, 0)';
          menuElement.style.margin = '0';
          menuElement.style.zIndex = '9999';
          // Prevent Radix from repositioning
          menuElement.style.setProperty('--radix-dropdown-menu-content-transform-origin', 'var(--radix-popper-transform-origin)');
        }
      };
      
      // Use multiple attempts to catch the menu when it appears
      const timeout1 = setTimeout(positionMenu, 0);
      const timeout2 = setTimeout(positionMenu, 10);
      const timeout3 = setTimeout(positionMenu, 50);
      const timeout4 = setTimeout(positionMenu, 100);
      
      // Also use MutationObserver to catch when menu is added to DOM
      const observer = new MutationObserver(() => {
        positionMenu();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
        observer.disconnect();
      };
    }
  }, [open, position]);

  // Close dropdown on scroll - don't interfere with scrolling
  useEffect(() => {
    if (open) {
      const handleScroll = () => {
        // Close after scroll has happened
        setOpen(false);
        // Clean up positioned flag
        const menuElements = document.querySelectorAll('[data-slot="dropdown-menu-content"]');
        menuElements.forEach(el => {
          delete (el as HTMLElement).dataset.positioned;
        });
      };
      // Only listen to actual scroll events, not wheel (to not interfere)
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [open]);
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <div className="group relative w-[180px] space-y-2">
        <div 
          ref={cardRef}
          className="relative aspect-[2/3] overflow-visible rounded-xl bg-muted shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20 cursor-context-menu"
          onContextMenu={(e) => {
            if (disableContextMenu) return;
            e.preventDefault();
            e.stopPropagation();
            setPosition({ x: e.clientX, y: e.clientY });
            setOpen(true);
          }}
          onMouseDown={(e) => {
            // Prevent middle mouse button (button 1) from scrolling
            if (e.button === 1) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <DropdownMenuTrigger asChild className="hidden">
            <div />
          </DropdownMenuTrigger>
          {/* Tooltip */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-50 px-3 py-2 bg-black/90 text-white text-sm font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-[220px] break-words text-center">
            {result.title}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
          </div>

          <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
            {result.image ? (
              <Image
                src={result.image}
                alt={result.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 180px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                <span className="text-sm font-medium">No Image</span>
              </div>
            )}
          </div>

          {/* Type Badge */}
          <div className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md z-10">
            {result.type}
          </div>

          {/* Status Badge - Top Left */}
          {alreadyInList && !isWatched && !isWatching && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm z-10">
              <Check className="h-3 w-3" />
              SAVED
            </div>
          )}
          {isWatched && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm z-10">
              <CheckCircle2 className="h-3 w-3" />
              WATCHED
            </div>
          )}
          {isWatching && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-blue-500/90 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm z-10">
              <Eye className="h-3 w-3" />
              WATCHING
            </div>
          )}

          {/* Hover Overlay - Add Button */}
          {!alreadyInList && !isWatched && !isWatching && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-3 pointer-events-none gap-2">
              <div className="pointer-events-auto flex flex-col gap-2">
                <Button
                  size="sm"
                  className="h-9 w-full text-sm font-medium opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                  disabled={isAdding}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {isAdding ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          )}

          {/* Remove Button - Right Bottom */}
          {onDelete && (alreadyInList || isWatched || isWatching) && (
            <div className="absolute right-2 bottom-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none z-20">
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 pointer-events-auto hover:scale-110 hover:rotate-12"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 transition-transform duration-200" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Title and Metadata - Under the poster */}
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground/90 min-h-[2.5rem]" title={result.title}>
            {result.title}
          </h3>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {result.rating && (
              <span className="flex items-center gap-1 text-yellow-500">
                ★ {result.rating.toFixed(1)}
              </span>
            )}
            {result.year && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <span>{result.year}</span>
              </>
            )}
          </div>
        </div>
        
        <DropdownMenuContent 
          align="end" 
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-48 p-1 bg-background/80 backdrop-blur-xl border-border/50 shadow-xl rounded-xl"
        >
          {!isWatched && onMarkWatched && (
            <DropdownMenuItem onClick={onMarkWatched} disabled={isMarkingWatched} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isMarkingWatched ? 'Marking...' : 'Mark Watched'}
            </DropdownMenuItem>
          )}
          {!isWatching && onMarkWatching && (
            <DropdownMenuItem onClick={onMarkWatching} disabled={isMarkingWatching} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              {isMarkingWatching ? 'Marking...' : 'Mark Watching'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}
