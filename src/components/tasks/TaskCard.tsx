'use client';

import { TaskWithNote } from '@/types/tasks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from './PriorityBadge';
import { Trash2, Edit2, Calendar, Tag, FileText, Link2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithNote;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, isDragging }: TaskCardProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md',
        isDragging && 'opacity-50',
        isOverdue && 'border-destructive/50'
      )}
      onClick={onEdit}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight flex-1">{task.title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <PriorityBadge priority={task.priority} />
          
          {task.category && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span>{task.category}</span>
            </div>
          )}

          {task.dueDate && (
            <div
              className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-destructive font-medium',
                isDueToday && 'text-orange-500 font-medium'
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
            </div>
          )}

          {task.note && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{task.note.title}</span>
            </div>
          )}

          {task.notes && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>Notes</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
