'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { themes, type ThemeDefinition } from '@/lib/themes';
import { cn } from '@/lib/utils';

function ThemeSwatch({ theme, size = 'md' }: { theme: ThemeDefinition; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex gap-1">
      <div
        className={cn(sizeClass, 'rounded-full border border-border/50')}
        style={{ backgroundColor: theme.colors.background }}
      />
      <div
        className={cn(sizeClass, 'rounded-full border border-border/50')}
        style={{ backgroundColor: theme.colors.primary }}
      />
      <div
        className={cn(sizeClass, 'rounded-full border border-border/50')}
        style={{ backgroundColor: theme.colors.accent }}
      />
    </div>
  );
}

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false);
  const { theme: currentTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {themes.map((t) => (
          <div key={t.id} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const lightThemes = themes.filter((t) => !t.isDark);
  const darkThemes = themes.filter((t) => t.isDark);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Light Themes</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {lightThemes.map((t) => (
            <ThemeCard
              key={t.id}
              theme={t}
              isActive={currentTheme === t.id}
              onSelect={() => setTheme(t.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Dark Themes</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {darkThemes.map((t) => (
            <ThemeCard
              key={t.id}
              theme={t}
              isActive={currentTheme === t.id}
              onSelect={() => setTheme(t.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: ThemeDefinition;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:shadow-md',
        isActive
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50'
      )}
    >
      {isActive && (
        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      <ThemeSwatch theme={theme} size="md" />
      <div>
        <p className="text-sm font-medium">{theme.name}</p>
        <p className="text-xs text-muted-foreground">{theme.description}</p>
      </div>
    </button>
  );
}
