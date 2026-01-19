'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCollections } from '@/lib/hooks/useKomga';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Loader2, ArrowLeft } from 'lucide-react';
import { CollectionListItem } from '@/components/komga/CollectionListItem';
import { getAuthHeaders } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

export default function CollectionsPage() {
  const { data: collections, isLoading, error } = useCollections();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const handleSeedSecretWars = async () => {
    setIsSeeding(true);
    setSeedError(null);
    
    try {
      const res = await fetch('/api/komga/collections/seed/secret-wars', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to seed collection');
      }

      // Refresh collections
      queryClient.invalidateQueries({ queryKey: ['komga', 'collections'] });
      
      alert(`Success! ${data.message || 'Secret Wars collection created successfully.'}`);
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : 'Failed to seed collection');
      console.error('Error seeding Secret Wars:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  if (error) {
    return (
      <div className="w-full min-h-screen py-8 px-4 md:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-body-sm text-destructive">
              Failed to load collections. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasSecretWars = collections?.some(c => c.name === 'Secret Wars');

  return (
    <div className="w-full min-h-screen py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/manga')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-title font-semibold">Collections</h1>
            </div>
          </div>
          {!hasSecretWars && (
            <Button
              onClick={handleSeedSecretWars}
              disabled={isSeeding}
              variant="outline"
              size="sm"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                'Seed Secret Wars'
              )}
            </Button>
          )}
        </div>

        {seedError && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <p className="text-body-sm text-destructive">{seedError}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="py-2 px-3 flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : !collections || collections.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <p className="text-muted-foreground">No collections found</p>
              {!hasSecretWars && (
                <Button
                  onClick={handleSeedSecretWars}
                  disabled={isSeeding}
                  variant="default"
                  size="sm"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    'Seed Secret Wars Collection'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-0.5">
            {collections.map((collection) => (
              <CollectionListItem key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
