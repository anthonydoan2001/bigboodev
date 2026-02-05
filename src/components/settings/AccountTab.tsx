'use client';

import { GmailAccountCard } from './GmailAccountCard';
import { SessionInfo } from './SessionInfo';
import { PasswordSection } from './PasswordSection';

export function AccountTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Connected Accounts</h2>
        <p className="text-sm text-muted-foreground">
          Manage your connected services
        </p>
      </div>
      <GmailAccountCard />

      <div>
        <h2 className="text-lg font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">
          Session and password management
        </p>
      </div>
      <SessionInfo />
      <PasswordSection />
    </div>
  );
}
