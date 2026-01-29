'use client';

import { memo } from 'react';
import { NoteListItem, FolderTreeNode } from '@/types/notes';
import { Card } from '@/components/ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Pin,
  PinOff,
  FileText,
  Calendar,
  Tag,
  Trash2,
  Copy,
  FolderOpen,
  Folder,
  FolderInput,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface NotesListProps {
  notes: NoteListItem[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onPinNote?: (noteId: string, isPinned: boolean) => void;
  onMoveNote?: (noteId: string, folderId: string | null) => void;
  onDuplicateNote?: (noteId: string) => void;
  folders?: FolderTreeNode[];
  isLoading?: boolean;
}

const NoteCard = memo(function NoteCard({
  note,
  isSelected,
  onClick,
  onDelete,
  onPin,
  onMove,
  onDuplicate,
  folders,
}: {
  note: NoteListItem;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onPin?: (isPinned: boolean) => void;
  onMove?: (folderId: string | null) => void;
  onDuplicate?: () => void;
  folders?: FolderTreeNode[];
}) {
  const hasTags = note.tags && note.tags.length > 0;
  const attachmentCount = note._count?.attachments || 0;
  const taskNoteCount = note._count?.taskNotes || 0;

  // Render folder tree recursively for move submenu
  const renderFolderItems = (items: FolderTreeNode[], level = 0) => {
    return items.map((folder) => (
      <div key={folder.id}>
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onMove?.(folder.id);
          }}
          disabled={note.folderId === folder.id}
          className={cn(level > 0 && 'pl-6')}
        >
          <Folder className="h-4 w-4" />
          <span className="truncate">{folder.name}</span>
          {note.folderId === folder.id && (
            <span className="ml-auto text-xs text-muted-foreground">(current)</span>
          )}
        </ContextMenuItem>
        {folder.children && folder.children.length > 0 && (
          <div className="ml-2">
            {renderFolderItems(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          className={cn(
            'p-2 cursor-pointer hover:shadow-md transition-all duration-200 border group',
            isSelected
              ? 'border-primary bg-accent shadow-sm ring-1 ring-primary/20'
              : 'border-border hover:border-primary/50 hover:bg-accent/30'
          )}
          onClick={onClick}
        >
          <div className="space-y-1.5">
            {/* Title Row */}
            <div className="flex items-start gap-1.5">
              {note.isPinned && (
                <Pin className="h-3.5 w-3.5 text-favorite fill-favorite/20 flex-shrink-0 mt-0.5" />
              )}
              <h3
                className={cn(
                  'font-semibold text-[13px] leading-tight line-clamp-2 flex-1',
                  !note.title && 'text-muted-foreground italic font-normal'
                )}
              >
                {note.title || 'Untitled Note'}
              </h3>
            </div>

            {/* Tags & Folder - Combined row */}
            {(hasTags || note.folder) && (
              <div className="flex flex-wrap items-center gap-1">
                {note.tags.slice(0, 2).map((noteTag) => (
                  <span
                    key={noteTag.tag.id}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border"
                    style={{
                      backgroundColor: noteTag.tag.color + '12',
                      borderColor: noteTag.tag.color + '30',
                      color: noteTag.tag.color,
                    }}
                  >
                    {noteTag.tag.name}
                  </span>
                ))}
                {note.tags.length > 2 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted/50 text-muted-foreground border border-border/50">
                    +{note.tags.length - 2}
                  </span>
                )}
                {note.folder && (
                  <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Folder className="h-2.5 w-2.5" />
                    <span className="truncate max-w-[80px]">{note.folder.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer - Compact stats */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(note.updatedAt), 'MMM d')}</span>
              </div>
              {attachmentCount > 0 && (
                <>
                  <div className="w-px h-2.5 bg-border" />
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{attachmentCount}</span>
                  </div>
                </>
              )}
              {taskNoteCount > 0 && (
                <>
                  <div className="w-px h-2.5 bg-border" />
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>{taskNoteCount}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        {/* Pin/Unpin */}
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onPin?.(!note.isPinned);
          }}
        >
          {note.isPinned ? (
            <>
              <PinOff className="h-4 w-4" />
              <span>Unpin</span>
            </>
          ) : (
            <>
              <Pin className="h-4 w-4" />
              <span>Pin to top</span>
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Move to folder */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput className="h-4 w-4" />
            <span>Move to folder</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 max-h-64 overflow-y-auto">
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onMove?.(null);
              }}
              disabled={!note.folderId}
            >
              <FolderOpen className="h-4 w-4" />
              <span>No folder</span>
              {!note.folderId && (
                <span className="ml-auto text-xs text-muted-foreground">(current)</span>
              )}
            </ContextMenuItem>
            {folders && folders.length > 0 && (
              <>
                <ContextMenuSeparator />
                {renderFolderItems(folders)}
              </>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Duplicate */}
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate?.();
          }}
        >
          <Copy className="h-4 w-4" />
          <span>Duplicate</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Delete */}
        <ContextMenuItem
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span>Move to Trash</span>
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

const NoteSkeleton = memo(function NoteSkeleton() {
  return (
    <Card className="p-2 space-y-1.5 border border-border">
      <div className="h-3.5 w-3/4 bg-muted/50 rounded animate-pulse" />
      <div className="h-2.5 w-1/2 bg-muted/30 rounded animate-pulse" />
      <div className="flex gap-2">
        <div className="h-2.5 w-12 bg-muted/30 rounded animate-pulse" />
        <div className="h-2.5 w-8 bg-muted/30 rounded animate-pulse" />
      </div>
    </Card>
  );
});

export function NotesList({
  notes,
  selectedNoteId,
  onSelectNote,
  onDeleteNote,
  onPinNote,
  onMoveNote,
  onDuplicateNote,
  folders,
  isLoading,
}: NotesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1.5 p-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <NoteSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-muted-foreground">No notes yet</h3>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Create your first note to get started
        </p>
      </div>
    );
  }

  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);

  return (
    <div className="h-full overflow-auto p-1.5 space-y-1.5">
      {pinnedNotes.length > 0 && (
        <div className="space-y-1.5">
          <div className="px-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Pin className="h-2.5 w-2.5" />
            Pinned
          </div>
          {pinnedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onClick={() => onSelectNote(note.id)}
              onDelete={onDeleteNote ? () => onDeleteNote(note.id) : undefined}
              onPin={onPinNote ? (isPinned) => onPinNote(note.id, isPinned) : undefined}
              onMove={onMoveNote ? (folderId) => onMoveNote(note.id, folderId) : undefined}
              onDuplicate={onDuplicateNote ? () => onDuplicateNote(note.id) : undefined}
              folders={folders}
            />
          ))}
        </div>
      )}

      {unpinnedNotes.length > 0 && (
        <div className="space-y-1.5">
          {pinnedNotes.length > 0 && (
            <div className="px-1 pt-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              All Notes
            </div>
          )}
          {unpinnedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onClick={() => onSelectNote(note.id)}
              onDelete={onDeleteNote ? () => onDeleteNote(note.id) : undefined}
              onPin={onPinNote ? (isPinned) => onPinNote(note.id, isPinned) : undefined}
              onMove={onMoveNote ? (folderId) => onMoveNote(note.id, folderId) : undefined}
              onDuplicate={onDuplicateNote ? () => onDuplicateNote(note.id) : undefined}
              folders={folders}
            />
          ))}
        </div>
      )}
    </div>
  );
}
