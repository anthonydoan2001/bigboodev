import { Folder, Note, NoteAttachment } from '@prisma/client';

// Lightweight task for note editor
export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: Date | null;
}

// Note for list views (optimized, no full content/attachments)
export interface NoteListItem {
  id: string;
  title: string;
  content?: string; // Optional - only included when searching
  folderId: string | null;
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  folder?: { id: string; name: string } | null;
  _count?: { attachments: number; taskNotes: number };
}

// Extended Note type with relations (for detail view)
export interface NoteWithRelations extends Note {
  folder?: { id: string; name: string } | null;
  attachments: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    createdAt: Date;
  }[];
  taskNotes: { taskId: string; noteId: string; task: TaskSummary }[];
}

// Folder with nested children
export interface FolderWithChildren extends Folder {
  children: FolderWithChildren[];
  notes?: Note[];
  _count?: { notes: number };
}

// Folder tree structure for rendering
export interface FolderTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderTreeNode[];
  noteCount: number;
  isPinned: boolean;
}

// Input types for creating/updating
export interface CreateNoteInput {
  title: string;
  content?: string;
  folderId?: string | null;
  isPinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  folderId?: string | null;
  isPinned?: boolean;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: string | null;
  isPinned?: boolean;
}

// Attachment input
export interface CreateAttachmentInput {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

// API Response types
export interface NotesListResponse {
  items: NoteListItem[];
  counts?: {
    total: number;
    trashed: number;
  };
}

export interface NoteResponse {
  item: NoteWithRelations;
}

export interface FoldersResponse {
  items: FolderWithChildren[];
  tree: FolderTreeNode[];
}

export interface FolderResponse {
  item: FolderWithChildren;
}

export interface AttachmentResponse {
  item: NoteAttachment;
}

// Filter types
export interface NotesFilters {
  folderId?: string | null;
  isPinned?: boolean;
  isDeleted?: boolean;
  search?: string;
}

// For Tiptap editor
export type EditorContentJSON = {
  type: string;
  content?: EditorContentJSON[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
};
