'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Loader2 } from 'lucide-react';
import { connectGmail, disconnectGmail } from '@/lib/api/gmail';
import { apiFetch } from '@/lib/api-client';

interface GmailStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
  tokenExpired?: boolean;
}

export function GmailAccountCard() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/gmail/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setStatus({ connected: false });
      }
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      await disconnectGmail();
      setStatus({ connected: false });
    } catch {
      // Refresh status on error
      fetchStatus();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail
        </CardTitle>
        <CardDescription>
          Connect your Gmail account to view emails on the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connection...
          </div>
        ) : status?.connected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{status.email}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-50 dark:bg-green-950/20">
                    Connected
                  </Badge>
                  {status.tokenExpired && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600/30">
                      Token expired
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              No Gmail account connected
            </p>
            <Button size="sm" onClick={() => connectGmail()}>
              Connect Gmail
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
