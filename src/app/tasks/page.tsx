'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { ListView } from '@/components/tasks/ListView';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { DeleteConfirmationDialog } from '@/components/tasks/DeleteConfirmationDialog';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTasksMutations } from '@/lib/hooks/useTasksMutations';
import { TaskWithNote, TaskFilters as TaskFiltersType, CreateTaskInput, UpdateTaskInput } from '@/types/tasks';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'kanban' | 'list';

function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'kanban'
  );
  const [filters, setFilters] = useState<TaskFiltersType>({});
  const [editingTask, setEditingTask] = useState<TaskWithNote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithNote | null>(null);

  const { tasks, todos, inProgress, done, isLoading } = useTasks(filters);
  const { createMutation, updateMutation, deleteMutation, reorderMutation } = useTasksMutations();

  // Extract unique categories from tasks
  const categories = useMemo(() => {
    const cats = new Set<string>();
    tasks.forEach((task) => {
      if (task.category) cats.add(task.category);
    });
    return Array.from(cats).sort();
  }, [tasks]);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    router.push(`/tasks?${params.toString()}`);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: TaskWithNote) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: CreateTaskInput | UpdateTaskInput) => {
    if (editingTask) {
      updateMutation.mutate(
        { id: editingTask.id, input: data as UpdateTaskInput },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingTask(null);
          },
        }
      );
    } else {
      createMutation.mutate(data as CreateTaskInput, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleDeleteTask = (task: TaskWithNote) => {
    setTaskToDelete(task);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id, {
        onSuccess: () => {
          setTaskToDelete(null);
        },
      });
    }
  };

  const handleReorder = (taskId: string, newStatus: string, newPosition: number) => {
    reorderMutation.mutate({
      taskId,
      newStatus: newStatus as any,
      newPosition,
    });
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full flex flex-col h-full space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Tasks</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('kanban')}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('list')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </Button>
            </div>
            <Button onClick={handleCreateTask} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Task</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0">
          <TaskFilters filters={filters} onFiltersChange={setFilters} categories={categories} />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {viewMode === 'kanban' ? (
            <KanbanBoard
              todos={todos}
              inProgress={inProgress}
              done={done}
              isLoading={isLoading}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onReorder={handleReorder}
            />
          ) : (
            <ListView
              tasks={tasks}
              isLoading={isLoading}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          )}
        </div>

        {/* Task Form Dialog */}
        <TaskForm
          task={editingTask}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={!!taskToDelete}
          onOpenChange={(open) => !open && setTaskToDelete(null)}
          taskTitle={taskToDelete?.title || ''}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex flex-col py-8 px-4 md:px-6 lg:px-8 overflow-hidden">
          <div className="w-full flex flex-col h-full space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-full" />
            <div className="flex-1">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
