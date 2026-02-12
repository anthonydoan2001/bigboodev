'use client';

import { X, BookOpen, ScrollText, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useEpubReaderStore, type EpubTheme, type FlowMode } from '@/lib/stores/epub-reader-store';
import { FONT_FAMILIES } from '../shared/constants';
import { cn } from '@/lib/utils';

interface ReaderSettingsPanelProps {
  onClose: () => void;
}

const THEMES: { value: EpubTheme; label: string; bg: string; text: string }[] = [
  { value: 'light', label: 'Light', bg: '#ffffff', text: '#1a1a1a' },
  { value: 'sepia', label: 'Sepia', bg: '#f4ecd8', text: '#5b4636' },
  { value: 'dark', label: 'Dark', bg: '#1a1a1a', text: '#e0e0e0' },
];

export function ReaderSettingsPanel({ onClose }: ReaderSettingsPanelProps) {
  const {
    flowMode, setFlowMode,
    theme, setTheme,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    lineHeight, setLineHeight,
    margins, setMargins,
  } = useEpubReaderStore();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l z-[70] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Settings</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Display Mode */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Display Mode
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'paginated' as FlowMode, icon: BookOpen, label: 'Paginated' },
                { value: 'scrolled' as FlowMode, icon: ScrollText, label: 'Scrolling' },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setFlowMode(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',
                    flowMode === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Theme */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Theme
            </h4>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors',
                    theme === t.value ? 'ring-2 ring-primary' : ''
                  )}
                  style={{ backgroundColor: t.bg, color: t.text }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Font Size */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Font Size ({fontSize}%)
            </h4>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setFontSize(fontSize - 10)}
                disabled={fontSize <= 60}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Slider
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
                min={60}
                max={200}
                step={10}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setFontSize(fontSize + 10)}
                disabled={fontSize >= 200}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </section>

          {/* Font Family */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Font Family
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {FONT_FAMILIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFontFamily(f.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-md border transition-colors',
                    fontFamily === f.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  )}
                  style={{ fontFamily: f.value !== 'default' ? f.value : undefined }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          {/* Line Height */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Line Height ({lineHeight.toFixed(1)})
            </h4>
            <Slider
              value={[lineHeight * 10]}
              onValueChange={([v]) => setLineHeight(v / 10)}
              min={10}
              max={30}
              step={1}
            />
          </section>

          {/* Margins */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Margins ({margins}px)
            </h4>
            <Slider
              value={[margins]}
              onValueChange={([v]) => setMargins(v)}
              min={0}
              max={100}
              step={5}
            />
          </section>
        </div>
      </div>
    </>
  );
}
