'use client';

import { Button } from '@/components/ui/button';
import { Bookmark, Trash2, X } from 'lucide-react';

interface BookmarkItem {
  id: string;
  cfi: string;
  label?: string | null;
  progress: number;
}

interface PdfBookmarksSidebarProps {
  bookmarks: BookmarkItem[];
  onNavigate: (page: number) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function PdfBookmarksSidebar({ bookmarks, onNavigate, onRemove, onClose }: PdfBookmarksSidebarProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l z-[70] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Bookmarks</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-4 text-center">
              No bookmarks yet. Use the bookmark button to add one.
            </p>
          ) : (
            <div className="space-y-1">
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="group flex items-center gap-2 p-2.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    const page = parseInt(bm.cfi.replace('page:', ''), 10);
                    if (!isNaN(page)) {
                      onNavigate(page);
                      onClose();
                    }
                  }}
                >
                  <Bookmark className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {bm.label || `Page ${bm.cfi.replace('page:', '')}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(bm.progress * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(bm.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
