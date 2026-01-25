'use client';

import { Button } from '@/components/ui/button';
import { PrefetchLink } from '@/components/performance/PrefetchLink';
import { useSidebar } from '@/lib/providers/SidebarProvider';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Film, Gamepad2, Home, Settings, Trophy, CheckSquare, StickyNote, Video } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    name: 'Sports',
    href: '/sports?sport=NBA&tab=games',
    icon: Trophy,
  },
  {
    name: 'Watchlist',
    href: '/watchlist',
    icon: Film,
  },
  {
    name: 'Games',
    href: '/games/playlist',
    icon: Gamepad2,
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Notes',
    href: '/notes',
    icon: StickyNote,
  },
  {
    name: 'TikTok',
    href: '/tiktok',
    icon: Video,
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
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen border-r bg-card/80 backdrop-blur-md z-40",
          "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isCollapsed ? "w-[70px]" : "w-64"
        )}
        style={{
          willChange: isCollapsed ? 'auto' : 'width'
        }}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className={cn(
            "flex h-16 items-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isCollapsed ? "justify-center" : "justify-between px-6"
          )}>
            <div className={cn(
              "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              <h1 className="text-title bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent whitespace-nowrap">
                bigboo.dev
              </h1>
            </div>
            <div className={cn(
              "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isCollapsed ? "scale-100" : "scale-100"
            )}>
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-3">
            {navItems.map((item, index) => {
              // Special handling for watchlist, sports, games, tasks, and notes to match sub-routes
              const isActive = item.href === '/watchlist'
                ? pathname.startsWith('/watchlist')
                : item.name === 'Sports'
                ? pathname.startsWith('/sports')
                : item.name === 'Games'
                ? pathname.startsWith('/games')
                : item.href === '/tasks'
                ? pathname.startsWith('/tasks')
                : item.href === '/notes'
                ? pathname.startsWith('/notes')
                : item.href === '/tiktok'
                ? pathname.startsWith('/tiktok')
                : pathname === item.href;
              const Icon = item.icon;

              return (
                <PrefetchLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl py-3 text-body-sm font-medium group relative',
                    'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
                    isActive
                      ? 'bg-primary/10 text-primary hover:bg-primary/15'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    isCollapsed ? 'w-10 mx-auto' : 'w-full mx-3'
                  )}
                  style={{
                    transitionDelay: isCollapsed ? '0ms' : `${index * 30}ms`
                  }}
                  title={isCollapsed ? item.name : undefined}
                  prefetchDelay={50}
                >
                  {isActive && !isCollapsed && (
                    <div
                      className="absolute left-0 top-0 h-full w-1 bg-primary rounded-r-full transition-opacity duration-300"
                      style={{
                        transitionDelay: '100ms'
                      }}
                    />
                  )}
                  <div className={cn(
                    "flex items-center justify-center flex-shrink-0",
                    isCollapsed ? "w-10" : "w-5 ml-3"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      "transition-all duration-300 ease-out",
                      isCollapsed ? "scale-110 group-hover:scale-125 group-hover:rotate-3" : "scale-100"
                    )} />
                  </div>
                  <span className={cn(
                    "overflow-hidden whitespace-nowrap",
                    "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}>
                    {item.name}
                  </span>
                </PrefetchLink>
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
          "fixed top-1/2 -translate-y-1/2 z-50 h-8 w-8 rounded-full border bg-background shadow-lg",
          "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "hover:bg-accent hover:scale-110 hover:shadow-xl active:scale-95",
          "text-muted-foreground hover:text-foreground",
          isCollapsed ? "left-[54px]" : "left-[240px]"
        )}
      >
        <div className="relative w-4 h-4">
          <ChevronRight
            className={cn(
              "absolute inset-0 h-4 w-4",
              "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isCollapsed ? "rotate-0 opacity-100 scale-100" : "rotate-180 opacity-0 scale-50"
            )}
          />
          <ChevronLeft
            className={cn(
              "absolute inset-0 h-4 w-4",
              "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isCollapsed ? "rotate-180 opacity-0 scale-50" : "rotate-0 opacity-100 scale-100"
            )}
          />
        </div>
      </Button>
    </>
  );
}

