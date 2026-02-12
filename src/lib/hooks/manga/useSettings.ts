import { CACHE_STATIC } from '@/lib/cache-config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchKomgaSettings,
  saveKomgaSettings,
  testKomgaConnection,
  deleteKomgaSettings,
} from '@/lib/api/manga';
import { KomgaSettingsInput } from '@/types/komga';

export function useKomgaSettings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['komga-settings'],
    queryFn: fetchKomgaSettings,
    ...CACHE_STATIC,
  });

  return {
    configured: data?.configured ?? false,
    settings: data?.settings,
    isLoading,
    error,
    refetch,
  };
}

export function useKomgaSettingsMutation() {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (input: KomgaSettingsInput) => saveKomgaSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['komga-settings'] });
      queryClient.invalidateQueries({ queryKey: ['manga'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: (input: KomgaSettingsInput) => testKomgaConnection(input),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKomgaSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['komga-settings'] });
      queryClient.invalidateQueries({ queryKey: ['manga'] });
    },
  });

  return {
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,

    test: testMutation.mutateAsync,
    isTesting: testMutation.isPending,
    testError: testMutation.error,

    remove: deleteMutation.mutateAsync,
    isRemoving: deleteMutation.isPending,
    removeError: deleteMutation.error,
  };
}
