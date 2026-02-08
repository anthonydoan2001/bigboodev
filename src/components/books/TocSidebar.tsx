'use client';

import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from 'epubjs';

interface TocSidebarProps {
  toc: NavItem[];
  currentChapter?: string;
  onNavigate: (href: string) => void;
  onClose: () => void;
}

function TocItem({
  item,
  currentChapter,
  onNavigate,
  depth = 0,
}: {
  item: NavItem;
  currentChapter?: string;
  onNavigate: (href: string) => void;
  depth?: number;
}) {
  const isCurrent = currentChapter === item.href;

  return (
    <>
      <button
        onClick={() => onNavigate(item.href)}
        className={cn(
          'w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors',
          isCurrent && 'bg-muted font-medium text-primary'
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {item.label.trim()}
      </button>
      {item.subitems?.map((sub) => (
        <TocItem
          key={sub.href}
          item={sub}
          currentChapter={currentChapter}
          onNavigate={onNavigate}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

export function TocSidebar({ toc, currentChapter, onNavigate, onClose }: TocSidebarProps) {
  const [search, setSearch] = useState('');

  const filteredToc = useMemo(() => {
    if (!search.trim()) return toc;
    const query = search.toLowerCase();

    function filterItems(items: NavItem[]): NavItem[] {
      return items.reduce<NavItem[]>((acc, item) => {
        const matchesLabel = item.label.toLowerCase().includes(query);
        const filteredSubs = item.subitems ? filterItems(item.subitems) : [];

        if (matchesLabel || filteredSubs.length > 0) {
          acc.push({ ...item, subitems: filteredSubs.length > 0 ? filteredSubs : item.subitems });
        }
        return acc;
      }, []);
    }

    return filterItems(toc);
  }, [toc, search]);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l z-[70] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Table of Contents</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chapters..."
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {filteredToc.map((item) => (
            <TocItem
              key={item.href}
              item={item}
              currentChapter={currentChapter}
              onNavigate={(href) => {
                onNavigate(href);
                onClose();
              }}
            />
          ))}
          {filteredToc.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-2">
              {search ? 'No matching chapters' : 'No table of contents available'}
            </p>
          )}
        </nav>
      </div>
    </>
  );
}
