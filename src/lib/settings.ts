import { db } from '@/lib/db';

const DEFAULT_USER_ID = 'default';

export interface DashboardSettingsData {
  stocks: string[];
  crypto: string[];
  weather: {
    lat: string;
    lon: string;
    name: string;
  };
  countdown: {
    date: string;
    label: string;
  };
  lol: {
    summonerName: string;
    tag: string;
  };
}

export const DASHBOARD_DEFAULTS: DashboardSettingsData = {
  stocks: ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META'],
  crypto: ['BTC', 'ETH', 'SOL'],
  weather: {
    lat: '29.9717',
    lon: '-95.6938',
    name: 'Cypress, TX',
  },
  countdown: {
    date: `${new Date().getFullYear()}-04-05`,
    label: 'April 5th',
  },
  lol: {
    summonerName: 'ExoticLime',
    tag: 'NA1',
  },
};

export async function getDashboardSettings(): Promise<DashboardSettingsData> {
  try {
    const row = await db.dashboardSettings.findUnique({
      where: { userId: DEFAULT_USER_ID },
    });

    if (!row) {
      return { ...DASHBOARD_DEFAULTS };
    }

    const stored = row.settings as Partial<DashboardSettingsData>;

    return {
      stocks: stored.stocks ?? DASHBOARD_DEFAULTS.stocks,
      crypto: stored.crypto ?? DASHBOARD_DEFAULTS.crypto,
      weather: stored.weather
        ? { ...DASHBOARD_DEFAULTS.weather, ...stored.weather }
        : DASHBOARD_DEFAULTS.weather,
      countdown: stored.countdown
        ? { ...DASHBOARD_DEFAULTS.countdown, ...stored.countdown }
        : DASHBOARD_DEFAULTS.countdown,
      lol: stored.lol
        ? { ...DASHBOARD_DEFAULTS.lol, ...stored.lol }
        : DASHBOARD_DEFAULTS.lol,
    };
  } catch (error) {
    console.error('Error reading dashboard settings:', error);
    return { ...DASHBOARD_DEFAULTS };
  }
}

export async function updateDashboardSettings(
  partial: Partial<DashboardSettingsData>
): Promise<DashboardSettingsData> {
  const current = await getDashboardSettings();
  const merged = { ...current, ...partial };

  const settingsJson = JSON.parse(JSON.stringify(merged));

  await db.dashboardSettings.upsert({
    where: { userId: DEFAULT_USER_ID },
    update: { settings: settingsJson },
    create: {
      userId: DEFAULT_USER_ID,
      settings: settingsJson,
    },
  });

  return merged;
}
