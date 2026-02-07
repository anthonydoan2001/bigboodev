import { getAuthHeaders } from '@/lib/api-client';
import {
  NotesListResponse,
  NoteResponse,
  FoldersResponse,
  FolderResponse,
  AttachmentResponse,
  NotesFilters,
  CreateNoteInput,
  UpdateNoteInput,
  CreateFolderInput,
  UpdateFolderInput,
} from '@/types/notes';
import { Task, Note } from '@prisma/client';

const BASE_URL = '/api';

// Helper to build query string
function buildQueryString(filters?: NotesFilters, includeCounts?: boolean): string {
  const params = new URLSearchParams();

  if (filters) {
    // Only send folderId if it's a specific folder ID (not null/undefined)
    // null/undefined means "all notes" - don't filter by folder
    if (filters.folderId) {
      params.set('folderId', filters.folderId);
    }
    if (filters.isPinned !== undefined) params.set('isPinned', String(filters.isPinned));
    if (filters.isDeleted !== undefined) params.set('isDeleted', String(filters.isDeleted));
    if (filters.search) params.set('search', filters.search);
  }

  if (includeCounts) {
    params.set('includeCounts', 'true');
  }

  const str = params.toString();
  return str ? `?${str}` : '';
}

// ============ Notes API ============

export async function fetchNotes(filters?: NotesFilters, includeCounts?: boolean): Promise<NotesListResponse> {
  const res = await fetch(`${BASE_URL}/notes${buildQueryString(filters, includeCounts)}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
}

export async function fetchNote(id: string): Promise<NoteResponse> {
  const res = await fetch(`${BASE_URL}/notes/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch note');
  return res.json();
}

export async function createNote(input: CreateNoteInput): Promise<NoteResponse> {
  const res = await fetch(`${BASE_URL}/notes`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create note');
  }
  return res.json();
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<NoteResponse> {
  const res = await fetch(`${BASE_URL}/notes/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update note');
  }
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete note');
}

export async function restoreNote(id: string): Promise<NoteResponse> {
  const res = await fetch(`${BASE_URL}/notes/${id}/restore`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to restore note');
  return res.json();
}

export async function permanentDeleteNote(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notes/${id}/permanent`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to permanently delete note');
}

// ============ Folders API ============

export async function fetchFolders(): Promise<FoldersResponse> {
  const res = await fetch(`${BASE_URL}/folders`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch folders');
  return res.json();
}

export async function createFolder(input: CreateFolderInput): Promise<FolderResponse> {
  const res = await fetch(`${BASE_URL}/folders`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create folder');
  }
  return res.json();
}

export async function updateFolder(id: string, input: UpdateFolderInput): Promise<FolderResponse> {
  const res = await fetch(`${BASE_URL}/folders/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update folder');
  }
  return res.json();
}

export async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/folders/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete folder');
  }
}

// ============ Attachments API ============

export async function uploadAttachment(noteId: string, file: File): Promise<AttachmentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const headers = getAuthHeaders();
  // Don't set Content-Type for FormData - browser sets it with boundary
  delete (headers as Record<string, string>)['Content-Type'];

  const res = await fetch(`${BASE_URL}/notes/${noteId}/attachments`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to upload attachment');
  }
  return res.json();
}

export async function deleteAttachment(noteId: string, attachmentId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notes/${noteId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete attachment');
}

// ============ Task-Note Linking API ============

export async function getNoteTasks(noteId: string): Promise<{ items: { taskId: string; task: Task }[] }> {
  const res = await fetch(`${BASE_URL}/notes/${noteId}/tasks`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch linked tasks');
  return res.json();
}

export async function linkTaskToNote(noteId: string, taskId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notes/${noteId}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ taskId }),
  });
  if (!res.ok) throw new Error('Failed to link task to note');
}

export async function unlinkTaskFromNote(noteId: string, taskId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notes/${noteId}/tasks?taskId=${taskId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to unlink task from note');
}

export async function getTaskNotes(taskId: string): Promise<{ items: { noteId: string; note: Note }[] }> {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}/notes`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch linked notes');
  return res.json();
}

export async function linkNoteToTask(taskId: string, noteId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}/notes`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ noteId }),
  });
  if (!res.ok) throw new Error('Failed to link note to task');
}

// ============ Pinned Notes (for dashboard widget) ============

export async function fetchPinnedNotes(limit: number = 3): Promise<NotesListResponse> {
  const res = await fetch(`${BASE_URL}/notes?isPinned=true&limit=${limit}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch pinned notes');
  return res.json();
}
