'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Film, Gamepad2, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { useSidebar } from '@/lib/providers/SidebarProvider';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    name: 'Sports',
    href: '/sports',
    icon: Trophy,
  },
  {
    name: 'Watchlist',
    href: '/watchlist',
    icon: Film,
  },
  {
    name: 'Games',
    href: '/games',
    icon: Gamepad2,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <>
      <aside className={cn(
        "fixed left-0 top-0 h-screen border-r bg-card/80 backdrop-blur-md transition-all duration-300 ease-in-out z-40",
        isCollapsed ? "w-[70px]" : "w-64"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className={cn(
            "flex h-16 items-center transition-all duration-300",
            isCollapsed ? "justify-center" : "justify-between px-6"
          )}>
            {!isCollapsed && (
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                bigboo.dev
              </h1>
            )}
            <div className={cn("transition-all duration-300", isCollapsed && "scale-90")}>
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-3">
            {navItems.map((item) => {
              // Special handling for watchlist to match sub-routes
              const isActive = item.href === '/watchlist' 
                ? pathname.startsWith('/watchlist')
                : pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                    isActive
                      ? 'bg-primary/10 text-primary hover:bg-primary/15'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    isCollapsed ? 'justify-center px-0 w-10 mx-auto' : 'px-3 w-full'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-primary rounded-r-full" />
                  )}
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                    isCollapsed ? "group-hover:scale-110" : "mr-1"
                  )} />
                  <span className={cn(
                    "transition-all duration-300 overflow-hidden whitespace-nowrap",
                    isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-50 h-8 w-8 rounded-full border bg-background shadow-lg transition-all duration-300 ease-in-out hover:bg-accent text-muted-foreground hover:text-foreground",
          isCollapsed ? "left-[54px]" : "left-[240px]"
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}

