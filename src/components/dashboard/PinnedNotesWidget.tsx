'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { usePinnedNotes } from '@/lib/hooks/useNotes';
import { Pin, FileText, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';

// Strip HTML tags for preview
function stripHtml(html: string): string {
  const tmp = typeof document !== 'undefined'
    ? document.createElement('div')
    : null;
  if (tmp) {
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  return html.replace(/<[^>]*>/g, '');
}

const PinnedNoteCard = memo(function PinnedNoteCard({
  note,
}: {
  note: {
    id: string;
    title: string;
    content: string;
    updatedAt: Date | string;
    tags: { tag: { id: string; name: string; color: string } }[];
  };
}) {
  const preview = stripHtml(note.content).slice(0, 80);
  const hasTags = note.tags && note.tags.length > 0;

  return (
    <Link href={`/notes?note=${note.id}`}>
      <div className="group flex items-start gap-3 py-3 px-3.5 border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer">
        <Pin className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="font-medium text-body-sm line-clamp-1 group-hover:text-primary transition-colors">
            {note.title || 'Untitled'}
          </h4>
          {preview && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {preview}
            </p>
          )}
          <div className="flex items-center gap-2">
            {hasTags && (
              <div className="flex gap-1">
                {note.tags.slice(0, 2).map((noteTag) => (
                  <span
                    key={noteTag.tag.id}
                    className="inline-block px-1.5 py-0.5 rounded text-[10px]"
                    style={{
                      backgroundColor: noteTag.tag.color + '20',
                      color: noteTag.tag.color,
                    }}
                  >
                    {noteTag.tag.name}
                  </span>
                ))}
              </div>
            )}
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(note.updatedAt), 'MMM d')}
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </Link>
  );
});

const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="flex items-start gap-3 py-3 px-3.5 border-b border-border/40 last:border-0">
      <div className="w-4 h-4 rounded bg-muted/30 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-muted/30 rounded animate-pulse" />
        <div className="h-3 w-full bg-muted/20 rounded animate-pulse" />
        <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
      </div>
    </div>
  );
});

export const PinnedNotesWidget = memo(function PinnedNotesWidget() {
  const { notes, isLoading, error } = usePinnedNotes(3);

  if (isLoading) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
        <CardContent className="p-0">
          <div className="px-3.5 py-2.5 border-b border-border/40">
            <h3 className="font-semibold text-body-sm flex items-center gap-2">
              <Pin className="h-4 w-4 text-yellow-500" />
              Pinned Notes
            </h3>
          </div>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
        <CardContent className="p-4">
          <p className="text-body-sm text-muted-foreground text-center">
            Failed to load pinned notes
          </p>
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
        <CardContent className="p-0">
          <div className="px-3.5 py-2.5 border-b border-border/40">
            <h3 className="font-semibold text-body-sm flex items-center gap-2">
              <Pin className="h-4 w-4 text-yellow-500" />
              Pinned Notes
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No pinned notes</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Pin notes to see them here
            </p>
          </div>
          <Link
            href="/notes"
            className="flex items-center justify-center gap-1 py-2.5 text-xs text-primary hover:bg-accent/50 transition-colors border-t border-border/40"
          >
            View All Notes
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
      <CardContent className="p-0">
        <div className="px-3.5 py-2.5 border-b border-border/40">
          <h3 className="font-semibold text-body-sm flex items-center gap-2">
            <Pin className="h-4 w-4 text-yellow-500" />
            Pinned Notes
          </h3>
        </div>
        <div className="divide-y divide-border/40">
          {notes.map((note) => (
            <PinnedNoteCard key={note.id} note={note as any} />
          ))}
        </div>
        <Link
          href="/notes"
          className="flex items-center justify-center gap-1 py-2.5 text-xs text-primary hover:bg-accent/50 transition-colors border-t border-border/40"
        >
          View All Notes
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
});
