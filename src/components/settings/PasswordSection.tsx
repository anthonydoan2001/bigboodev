'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Info } from 'lucide-react';

export function PasswordSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Password
        </CardTitle>
        <CardDescription>
          Dashboard access credentials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm">
              The dashboard password is configured via the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">DASHBOARD_PASSWORD</code> environment variable.
            </p>
            <p className="text-xs text-muted-foreground">
              To change it, update the environment variable and restart the application.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
