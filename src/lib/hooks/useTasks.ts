import { TaskWithNote, TaskFilters } from '@/types/tasks';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getAuthHeaders } from '@/lib/api-client';

// Build query string outside component to avoid recreation
function buildQueryString(filters?: TaskFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();
  if (filters.status?.length) params.set('status', filters.status.join(','));
  if (filters.category) params.set('category', filters.category);
  if (filters.priority?.length) params.set('priority', filters.priority.join(','));
  if (filters.search) params.set('search', filters.search);

  const str = params.toString();
  return str ? `?${str}` : '';
}

export function useTasks(filters?: TaskFilters) {
  const url = `/api/tasks${buildQueryString(filters)}`;

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
    staleTime: 30000,
  });

  // Memoize all filtering and grouping operations
  const { tasks, todos, inProgress, done } = useMemo(() => {
    const allTasks: TaskWithNote[] = data?.items || [];

    // Apply due date filtering if needed
    let filtered = allTasks;
    if (filters?.dueDate && filters.dueDate !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();

      filtered = allTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        const taskTime = taskDate.getTime();

        switch (filters.dueDate) {
          case 'overdue':
            return taskTime < todayTime;
          case 'today':
            return taskTime === todayTime;
          case 'this_week': {
            const weekEnd = todayTime + 7 * 24 * 60 * 60 * 1000;
            return taskTime >= todayTime && taskTime < weekEnd;
          }
          case 'this_month': {
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).getTime();
            return taskTime >= todayTime && taskTime <= monthEnd;
          }
          default:
            return true;
        }
      });
    }

    // Group by status in single pass
    const todoList: TaskWithNote[] = [];
    const inProgressList: TaskWithNote[] = [];
    const doneList: TaskWithNote[] = [];

    for (const task of filtered) {
      if (task.status === 'TODO') todoList.push(task);
      else if (task.status === 'IN_PROGRESS') inProgressList.push(task);
      else if (task.status === 'DONE') doneList.push(task);
    }

    return {
      tasks: filtered,
      todos: todoList,
      inProgress: inProgressList,
      done: doneList,
    };
  }, [data?.items, filters?.dueDate]);

  return {
    tasks,
    todos,
    inProgress,
    done,
    isLoading,
    error,
  };
}
