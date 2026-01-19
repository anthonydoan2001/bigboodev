'use client';

import { useRouter } from 'next/navigation';
import { Collection } from '@/lib/hooks/useKomga';
import { FolderOpen } from 'lucide-react';

interface CollectionListItemProps {
  collection: Collection;
}

export function CollectionListItem({ collection }: CollectionListItemProps) {
  const router = useRouter();
  const itemsCount = collection.items?.length || 0;

  const handleClick = () => {
    router.push(`/manga/collections/${collection.id}`);
  };

  return (
    <div 
      className="py-2 px-3 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer rounded-sm"
      onClick={handleClick}
    >
      <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate">{collection.name}</h3>
        {collection.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {collection.description}
          </p>
        )}
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
      </span>
    </div>
  );
}
