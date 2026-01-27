'use client';

import { memo, useState } from 'react';
import { NoteListItem } from '@/types/notes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Trash2, RotateCcw, AlertTriangle, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TrashViewProps {
  notes: NoteListItem[];
  onRestore: (noteId: string) => void;
  onPermanentDelete: (noteId: string) => void;
  onEmptyTrash: () => void;
  isRestoring?: boolean;
  isDeleting?: boolean;
}

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

const TrashedNoteCard = memo(function TrashedNoteCard({
  note,
  onRestore,
  onDelete,
  isRestoring,
  isDeleting,
}: {
  note: NoteListItem;
  onRestore: () => void;
  onDelete: () => void;
  isRestoring?: boolean;
  isDeleting?: boolean;
}) {
  const preview = note.content ? stripHtml(note.content).slice(0, 100) : '';
  const deletedAt = note.deletedAt
    ? formatDistanceToNow(new Date(note.deletedAt), { addSuffix: true })
    : 'Unknown';

  return (
    <Card className="p-4 space-y-3 border border-border hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">
            {note.title || 'Untitled'}
          </h3>
          {preview && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {preview}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Calendar className="h-3 w-3" />
            <span>Deleted {deletedAt}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRestore}
            disabled={isRestoring}
            className="gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
});

export function TrashView({
  notes,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
  isRestoring,
  isDeleting,
}: TrashViewProps) {
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const handlePermanentDelete = (noteId: string) => {
    setNoteToDelete(noteId);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      onPermanentDelete(noteToDelete);
      setNoteToDelete(null);
    }
  };

  const handleEmptyTrash = () => {
    onEmptyTrash();
    setShowEmptyConfirm(false);
  };

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Trash2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-muted-foreground">Trash is empty</h3>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Deleted notes will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="font-semibold">Trash</h2>
          <p className="text-sm text-muted-foreground">
            {notes.length} deleted note{notes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowEmptyConfirm(true)}
          className="gap-1"
        >
          <Trash2 className="h-4 w-4" />
          Empty Trash
        </Button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {notes.map((note) => (
          <TrashedNoteCard
            key={note.id}
            note={note}
            onRestore={() => onRestore(note.id)}
            onDelete={() => handlePermanentDelete(note.id)}
            isRestoring={isRestoring}
            isDeleting={isDeleting}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently Delete Note
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The note and all its attachments will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty Trash Confirmation Dialog */}
      <Dialog open={showEmptyConfirm} onOpenChange={setShowEmptyConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Empty Trash
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all {notes.length} note{notes.length !== 1 ? 's' : ''} in the trash.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmptyConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEmptyTrash}>
              Empty Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
