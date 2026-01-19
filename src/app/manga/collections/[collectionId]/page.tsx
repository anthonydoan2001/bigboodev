'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection } from '@/lib/hooks/useKomga';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollectionItemListItem } from '@/components/komga/CollectionItemListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export default function CollectionDetailPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const resolvedParams = use(params);
  const collectionId = resolvedParams.collectionId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: collection, isLoading, error, refetch } = useCollection(collectionId);
  
  // Refresh collection data on mount to ensure we have latest imageUrl
  useEffect(() => {
    if (collectionId) {
      queryClient.invalidateQueries({ queryKey: ['komga', 'collection', collectionId] });
      refetch();
    }
  }, [collectionId, queryClient, refetch]);
  
  // Debug logging
  useEffect(() => {
    if (collection) {
      console.log('Collection loaded:', {
        id: collection.id,
        name: collection.name,
        imageUrl: collection.imageUrl,
        hasImageUrl: !!collection.imageUrl
      });
    }
  }, [collection]);

  if (error) {
    return (
      <div className="w-full min-h-screen py-8 px-4 md:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-body-sm text-destructive">
              Failed to load collection. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full min-h-screen py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="w-full flex gap-6">
          {/* Left Side - Collection Info */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <Skeleton className="h-10 w-10 rounded mb-4" />
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          {/* Right Side - Items List */}
          <div className="flex-1 space-y-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="py-1 px-2">
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="w-full min-h-screen py-8 px-4 md:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-body-sm text-muted-foreground">
              Collection not found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group items by phase
  const itemsByPhase = collection.items.reduce((acc, item) => {
    const phase = item.phase || 'Uncategorized';
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(item);
    return acc;
  }, {} as Record<string, typeof collection.items>);

  const phases = Object.keys(itemsByPhase).sort();
  const totalItems = collection.items.length;

  return (
    <div className="w-full min-h-screen py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full flex gap-6">
        {/* Left Side - Collection Info */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/manga/collections')}
            className="h-10 w-10 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-muted">
            {collection.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={collection.imageUrl}
                  alt={collection.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onLoad={() => {
                    console.log('✅ Collection image loaded successfully:', collection.imageUrl);
                  }}
                  onError={(e) => {
                    console.error('❌ Failed to load collection image:', {
                      imageUrl: collection.imageUrl,
                      attemptedSrc: (e.target as HTMLImageElement).src,
                      error: e
                    });
                    const target = e.target as HTMLImageElement;
                    const fallback = document.getElementById('fallback-icon');
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                    target.style.display = 'none';
                  }}
                />
                <div 
                  id="fallback-icon"
                  className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none bg-muted"
                  style={{ display: 'none' }}
                >
                  <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-semibold">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground">
              {collection.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Right Side - Items List by Phase */}
        <div className="flex-1">
          {phases.length > 0 ? (
            <div className="space-y-6">
              {phases.map((phase) => (
                <div key={phase} className="space-y-2">
                  <h2 className="text-heading font-semibold">{phase}</h2>
                  <div className="space-y-0.5">
                    {itemsByPhase[phase].map((item) => (
                      <CollectionItemListItem key={item.id} item={item} collectionId={collectionId} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <p>No items in this collection</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
