'use client';

import { useState, useMemo } from 'react';
import { TaskWithNote } from '@/types/tasks';
import { TaskRow } from './TaskRow';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortField = 'title' | 'priority' | 'dueDate' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

interface ListViewProps {
  tasks: TaskWithNote[];
  isLoading?: boolean;
  onEdit: (task: TaskWithNote) => void;
  onDelete: (task: TaskWithNote) => void;
}

export function ListView({ tasks, isLoading, onEdit, onDelete }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'status':
          const statusOrder = { TODO: 1, IN_PROGRESS: 2, DONE: 3 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [tasks, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortField === field;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1"
        onClick={() => handleSort(field)}
      >
        {label}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </Button>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex-1 overflow-auto">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-background border-b z-10">
              <tr>
                <th className="p-3 text-left">
                  <SortButton field="title" label="Title" />
                </th>
                <th className="p-3 text-left">
                  <SortButton field="priority" label="Priority" />
                </th>
                <th className="p-3 text-left">
                  <SortButton field="dueDate" label="Due Date" />
                </th>
                <th className="p-3 text-left">
                  Category
                </th>
                <th className="p-3 text-left">Notes</th>
                <th className="p-3 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={6} className="p-3">
                      <Skeleton className="h-12 w-full" />
                    </td>
                  </tr>
                ))
              ) : sortedTasks.length > 0 ? (
                sortedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={() => onEdit(task)}
                    onDelete={() => onDelete(task)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
