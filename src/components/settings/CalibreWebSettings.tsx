'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCalibreSettings, useCalibreSettingsMutation } from '@/lib/hooks/useBooks';
import { BookOpen, CheckCircle, XCircle, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';

export function CalibreWebSettings() {
  const { configured, settings, isLoading, refetch } = useCalibreSettings();
  const { save, isSaving, test, isTesting, remove, isRemoving } = useCalibreSettingsMutation();

  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (settings) {
      setServerUrl(settings.serverUrl);
      setUsername(settings.username);
    }
  }, [settings]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleTest = async () => {
    setTestResult(null);
    setSaveResult(null);

    if (!serverUrl || !username || !password) {
      setTestResult({
        success: false,
        message: 'Please fill in all fields',
      });
      return;
    }

    try {
      const result = await test({ serverUrl, username, password });
      setTestResult({
        success: result.success,
        message: result.success
          ? 'Connected successfully'
          : result.error || 'Connection failed',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    }
  };

  const handleSave = async () => {
    setSaveResult(null);
    setTestResult(null);

    if (!serverUrl || !username || !password) {
      setSaveResult({
        success: false,
        message: 'Please fill in all fields',
      });
      return;
    }

    try {
      const result = await save({ serverUrl, username, password });
      if (result.success) {
        setSaveResult({
          success: true,
          message: result.message || 'Settings saved successfully',
        });
        setPassword('');
        refetch();
      } else {
        setSaveResult({
          success: false,
          message: result.error || 'Failed to save settings',
        });
      }
    } catch (error) {
      setSaveResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save settings',
      });
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove your Calibre-Web settings?')) {
      return;
    }

    try {
      await remove();
      setServerUrl('');
      setUsername('');
      setPassword('');
      setTestResult(null);
      setSaveResult(null);
      refetch();
    } catch (error) {
      setSaveResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove settings',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>Calibre-Web</CardTitle>
          </div>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>Calibre-Web</CardTitle>
          </div>
          {configured && (
            <Badge variant="success">
              <CheckCircle className="h-3 w-3 mr-1" />
              Configured
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect to your Calibre-Web server to read ebooks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="calibre-server">Server URL</Label>
          <Input
            id="calibre-server"
            type="url"
            placeholder="http://calibre.example.com"
            value={serverUrl}
            onChange={e => setServerUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="calibre-username">Username</Label>
          <Input
            id="calibre-username"
            placeholder="admin"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="calibre-password">
            Password
            {configured && !password && (
              <span className="text-muted-foreground text-xs ml-2">
                (leave empty to keep current)
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              id="calibre-password"
              type={showPassword ? 'text' : 'password'}
              placeholder={configured ? '••••••••' : 'Enter password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 ${
              testResult.success
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-sm">{testResult.message}</span>
          </div>
        )}

        {saveResult && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 ${
              saveResult.success
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {saveResult.success ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-sm">{saveResult.message}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || !serverUrl || !username || !password}
          >
            {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Test Connection
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || !serverUrl || !username || (!password && !configured)}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {configured ? 'Update Settings' : 'Save Settings'}
          </Button>

          {configured && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
