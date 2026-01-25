'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useKomgaSettings, useKomgaSettingsMutation } from '@/lib/hooks/useManga';
import { BookOpen, CheckCircle, XCircle, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';

export function KomgaSettings() {
  const { configured, settings, isLoading, refetch } = useKomgaSettings();
  const { save, isSaving, test, isTesting, remove, isRemoving } = useKomgaSettingsMutation();

  const [serverUrl, setServerUrl] = useState('https://komga.bigboo.dev');
  const [email, setEmail] = useState('');
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

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setServerUrl(settings.serverUrl);
      setEmail(settings.email);
      // Password is not returned, keep empty for editing
    }
  }, [settings]);

  const handleTest = async () => {
    setTestResult(null);
    setSaveResult(null);

    if (!serverUrl || !email || !password) {
      setTestResult({
        success: false,
        message: 'Please fill in all fields',
      });
      return;
    }

    try {
      const result = await test({ serverUrl, email, password });
      setTestResult({
        success: result.success,
        message: result.success
          ? `Connected successfully${result.libraryCount ? ` (${result.libraryCount} libraries found)` : ''}`
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

    if (!serverUrl || !email || !password) {
      setSaveResult({
        success: false,
        message: 'Please fill in all fields',
      });
      return;
    }

    try {
      const result = await save({ serverUrl, email, password });
      if (result.success) {
        setSaveResult({
          success: true,
          message: result.message || 'Settings saved successfully',
        });
        setPassword(''); // Clear password after save
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
    if (!confirm('Are you sure you want to remove your Komga settings?')) {
      return;
    }

    try {
      await remove();
      setServerUrl('http://komga.bigboo.dev');
      setEmail('');
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
            <CardTitle>Komga Manga Server</CardTitle>
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
            <CardTitle>Komga Manga Server</CardTitle>
          </div>
          {configured && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Configured
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect to your Komga server to read manga
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="komga-server">Server URL</Label>
          <Input
            id="komga-server"
            type="url"
            placeholder="http://komga.bigboo.dev"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="komga-email">Email</Label>
          <Input
            id="komga-email"
            type="email"
            placeholder="your-email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="komga-password">
            Password
            {configured && !password && (
              <span className="text-muted-foreground text-xs ml-2">
                (leave empty to keep current)
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              id="komga-password"
              type={showPassword ? 'text' : 'password'}
              placeholder={configured ? '••••••••' : 'Enter password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
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
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
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
            disabled={isTesting || !serverUrl || !email || !password}
          >
            {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Test Connection
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || !serverUrl || !email || (!password && !configured)}
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
