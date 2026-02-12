import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getDashboardSettings, updateDashboardSettings, DashboardSettingsData } from '@/lib/settings';

export const GET = withAuth(async () => {
  try {
    const settings = await getDashboardSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching dashboard settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard settings' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: Request) => {
  try {
    const partial: Partial<DashboardSettingsData> = await request.json();
    const updated = await updateDashboardSettings(partial);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error saving dashboard settings:', error);
    return NextResponse.json(
      { error: 'Failed to save dashboard settings' },
      { status: 500 }
    );
  }
});
