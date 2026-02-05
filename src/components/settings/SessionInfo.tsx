'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut } from 'lucide-react';
import { getSession, clearSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function SessionInfo() {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionCreated, setSessionCreated] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = getSession();
    if (token && token.startsWith('session_')) {
      setSessionActive(true);
      // Parse timestamp from token format: session_{timestamp}_{random}
      const parts = token.split('_');
      if (parts.length >= 2) {
        const timestamp = parseInt(parts[1], 10);
        if (!isNaN(timestamp)) {
          setSessionCreated(new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }));
        }
      }
    }
  }, []);

  const handleSignOut = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Session
        </CardTitle>
        <CardDescription>
          Your current login session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${sessionActive ? 'bg-green-500' : 'bg-muted'}`} />
              <span className="text-sm font-medium">
                {sessionActive ? 'Active session' : 'No active session'}
              </span>
              {sessionActive && (
                <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-50 dark:bg-green-950/20">
                  Active
                </Badge>
              )}
            </div>
            {sessionCreated && (
              <p className="text-xs text-muted-foreground pl-4">
                Signed in on {sessionCreated}
              </p>
            )}
          </div>
          {sessionActive && (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign out
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
