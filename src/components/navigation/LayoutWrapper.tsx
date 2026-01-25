'use client';

import { MainContent } from '@/components/navigation/MainContent';
import { Sidebar } from '@/components/navigation/Sidebar';
import { SidebarProvider } from '@/lib/providers/SidebarProvider';
import { usePathname } from 'next/navigation';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isMangaReaderPage = pathname.startsWith('/manga/read/');

  // Full-screen pages without sidebar
  if (isLoginPage || isMangaReaderPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <Sidebar />
      <MainContent>
        {children}
      </MainContent>
    </SidebarProvider>
  );
}
