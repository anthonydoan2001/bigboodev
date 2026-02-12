import { useEffect, useRef, useState, useCallback } from 'react';
import { getBookDownloadUrl } from '@/lib/api/calibre';
import { HIGHLIGHT_COLORS } from '../../shared/constants';
import type { Rendition, Book as EpubBook, NavItem } from 'epubjs';

interface UseEpubBookOptions {
  bookId: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  flowMode: 'paginated' | 'scrolled';
  theme: 'light' | 'sepia' | 'dark';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  margins: number;
  onSelected?: (cfiRange: string, text: string, position: { x: number; y: number }) => void;
  onRelocated?: (location: {
    start: { cfi: string; displayed: { page: number; total: number }; percentage: number; href: string };
    atEnd: boolean;
    atStart: boolean;
  }) => void;
  savedPosition?: string | null;
}

export function useEpubBook({
  bookId,
  containerRef,
  flowMode,
  theme,
  fontSize,
  fontFamily,
  lineHeight,
  margins,
  onSelected,
  onRelocated,
  savedPosition,
}: UseEpubBookOptions) {
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [totalLocations, setTotalLocations] = useState(0);

  // Build theme object for rendition
  const buildThemeStyles = useCallback(() => {
    const themeColors = {
      light: { color: '#1a1a1a', background: '#ffffff' },
      sepia: { color: '#5b4636', background: '#f4ecd8' },
      dark: { color: '#e0e0e0', background: '#1a1a1a' },
    };

    const colors = themeColors[theme];
    const fontFamilyValue = fontFamily === 'default' ? '' : fontFamily;

    return {
      body: {
        color: `${colors.color} !important`,
        background: `${colors.background} !important`,
        'line-height': `${lineHeight} !important`,
        ...(fontFamilyValue ? { 'font-family': `${fontFamilyValue} !important` } : {}),
      },
      'body *': {
        color: `inherit !important`,
      },
    } as Record<string, Record<string, string>>;
  }, [theme, fontFamily, lineHeight]);

  const applyTheme = useCallback((rendition: Rendition) => {
    const styles = buildThemeStyles();
    rendition.themes.register('custom', styles);
    rendition.themes.select('custom');
    rendition.themes.fontSize(`${fontSize}%`);
  }, [buildThemeStyles, fontSize]);

  // Inject highlight CSS into iframe content
  const injectHighlightCSS = useCallback((rendition: Rendition) => {
    const css = Object.entries(HIGHLIGHT_COLORS)
      .map(([color, { bg, border }]) =>
        `.epubjs-hl.highlight-${color} { fill: ${bg}; stroke: ${border}; stroke-width: 1; mix-blend-mode: multiply; cursor: pointer; }`
      )
      .join('\n');

    rendition.on('rendered', () => {
      try {
        const iframeDoc = (rendition as unknown as { manager?: { container?: HTMLElement } })
          .manager?.container?.querySelector('iframe')?.contentDocument;
        if (iframeDoc && !iframeDoc.querySelector('#epub-highlight-styles')) {
          const style = iframeDoc.createElement('style');
          style.id = 'epub-highlight-styles';
          style.textContent = css;
          iframeDoc.head.appendChild(style);
        }
      } catch {
        // Cross-origin or other iframe access issues
      }
    });
  }, []);

  // Inject touch swipe listeners into the epub iframe
  const injectTouchListeners = useCallback((rendition: Rendition) => {
    rendition.on('rendered', () => {
      try {
        const iframe = (rendition as unknown as { manager?: { container?: HTMLElement } })
          .manager?.container?.querySelector('iframe');
        const doc = iframe?.contentDocument;
        if (!doc) return;

        let startX = 0;
        let startY = 0;

        doc.addEventListener('touchstart', (e: TouchEvent) => {
          startX = e.changedTouches[0].screenX;
          startY = e.changedTouches[0].screenY;
        }, { passive: true });

        doc.addEventListener('touchend', (e: TouchEvent) => {
          const deltaX = e.changedTouches[0].screenX - startX;
          const deltaY = e.changedTouches[0].screenY - startY;
          if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX > 0) {
              rendition.prev();
            } else {
              rendition.next();
            }
          }
        }, { passive: true });
      } catch {
        // Cross-origin iframe
      }
    });
  }, []);

  // Initialize epub.js
  useEffect(() => {
    let mounted = true;

    async function loadBook() {
      try {
        const ePubModule = await import('epubjs');
        const ePubFn = ePubModule.default;

        const downloadUrl = getBookDownloadUrl(bookId, 'epub');
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Failed to download book');

        const arrayBuffer = await response.arrayBuffer();
        const book = ePubFn(arrayBuffer);
        bookRef.current = book;

        await book.ready;

        if (!mounted || !containerRef.current) return;

        const rendition = book.renderTo(containerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'none',
          flow: flowMode === 'paginated' ? 'paginated' : 'scrolled',
        });

        renditionRef.current = rendition;

        applyTheme(rendition);
        rendition.themes.override('padding', `0 ${margins}px`);
        injectHighlightCSS(rendition);

        if (flowMode === 'paginated') {
          injectTouchListeners(rendition);
        }

        const navigation = await book.loaded.navigation;
        if (mounted) {
          setToc(navigation.toc);
        }

        // Handle text selection for highlights
        rendition.on('selected', (cfiRange: string, contents: { window: Window }) => {
          if (!mounted) return;
          const selection = contents.window.getSelection();
          if (!selection || selection.toString().trim().length === 0) return;

          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          const iframe = containerRef.current?.querySelector('iframe');
          const iframeRect = iframe?.getBoundingClientRect() || { left: 0, top: 0 };

          onSelected?.(cfiRange, selection.toString().trim(), {
            x: iframeRect.left + rect.left + rect.width / 2,
            y: iframeRect.top + rect.top,
          });
        });

        rendition.on('markClicked', () => {
          onSelected?.('', '', { x: 0, y: 0 });
        });

        // Restore or display
        if (savedPosition) {
          await rendition.display(savedPosition);
        } else {
          await rendition.display();
        }

        // Track location changes
        rendition.on('relocated', (location: {
          start: { cfi: string; displayed: { page: number; total: number }; percentage: number; href: string };
          atEnd: boolean;
          atStart: boolean;
        }) => {
          if (!mounted) return;
          onRelocated?.(location);
        });

        // Generate locations for reading time estimate
        book.locations.generate(1024).then((locs: string[]) => {
          if (mounted) {
            setTotalLocations(locs.length);
          }
        });

        if (mounted) setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load book');
          setIsLoading(false);
        }
      }
    }

    loadBook();

    return () => {
      mounted = false;
      if (bookRef.current) {
        bookRef.current.destroy();
        bookRef.current = null;
      }
      renditionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, flowMode]);

  // Update theme/font when store values change
  useEffect(() => {
    if (renditionRef.current) {
      applyTheme(renditionRef.current);
    }
  }, [applyTheme]);

  // Update margins when store value changes
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.override('padding', `0 ${margins}px`);
    }
  }, [margins]);

  return {
    bookRef,
    renditionRef,
    isLoading,
    error,
    toc,
    totalLocations,
  };
}
