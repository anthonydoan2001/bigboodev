'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, BookOpen } from 'lucide-react';
import { Collection } from '@/lib/hooks/useKomga';

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const router = useRouter();
  const itemsCount = collection.items?.length || 0;

  const handleClick = () => {
    router.push(`/manga/collections/${collection.id}`);
  };

  return (
    <div className="group relative space-y-2 w-full flex flex-col">
      <Card 
        className="cursor-pointer transition-all duration-300 hover:shadow-md hover:ring-2 hover:ring-primary/20"
        onClick={handleClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-body-sm font-semibold leading-snug text-foreground/90 mb-1">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-caption text-muted-foreground line-clamp-2 mb-2">
                  {collection.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-caption text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
