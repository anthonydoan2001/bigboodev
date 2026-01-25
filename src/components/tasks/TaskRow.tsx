'use client';

import { TaskWithNote, TaskPriority } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from './PriorityBadge';
import { Trash2, Edit2, Calendar, Tag, FileText, Link2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskRowProps {
  task: TaskWithNote;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskRow({ task, onEdit, onDelete }: TaskRowProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <tr className="group hover:bg-muted/50 transition-colors border-b">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{task.title}</h3>
          {task.description && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {task.description}
            </span>
          )}
        </div>
      </td>
      <td className="p-3">
        <PriorityBadge priority={task.priority as TaskPriority} />
      </td>
      <td className="p-3">
        {task.dueDate ? (
          <div
            className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue && 'text-destructive font-medium',
              isDueToday && 'text-orange-500 font-medium'
            )}
          >
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="p-3">
        {task.category ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span>{task.category}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          {task.taskNotes && task.taskNotes.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground" title={`${task.taskNotes.length} linked note(s)`}>
              <Link2 className="h-3 w-3" />
              <span>{task.taskNotes.length}</span>
            </div>
          )}
          {task.notes && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Has notes">
              <FileText className="h-3 w-3" />
            </div>
          )}
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onEdit}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
