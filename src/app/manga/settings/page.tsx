'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKomgaSettings, useKomgaSettingsMutation } from '@/lib/hooks/useManga';
import { SeriesThumbnailManager } from '@/components/manga/SeriesThumbnailManager';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  ImageIcon,
  Server,
  AlertCircle,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function MangaSettingsPage() {
  const router = useRouter();
  const { configured, settings, isLoading, refetch } = useKomgaSettings();
  const { save, isSaving, test, isTesting, remove, isRemoving } = useKomgaSettingsMutation();

  const [serverUrl, setServerUrl] = useState(process.env.NEXT_PUBLIC_KOMGA_DEFAULT_URL || '');
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
        setPassword('');
        refetch();
        // Redirect to manga page after successful save
        setTimeout(() => router.push('/manga'), 1000);
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
      setServerUrl(process.env.NEXT_PUBLIC_KOMGA_DEFAULT_URL || '');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hover:bg-primary/10"
            >
              <Link href="/manga">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Manga Settings</h1>
                  <p className="text-muted-foreground mt-1">
                    Configure your Komga server and customize your reading experience
                  </p>
                </div>
              </div>
            </div>
            {configured && (
              <Badge
                variant="outline"
                className="hidden sm:flex text-green-600 dark:text-green-400 border-green-600/50 bg-green-50 dark:bg-green-950/50 px-3 py-1.5"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Connected
              </Badge>
            )}
          </div>

          {isLoading ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading settings...</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="connection" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="connection" className="gap-2">
                  <Server className="h-4 w-4" />
                  Connection
                </TabsTrigger>
                <TabsTrigger value="thumbnails" className="gap-2" disabled={!configured}>
                  <ImageIcon className="h-4 w-4" />
                  Thumbnails
                </TabsTrigger>
              </TabsList>

              {/* Connection Tab */}
              <TabsContent value="connection" className="space-y-6">
                {/* Status Banner */}
                {configured ? (
                  <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-green-900 dark:text-green-100">
                            Connected to Komga
                          </h3>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Your server is configured and ready to use
                          </p>
                          {settings && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-mono">
                              {settings.serverUrl}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                            No Server Configured
                          </h3>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            Connect your Komga server to start reading manga
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Connection Form */}
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>Server Configuration</CardTitle>
                        <CardDescription className="mt-1">
                          Enter your Komga server details to establish connection
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="komga-server" className="text-sm font-medium">
                            Server URL
                          </Label>
                          <Input
                            id="komga-server"
                            type="url"
                            placeholder="https://komga.example.com"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            className="h-11"
                          />
                          <p className="text-xs text-muted-foreground">
                            The full URL to your Komga server including protocol (https://)
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="komga-email" className="text-sm font-medium">
                              Email
                            </Label>
                            <Input
                              id="komga-email"
                              type="email"
                              placeholder="your-email@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="h-11"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="komga-password" className="text-sm font-medium">
                              Password
                              {configured && !password && (
                                <span className="text-muted-foreground text-xs font-normal ml-2">
                                  (optional)
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
                                className="h-11 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Feedback Messages */}
                      <div className="space-y-3">
                        {testResult && (
                          <div
                            className={`p-4 rounded-lg border flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${
                              testResult.success
                                ? 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
                            }`}
                          >
                            {testResult.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                testResult.success
                                  ? 'text-green-900 dark:text-green-100'
                                  : 'text-red-900 dark:text-red-100'
                              }`}>
                                {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                              </p>
                              <p className={`text-sm mt-1 ${
                                testResult.success
                                  ? 'text-green-700 dark:text-green-300'
                                  : 'text-red-700 dark:text-red-300'
                              }`}>
                                {testResult.message}
                              </p>
                            </div>
                          </div>
                        )}

                        {saveResult && (
                          <div
                            className={`p-4 rounded-lg border flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${
                              saveResult.success
                                ? 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
                            }`}
                          >
                            {saveResult.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                saveResult.success
                                  ? 'text-green-900 dark:text-green-100'
                                  : 'text-red-900 dark:text-red-100'
                              }`}>
                                {saveResult.success ? 'Settings Saved' : 'Save Failed'}
                              </p>
                              <p className={`text-sm mt-1 ${
                                saveResult.success
                                  ? 'text-green-700 dark:text-green-300'
                                  : 'text-red-700 dark:text-red-300'
                              }`}>
                                {saveResult.message}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTest}
                          disabled={isTesting || !serverUrl || !email || !password}
                          className="sm:flex-1 h-11"
                        >
                          {isTesting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>

                        <Button
                          type="submit"
                          disabled={isSaving || !serverUrl || !email || (!password && !configured)}
                          className="sm:flex-1 h-11"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {configured ? 'Update Settings' : 'Save Settings'}
                            </>
                          )}
                        </Button>

                        {configured && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={handleRemove}
                            disabled={isRemoving}
                            className="sm:w-auto h-11"
                          >
                            {isRemoving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Thumbnails Tab */}
              <TabsContent value="thumbnails" className="space-y-6">
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>Series Thumbnails</CardTitle>
                        <CardDescription className="mt-1">
                          Upload and manage custom cover art for your manga series
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <SeriesThumbnailManager />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
