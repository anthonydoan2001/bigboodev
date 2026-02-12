'use client';

import { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCalibreBook } from '@/lib/hooks/useBooks';
import { EpubReader } from '@/components/books/epub/EpubReader';
import { PdfReader } from '@/components/books/pdf/PdfReader';
import { Loader2 } from 'lucide-react';

function ReaderContent({ bookId }: { bookId: number }) {
  const searchParams = useSearchParams();
  const format = searchParams.get('format') || 'epub';
  const urlTitle = searchParams.get('title') || '';
  const { book } = useCalibreBook(bookId);

  // Use book data if available, otherwise fall back to URL params
  const title = book?.title || urlTitle || `Book #${bookId}`;

  const actualFormat = format.toLowerCase();

  if (actualFormat === 'pdf') {
    return <PdfReader bookId={bookId} title={title} />;
  }

  return <EpubReader bookId={bookId} title={title} />;
}

export default function ReadBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const numericId = parseInt(bookId, 10);

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
            <p className="text-white/70">Loading reader...</p>
          </div>
        </div>
      }
    >
      <ReaderContent bookId={numericId} />
    </Suspense>
  );
}
