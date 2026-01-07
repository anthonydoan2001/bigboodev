'use client';

import { useSidebar } from '@/lib/providers/SidebarProvider';
import { cn } from '@/lib/utils';

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main className={cn(
      "transition-all duration-300 ease-in-out",
      isCollapsed ? "ml-[70px]" : "ml-64"
    )}>
      {children}
    </main>
  );
}

