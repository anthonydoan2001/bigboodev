'use client';

import { ImportSection } from '@/components/settings/ImportSection';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your dashboard preferences and import data
          </p>
        </div>

        <ImportSection />
      </div>
    </div>
  );
}
