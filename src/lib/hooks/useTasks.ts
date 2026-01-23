import { TaskWithNote, TaskFilters } from '@/types/tasks';
import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/api-client';

export function useTasks(filters?: TaskFilters) {
  const queryParams = new URLSearchParams();

  if (filters?.status && filters.status.length > 0) {
    queryParams.set('status', filters.status.join(','));
  }
  if (filters?.category) {
    queryParams.set('category', filters.category);
  }
  if (filters?.priority && filters.priority.length > 0) {
    queryParams.set('priority', filters.priority.join(','));
  }
  if (filters?.search) {
    queryParams.set('search', filters.search);
  }

  const queryString = queryParams.toString();
  const url = `/api/tasks${queryString ? `?${queryString}` : ''}`;

  const { data, isLoading, error } = useQuery<{ items: TaskWithNote[] }>({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });

  const tasks: TaskWithNote[] = data?.items || [];

  // Apply due date filtering client-side (more flexible)
  const filteredTasks = filters?.dueDate && filters.dueDate !== 'all'
    ? tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(dueDate);
        taskDate.setHours(0, 0, 0, 0);

        switch (filters.dueDate) {
          case 'overdue':
            return taskDate < today;
          case 'today':
            return taskDate.getTime() === today.getTime();
          case 'this_week': {
            const weekEnd = new Date(today);
            weekEnd.setDate(today.getDate() + 7);
            return taskDate >= today && taskDate < weekEnd;
          }
          case 'this_month': {
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return taskDate >= today && taskDate <= monthEnd;
          }
          default:
            return true;
        }
      })
    : tasks;

  // Group by status
  const todos = filteredTasks.filter(t => t.status === 'TODO');
  const inProgress = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
  const done = filteredTasks.filter(t => t.status === 'DONE');

  return {
    tasks: filteredTasks,
    todos,
    inProgress,
    done,
    isLoading,
    error,
  };
}
