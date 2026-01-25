import { Task, Note, TaskNote } from '@prisma/client';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskNoteWithNote extends TaskNote {
  note: Note;
}

export interface TaskWithNote extends Task {
  taskNotes?: TaskNoteWithNote[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string; // ISO date string
  category?: string;
  notes?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null; // ISO date string or null
  category?: string | null;
  notes?: string | null;
  position?: number;
}

export interface ReorderTasksInput {
  taskId: string;
  newStatus: TaskStatus;
  newPosition: number;
}

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  category?: string;
  priority?: TaskPriority[];
  dueDate?: 'overdue' | 'today' | 'this_week' | 'this_month' | 'all';
  search?: string;
}
