'use client';

import { X, Maximize2, FileText, Minus, Plus, Sun, Moon, BookOpen, Columns2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePdfReaderStore, type PdfZoomMode, type PdfTheme, type PdfSpreadMode } from '@/lib/stores/pdf-reader-store';
import { cn } from '@/lib/utils';

interface PdfSettingsPanelProps {
  onClose: () => void;
}

export function PdfSettingsPanel({ onClose }: PdfSettingsPanelProps) {
  const {
    zoomMode, setZoomMode,
    customZoom, setCustomZoom,
    theme, setTheme,
    spreadMode, setSpreadMode,
  } = usePdfReaderStore();

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
          {/* Zoom Mode */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Zoom Mode
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'fit-width' as PdfZoomMode, icon: Maximize2, label: 'Fit Width' },
                { value: 'fit-page' as PdfZoomMode, icon: FileText, label: 'Fit Page' },
                { value: 'custom' as PdfZoomMode, icon: FileText, label: 'Custom' },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setZoomMode(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',
                    zoomMode === value
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

          {/* Custom Zoom */}
          {zoomMode === 'custom' && (
            <section>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Zoom ({customZoom}%)
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCustomZoom(customZoom - 10)}
                  disabled={customZoom <= 50}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Slider
                  value={[customZoom]}
                  onValueChange={([v]) => setCustomZoom(v)}
                  min={50}
                  max={300}
                  step={10}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCustomZoom(customZoom + 10)}
                  disabled={customZoom >= 300}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </section>
          )}

          {/* Theme */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Theme
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'light' as PdfTheme, icon: Sun, label: 'Light' },
                { value: 'dark' as PdfTheme, icon: Moon, label: 'Dark' },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',
                    theme === value
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

          {/* Spread Mode */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Page Layout
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'single' as PdfSpreadMode, icon: BookOpen, label: 'Single' },
                { value: 'double' as PdfSpreadMode, icon: Columns2, label: 'Double' },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setSpreadMode(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',
                    spreadMode === value
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
        </div>
      </div>
    </>
  );
}
