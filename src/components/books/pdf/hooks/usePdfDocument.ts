import { useEffect, useRef, useState } from 'react';
import { getBookDownloadUrl } from '@/lib/api/calibre';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

const PDFJS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624`;
const PDFJS_CDN_WORKER = `${PDFJS_CDN}/build/pdf.worker.min.mjs`;

export interface PdfOutlineItem {
  title: string;
  dest: string | unknown[] | null;
  items: PdfOutlineItem[];
  bold: boolean;
  italic: boolean;
}

export function usePdfDocument(bookId: number) {
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const pageCacheRef = useRef<Map<number, PDFPageProxy>>(new Map());
  const MAX_PAGE_CACHE = 20;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [defaultPageSize, setDefaultPageSize] = useState<{ width: number; height: number } | null>(null);
  const [outline, setOutline] = useState<PdfOutlineItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadPdf() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN_WORKER;

        const downloadUrl = getBookDownloadUrl(bookId, 'pdf');
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Failed to download PDF');

        const arrayBuffer = await response.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({
          data: arrayBuffer,
          wasmUrl: `${PDFJS_CDN}/wasm/`,
        }).promise;

        if (!mounted) {
          pdfDoc.destroy();
          return;
        }

        pdfDocRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);

        const firstPage = await pdfDoc.getPage(1);
        const vp = firstPage.getViewport({ scale: 1 });
        if (mounted) setDefaultPageSize({ width: vp.width, height: vp.height });

        const pdfOutline = await pdfDoc.getOutline();
        if (mounted && pdfOutline) {
          setOutline(pdfOutline as unknown as PdfOutlineItem[]);
        }

        if (mounted) setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      mounted = false;
      for (const page of pageCacheRef.current.values()) {
        page.cleanup();
      }
      pageCacheRef.current.clear();
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  return {
    pdfDocRef,
    pageCacheRef,
    MAX_PAGE_CACHE,
    isLoading,
    error,
    totalPages,
    defaultPageSize,
    outline,
  };
}
