import { Badge } from '@/components/ui/badge';
import { TaskPriority } from '@/types/tasks';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variants: Record<TaskPriority, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    LOW: { label: 'Low', variant: 'outline' },
    MEDIUM: { label: 'Medium', variant: 'secondary' },
    HIGH: { label: 'High', variant: 'destructive' },
  };

  const { label, variant } = variants[priority];

  return (
    <Badge variant={variant} className={cn('text-xs', className)}>
      {label}
    </Badge>
  );
}
