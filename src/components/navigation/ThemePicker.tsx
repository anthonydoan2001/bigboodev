'use client';

import { Check, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { themes, type ThemeDefinition } from '@/lib/themes';
import { cn } from '@/lib/utils';

function ThemeSwatch({ theme }: { theme: ThemeDefinition }) {
  return (
    <div className="flex gap-0.5">
      <div
        className="w-3 h-3 rounded-full border border-border/50"
        style={{ backgroundColor: theme.colors.background }}
        title="Background"
      />
      <div
        className="w-3 h-3 rounded-full border border-border/50"
        style={{ backgroundColor: theme.colors.primary }}
        title="Primary"
      />
      <div
        className="w-3 h-3 rounded-full border border-border/50"
        style={{ backgroundColor: theme.colors.accent }}
        title="Accent"
      />
    </div>
  );
}

export function ThemePicker() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      const timer = setTimeout(() => setMounted(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <Palette className="h-4 w-4" />
      </Button>
    );
  }

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];
  const darkThemes = themes.filter((t) => t.isDark);
  const lightThemes = themes.filter((t) => !t.isDark);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Choose theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Theme</span>
          <ThemeSwatch theme={currentTheme} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Light Themes
        </DropdownMenuLabel>
        {lightThemes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              theme === t.id && 'bg-accent'
            )}
          >
            <div className="flex items-center gap-3">
              <ThemeSwatch theme={t} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </div>
            </div>
            {theme === t.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Dark Themes
        </DropdownMenuLabel>
        {darkThemes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              theme === t.id && 'bg-accent'
            )}
          >
            <div className="flex items-center gap-3">
              <ThemeSwatch theme={t} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </div>
            </div>
            {theme === t.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
