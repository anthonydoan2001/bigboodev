'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Helper to get initial collapsed state (lazy initializer for useState)
function getInitialCollapsedState(): boolean {
  if (typeof window === 'undefined') return false;

  const isMobile = window.innerWidth < 768;
  if (isMobile) return true;

  const saved = localStorage.getItem('sidebar-collapsed');
  if (saved !== null) {
    try {
      return JSON.parse(saved);
    } catch {
      return false;
    }
  }
  return false;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Use lazy initialization - function is called once on mount
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newValue));
      return newValue;
    });
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}




