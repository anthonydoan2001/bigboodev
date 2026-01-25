'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@prisma/client';

interface TaskLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  linkedTaskIds: string[];
  onLinkTask: (taskId: string) => void;
  onUnlinkTask: (taskId: string) => void;
  isLoading?: boolean;
}

export function TaskLinkModal({
  open,
  onOpenChange,
  tasks,
  linkedTaskIds,
  onLinkTask,
  onUnlinkTask,
  isLoading,
}: TaskLinkModalProps) {
  const [search, setSearch] = useState('');

  const filteredTasks = useMemo(() => {
    if (!search) return tasks;
    const searchLower = search.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
    );
  }, [tasks, search]);

  const handleToggle = (taskId: string) => {
    if (linkedTaskIds.includes(taskId)) {
      onUnlinkTask(taskId);
    } else {
      onLinkTask(taskId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-500';
      case 'IN_PROGRESS':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'Done';
      case 'IN_PROGRESS':
        return 'In Progress';
      default:
        return 'To Do';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Tasks to Note</DialogTitle>
          <DialogDescription>
            Select tasks to link to this note. Linked tasks will appear in both the note and task views.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9"
          />
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-auto min-h-[200px] max-h-[400px] border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'No tasks match your search' : 'No tasks available'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTasks.map((task) => {
                const isLinked = linkedTaskIds.includes(task.id);
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors',
                      isLinked && 'bg-accent/30'
                    )}
                    onClick={() => handleToggle(task.id)}
                  >
                    <div className="flex-shrink-0">
                      {isLinked ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          getStatusColor(task.status)
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {linkedTaskIds.length} task{linkedTaskIds.length !== 1 ? 's' : ''} linked
          </div>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
