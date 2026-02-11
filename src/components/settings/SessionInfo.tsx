'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SessionInfo() {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionCreated, setSessionCreated] = useState<string | null>(null);
  const [sessionExpires, setSessionExpires] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.active) {
          setSessionActive(true);
          setSessionCreated(
            new Date(data.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          );
          setSessionExpires(
            new Date(data.expiresAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Continue to redirect even if the request fails
    }
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
            {sessionExpires && (
              <p className="text-xs text-muted-foreground pl-4">
                Expires {sessionExpires}
              </p>
            )}
          </div>
          {sessionActive && (
            <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
              <LogOut className="h-4 w-4 mr-1.5" />
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
