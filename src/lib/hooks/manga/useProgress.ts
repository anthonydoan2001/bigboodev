import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KomgaBook, UpdateReadProgressRequest } from '@/types/komga';
import { updateReadProgress, deleteReadProgress } from '@/lib/api/manga';

export function useUpdateReadProgress() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      bookId,
      progress,
    }: {
      bookId: string;
      progress: UpdateReadProgressRequest;
    }) => updateReadProgress(bookId, progress),

    onMutate: async ({ bookId, progress }) => {
      await queryClient.cancelQueries({ queryKey: ['manga', 'book', bookId] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'books'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'readlist-books'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'in-progress'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'on-deck'] });

      const previousBook = queryClient.getQueryData(['manga', 'book', bookId]);
      const previousBooksQueries: Array<{ key: readonly unknown[]; data: unknown }> = [];

      queryClient.getQueriesData({ queryKey: ['manga', 'books'] }).forEach(([key, data]) => {
        previousBooksQueries.push({ key, data });
      });
      queryClient.getQueriesData({ queryKey: ['manga', 'readlist-books'] }).forEach(([key, data]) => {
        previousBooksQueries.push({ key, data });
      });

      const updateBookProgress = (book: KomgaBook) => {
        if (book?.id === bookId) {
          return {
            ...book,
            readProgress: {
              ...book.readProgress,
              page: progress.page,
              completed: progress.completed ?? book.readProgress?.completed ?? false,
              lastModified: new Date().toISOString(),
            },
          };
        }
        return book;
      };

      queryClient.setQueryData(['manga', 'book', bookId], (old: KomgaBook | undefined) => {
        if (!old) return old;
        return updateBookProgress(old);
      });

      queryClient.setQueriesData({ queryKey: ['manga', 'books'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map(updateBookProgress) };
      });

      queryClient.setQueriesData({ queryKey: ['manga', 'in-progress'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map(updateBookProgress) };
      });

      queryClient.setQueriesData({ queryKey: ['manga', 'on-deck'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map(updateBookProgress) };
      });

      queryClient.setQueriesData({ queryKey: ['manga', 'readlist-books'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map(updateBookProgress) };
      });

      return { previousBook, previousBooksQueries };
    },

    onError: (err, variables, context) => {
      if (context?.previousBook) {
        queryClient.setQueryData(['manga', 'book', variables.bookId], context.previousBook);
      }
      if (context?.previousBooksQueries) {
        context.previousBooksQueries.forEach(({ key, data }) => {
          queryClient.setQueryData(key, data);
        });
      }
    },

    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manga', 'book', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'books'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'readlist-books'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'series'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'in-progress'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'on-deck'] });
    },
  });

  return {
    updateProgress: mutation.mutate,
    updateProgressAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useDeleteReadProgress() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (bookId: string) => deleteReadProgress(bookId),

    onMutate: async (bookId) => {
      await queryClient.cancelQueries({ queryKey: ['manga', 'book', bookId] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'books'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'readlist-books'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'in-progress'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'on-deck'] });

      const previousBook = queryClient.getQueryData(['manga', 'book', bookId]);
      const previousBooksQueries: Array<{ key: readonly unknown[]; data: unknown }> = [];

      queryClient.getQueriesData({ queryKey: ['manga', 'books'] }).forEach(([key, data]) => {
        previousBooksQueries.push({ key, data });
      });
      queryClient.getQueriesData({ queryKey: ['manga', 'readlist-books'] }).forEach(([key, data]) => {
        previousBooksQueries.push({ key, data });
      });

      const clearProgress = (book: KomgaBook) => {
        if (book?.id === bookId) {
          return { ...book, readProgress: null };
        }
        return book;
      };

      queryClient.setQueryData(['manga', 'book', bookId], (old: KomgaBook | undefined) => {
        if (!old) return old;
        return clearProgress(old);
      });

      queryClient.setQueriesData({ queryKey: ['manga', 'books'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map(clearProgress) };
      });

      queryClient.setQueriesData({ queryKey: ['manga', 'readlist-books'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map(clearProgress) };
      });

      return { previousBook, previousBooksQueries };
    },

    onError: (err, bookId, context) => {
      if (context?.previousBook) {
        queryClient.setQueryData(['manga', 'book', bookId], context.previousBook);
      }
      if (context?.previousBooksQueries) {
        context.previousBooksQueries.forEach(({ key, data }) => {
          queryClient.setQueryData(key, data);
        });
      }
    },

    onSettled: (_, __, bookId) => {
      queryClient.invalidateQueries({ queryKey: ['manga', 'book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'books'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'readlist-books'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'series'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'in-progress'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'on-deck'] });
    },
  });

  return {
    deleteProgress: mutation.mutate,
    deleteProgressAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
