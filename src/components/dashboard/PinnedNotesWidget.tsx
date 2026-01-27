'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { usePinnedNotes } from '@/lib/hooks/useNotes';
import { Pin, FileText, ChevronRight } from 'lucide-react';

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
    content?: string | null;
  };
}) {
  const preview = note.content ? stripHtml(note.content).slice(0, 50) : '';

  return (
    <Link href={`/notes?note=${note.id}`}>
      <div className="group flex items-start gap-2 py-2 px-2.5 border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer">
        <Pin className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-0.5">
          <h4 className="font-semibold text-xs line-clamp-1 group-hover:text-primary transition-colors">
            {note.title || 'Untitled'}
          </h4>
          {preview && (
            <p className="text-[0.65rem] text-muted-foreground line-clamp-1">
              {preview}
            </p>
          )}
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </Link>
  );
});

const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="flex items-start gap-2 py-2 px-2.5 border-b border-border/40 last:border-0">
      <div className="w-3.5 h-3.5 rounded bg-muted/30 animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-3/4 bg-muted/30 rounded animate-pulse" />
        <div className="h-2.5 w-full bg-muted/20 rounded animate-pulse" />
        <div className="h-2.5 w-12 bg-muted/20 rounded animate-pulse" />
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
          <div className="px-2.5 py-2 border-b border-border/40">
            <h3 className="font-semibold text-xs flex items-center gap-1.5">
              <Pin className="h-3.5 w-3.5 text-yellow-500" />
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
          <div className="px-2.5 py-2 border-b border-border/40">
            <h3 className="font-semibold text-xs flex items-center gap-1.5">
              <Pin className="h-3.5 w-3.5 text-yellow-500" />
              Pinned Notes
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-6 px-3 text-center">
            <FileText className="h-7 w-7 text-muted-foreground/40 mb-1.5" />
            <p className="text-xs text-muted-foreground">No pinned notes</p>
            <p className="text-[0.65rem] text-muted-foreground/80 mt-0.5">
              Pin notes to see them here
            </p>
          </div>
          <Link
            href="/notes"
            className="flex items-center justify-center gap-1 py-2 text-[0.65rem] text-primary hover:bg-accent/50 transition-colors border-t border-border/40 uppercase tracking-wide font-medium"
          >
            View All Notes
            <ChevronRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="px-2.5 py-2 border-b border-border/40">
          <h3 className="font-semibold text-xs flex items-center gap-1.5">
            <Pin className="h-3.5 w-3.5 text-yellow-500" />
            Pinned Notes
          </h3>
        </div>
        <div className="divide-y divide-border/40">
          {notes.map((note) => (
            <PinnedNoteCard key={note.id} note={{ id: note.id, title: note.title, content: note.content }} />
          ))}
        </div>
        <Link
          href="/notes"
          className="flex items-center justify-center gap-1 py-2 text-[0.65rem] text-primary hover:bg-accent/50 transition-colors border-t border-border/40 uppercase tracking-wide font-medium"
        >
          View All Notes
          <ChevronRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
});
