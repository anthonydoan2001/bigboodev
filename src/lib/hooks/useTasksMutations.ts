import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskWithNote, CreateTaskInput, UpdateTaskInput, ReorderTasksInput } from '@/types/tasks';
import { getAuthHeaders } from '@/lib/api-client';

export function useTasksMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        const errorMessage = error.details ? `${error.error}: ${error.details}` : (error.error || 'Failed to create task');
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ items: TaskWithNote[] }>(['tasks'], (old) => {
        if (!old) return { items: [data.item] };
        return { items: [data.item, ...old.items] };
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: async (error: Error) => {
      console.error('Create task error:', error);
      let errorMessage = error.message;
      try {
        // Try to get more details from the error if it's a Response
        if (error instanceof Error && 'response' in error) {
          const response = (error as any).response;
          if (response) {
            const data = await response.json();
            errorMessage = data.error || data.details || errorMessage;
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
      alert(`Failed to create task: ${errorMessage}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTaskInput }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update task');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ items: TaskWithNote[] }>(['tasks'], (old) => {
        if (!old) return { items: [data.item] };
        const index = old.items.findIndex(t => t.id === data.item.id);
        if (index >= 0) {
          const updated = [...old.items];
          updated[index] = data.item;
          return { items: updated };
        }
        return { items: [...old.items, data.item] };
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      console.error('Update task error:', error);
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      console.error('Delete task error:', error);
      alert(error.message);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (input: ReorderTasksInput) => {
      const res = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reorder task');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      console.error('Reorder task error:', error);
      alert(error.message);
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    reorderMutation,
  };
}
