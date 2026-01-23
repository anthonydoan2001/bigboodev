'use client';

import { useState } from 'react';
import { TaskWithNote, TaskStatus } from '@/types/tasks';
import { TaskCard } from './TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  todos: TaskWithNote[];
  inProgress: TaskWithNote[];
  done: TaskWithNote[];
  isLoading?: boolean;
  onEdit: (task: TaskWithNote) => void;
  onDelete: (task: TaskWithNote) => void;
  onReorder: (taskId: string, newStatus: TaskStatus, newPosition: number) => void;
}

export function KanbanBoard({
  todos,
  inProgress,
  done,
  isLoading,
  onEdit,
  onDelete,
  onReorder,
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<TaskWithNote | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, task: TaskWithNote) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(status);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDraggedOverColumn(null);

    if (!draggedTask) return;

    // If dropping in the same column, we might want to reorder
    // For now, we'll just move to the end if it's a different status
    if (draggedTask.status !== targetStatus) {
      const targetTasks = targetStatus === 'TODO' ? todos : targetStatus === 'IN_PROGRESS' ? inProgress : done;
      const newPosition = targetTasks.length; // Add to end
      onReorder(draggedTask.id, targetStatus, newPosition);
    }

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const renderColumn = (status: TaskStatus, tasks: TaskWithNote[], title: string) => {
    const isDraggedOver = draggedOverColumn === status;

    return (
      <div className="flex-1 min-w-0 flex flex-col">
        <Card className={cn('h-full flex flex-col', isDraggedOver && 'ring-2 ring-primary')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>{title}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {tasks.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0">
            <div
              className="space-y-2"
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))
              ) : tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className="cursor-move"
                  >
                    <TaskCard
                      task={task}
                      onEdit={() => onEdit(task)}
                      onDelete={() => onDelete(task)}
                      isDragging={draggedTask?.id === task.id}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No tasks
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto">
      {renderColumn('TODO', todos, 'Todo')}
      {renderColumn('IN_PROGRESS', inProgress, 'In Progress')}
      {renderColumn('DONE', done, 'Done')}
    </div>
  );
}
