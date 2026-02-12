'use client';

import { KomgaSettings } from './KomgaSettings';
import { CalibreWebSettings } from './CalibreWebSettings';

export function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Manage connections to external services
        </p>
      </div>
      <KomgaSettings />
      <CalibreWebSettings />
    </div>
  );
}
