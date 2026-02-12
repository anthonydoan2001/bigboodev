'use client';

import { X, Trash2, Bookmark, Highlighter, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HIGHLIGHT_DOT_COLORS } from '../shared/constants';
import type { BookAnnotation, BookBookmark } from '@/types/calibre-web';

interface AnnotationsSidebarProps {
  annotations: BookAnnotation[];
  bookmarks: BookBookmark[];
  onNavigateAnnotation: (cfiRange: string) => void;
  onNavigateBookmark: (cfi: string) => void;
  onEditAnnotation: (annotation: BookAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onClose: () => void;
}

export function AnnotationsSidebar({
  annotations,
  bookmarks,
  onNavigateAnnotation,
  onNavigateBookmark,
  onEditAnnotation,
  onDeleteAnnotation,
  onDeleteBookmark,
  onClose,
}: AnnotationsSidebarProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l z-[70] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Annotations</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <Tabs defaultValue="highlights" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-2 grid w-auto grid-cols-2">
            <TabsTrigger value="highlights" className="text-xs">
              <Highlighter className="h-3.5 w-3.5 mr-1.5" />
              Highlights ({annotations.length})
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="text-xs">
              <Bookmark className="h-3.5 w-3.5 mr-1.5" />
              Bookmarks ({bookmarks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="highlights" className="flex-1 overflow-y-auto px-2 py-2 mt-0">
            {annotations.length === 0 ? (
              <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                No highlights yet. Select text to create one.
              </p>
            ) : (
              <div className="space-y-1">
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className="group p-2.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onNavigateAnnotation(ann.cfiRange)}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: HIGHLIGHT_DOT_COLORS[ann.color] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{ann.text}</p>
                        {ann.note && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 flex-shrink-0" />
                            <span className="line-clamp-1">{ann.note}</span>
                          </p>
                        )}
                        {ann.chapter && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{ann.chapter}</p>
                        )}
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditAnnotation(ann);
                          }}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAnnotation(ann.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="flex-1 overflow-y-auto px-2 py-2 mt-0">
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
                    onClick={() => onNavigateBookmark(bm.cfi)}
                  >
                    <Bookmark className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {bm.label || bm.chapter || `${Math.round(bm.progress * 100)}%`}
                      </p>
                      {bm.chapter && bm.label && (
                        <p className="text-xs text-muted-foreground/60 truncate">{bm.chapter}</p>
                      )}
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
                        onDeleteBookmark(bm.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
