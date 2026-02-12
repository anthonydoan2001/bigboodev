import { CACHE_STATIC } from '@/lib/cache-config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/api-client';
import type { DashboardSettingsData } from '@/lib/settings';

const BASE_URL = '/api';

async function fetchDashboardSettings(): Promise<DashboardSettingsData> {
  const res = await fetch(`${BASE_URL}/settings/dashboard`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard settings');
  return res.json();
}

async function saveDashboardSettings(
  partial: Partial<DashboardSettingsData>
): Promise<DashboardSettingsData> {
  const res = await fetch(`${BASE_URL}/settings/dashboard`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(partial),
  });
  if (!res.ok) throw new Error('Failed to save dashboard settings');
  return res.json();
}

export interface GeocodingResult {
  name: string;
  state: string | null;
  country: string;
  lat: string;
  lon: string;
}

export async function geocodeLocation(query: string): Promise<GeocodingResult[]> {
  const res = await fetch(`${BASE_URL}/weather/geocode?q=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to geocode location');
  return res.json();
}

export function useDashboardSettings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-settings'],
    queryFn: fetchDashboardSettings,
    ...CACHE_STATIC,
  });

  return {
    settings: data,
    isLoading,
    error,
    refetch,
  };
}

export function useDashboardSettingsMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (partial: Partial<DashboardSettingsData>) =>
      saveDashboardSettings(partial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-settings'] });
    },
  });

  return {
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  };
}
