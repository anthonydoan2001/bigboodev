'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PdfOutlineItem {
  title: string;
  dest: string | unknown[] | null;
  items: PdfOutlineItem[];
  bold: boolean;
  italic: boolean;
}

interface PdfTocSidebarProps {
  outline: PdfOutlineItem[];
  currentPage: number;
  onNavigate: (page: number) => void;
  onClose: () => void;
  resolveDestination: (dest: unknown) => Promise<number | null>;
}

function TocItem({
  item,
  currentPage,
  onNavigate,
  resolveDestination,
  depth = 0,
}: {
  item: PdfOutlineItem;
  currentPage: number;
  onNavigate: (page: number) => void;
  resolveDestination: (dest: unknown) => Promise<number | null>;
  depth?: number;
}) {
  const [pageNum, setPageNum] = useState<number | null>(null);
  const resolved = useRef(false);

  useEffect(() => {
    if (resolved.current || !item.dest) return;
    resolved.current = true;
    resolveDestination(item.dest).then(setPageNum);
  }, [item.dest, resolveDestination]);

  const isCurrent = pageNum !== null && pageNum === currentPage;

  return (
    <>
      <button
        onClick={() => {
          if (pageNum !== null) onNavigate(pageNum);
        }}
        className={cn(
          'w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between gap-2',
          isCurrent && 'bg-muted font-medium text-primary',
          item.bold && 'font-semibold',
          item.italic && 'italic',
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        disabled={pageNum === null}
      >
        <span className="truncate">{item.title}</span>
        {pageNum !== null && (
          <span className="text-xs text-muted-foreground flex-shrink-0">{pageNum}</span>
        )}
      </button>
      {item.items?.map((sub, i) => (
        <TocItem
          key={`${sub.title}-${i}`}
          item={sub}
          currentPage={currentPage}
          onNavigate={onNavigate}
          resolveDestination={resolveDestination}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

export function PdfTocSidebar({
  outline,
  currentPage,
  onNavigate,
  onClose,
  resolveDestination,
}: PdfTocSidebarProps) {
  const [search, setSearch] = useState('');

  const filteredOutline = useMemo(() => {
    if (!search.trim()) return outline;
    const query = search.toLowerCase();

    function filterItems(items: PdfOutlineItem[]): PdfOutlineItem[] {
      return items.reduce<PdfOutlineItem[]>((acc, item) => {
        const matchesTitle = item.title.toLowerCase().includes(query);
        const filteredSubs = item.items ? filterItems(item.items) : [];

        if (matchesTitle || filteredSubs.length > 0) {
          acc.push({ ...item, items: filteredSubs.length > 0 ? filteredSubs : item.items });
        }
        return acc;
      }, []);
    }

    return filterItems(outline);
  }, [outline, search]);

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
          {filteredOutline.map((item, i) => (
            <TocItem
              key={`${item.title}-${i}`}
              item={item}
              currentPage={currentPage}
              onNavigate={(page) => {
                onNavigate(page);
                onClose();
              }}
              resolveDestination={resolveDestination}
            />
          ))}
          {filteredOutline.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-2">
              {search ? 'No matching chapters' : 'No table of contents available'}
            </p>
          )}
        </nav>
      </div>
    </>
  );
}
