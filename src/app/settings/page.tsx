'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GeneralTab, AccountTab, IntegrationsTab, ApiUsageTab } from '@/components/settings';
import { Settings, User, Plug, BarChart3 } from 'lucide-react';

const VALID_TABS = ['general', 'account', 'integrations', 'api-usage'] as const;
type TabValue = (typeof VALID_TABS)[number];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as TabValue | null;
  const activeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'general';

  const handleTabChange = (value: string) => {
    router.replace(`/settings?tab=${value}`, { scroll: false });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your dashboard preferences and integrations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
            <TabsTrigger
              value="general"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            >
              <Settings className="h-4 w-4 mr-1.5" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            >
              <User className="h-4 w-4 mr-1.5" />
              Account
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            >
              <Plug className="h-4 w-4 mr-1.5" />
              Integrations
            </TabsTrigger>
            <TabsTrigger
              value="api-usage"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            >
              <BarChart3 className="h-4 w-4 mr-1.5" />
              API Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <GeneralTab />
          </TabsContent>
          <TabsContent value="account" className="mt-6">
            <AccountTab />
          </TabsContent>
          <TabsContent value="integrations" className="mt-6">
            <IntegrationsTab />
          </TabsContent>
          <TabsContent value="api-usage" className="mt-6">
            <ApiUsageTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
