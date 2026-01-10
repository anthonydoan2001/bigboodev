'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileWithDestination {
  file: File;
  destination: 'auto' | 'PLAN_TO_WATCH' | 'WATCHED';
}

interface ImportResult {
  success: number;
  duplicates: number;
  failed: number;
  errors: string[];
  skipped: number;
}

export function ImportSection() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithDestination[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (files: FileWithDestination[]) => {
      const formData = new FormData();
      files.forEach(({ file, destination }) => {
        formData.append('files', file);
        formData.append('destinations', destination);
      });

      const response = await fetch('/api/watchlist/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (data) => {
      setImportResult(data);
      setSelectedFiles([]);
      // Invalidate watchlist queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileWithDestination[] = Array.from(files).map(file => {
      const filename = file.name.toLowerCase();
      // Auto-detect destination based on filename
      let destination: 'auto' | 'PLAN_TO_WATCH' | 'WATCHED' = 'auto';
      if (filename.includes('watched')) {
        destination = 'WATCHED';
      } else if (filename.includes('watchlist') || filename.includes('films')) {
        destination = 'PLAN_TO_WATCH';
      }
      return { file, destination };
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setImportResult(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateDestination = (index: number, destination: 'auto' | 'PLAN_TO_WATCH' | 'WATCHED') => {
    setSelectedFiles(prev => 
      prev.map((f, i) => i === index ? { ...f, destination } : f)
    );
  };

  const handleImport = () => {
    if (selectedFiles.length === 0) return;
    importMutation.mutate(selectedFiles);
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.xml')) {
      return <FileText className="h-4 w-4 text-orange-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const getFileSource = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes('animelist') || lower.endsWith('.xml')) {
      return 'MyAnimeList';
    }
    return 'Letterboxd';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Import your watchlist from Letterboxd (CSV) or MyAnimeList (XML). 
          Export your data from these services first, then upload the files here.
        </p>

        {/* File Upload Area */}
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xml"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Click to upload files</p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports: CSV (Letterboxd), XML (MyAnimeList)
          </p>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files</h4>
            {selectedFiles.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(item.file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getFileSource(item.file.name)} • {(item.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={item.destination}
                    onChange={(e) => updateDestination(index, e.target.value as 'auto' | 'PLAN_TO_WATCH' | 'WATCHED')}
                    className="text-xs bg-background border rounded px-2 py-1"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="PLAN_TO_WATCH">Watchlist</option>
                    <option value="WATCHED">Watched</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Import Button */}
        {selectedFiles.length > 0 && (
          <Button
            onClick={handleImport}
            disabled={importMutation.isPending}
            className="w-full"
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing... (this may take a while)
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Import Complete
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Imported:</span>
                <span className="font-medium text-green-600">{importResult.success}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duplicates:</span>
                <span className="font-medium text-yellow-600">{importResult.duplicates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed:</span>
                <span className="font-medium text-red-600">{importResult.failed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skipped:</span>
                <span className="font-medium text-muted-foreground">{importResult.skipped}</span>
              </div>
            </div>
            
            {importResult.errors.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowErrors(!showErrors)}
                  className="text-xs"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {showErrors ? 'Hide' : 'Show'} {importResult.errors.length} error{importResult.errors.length > 1 ? 's' : ''}
                </Button>
                {showErrors && (
                  <div className="mt-2 max-h-40 overflow-y-auto text-xs text-muted-foreground bg-background p-2 rounded">
                    {importResult.errors.slice(0, 50).map((error, i) => (
                      <div key={i} className="py-0.5">{error}</div>
                    ))}
                    {importResult.errors.length > 50 && (
                      <div className="py-0.5 font-medium">
                        ...and {importResult.errors.length - 50} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {importMutation.isError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {importMutation.error instanceof Error 
                ? importMutation.error.message 
                : 'Import failed. Please try again.'}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t">
          <p className="font-medium">How to export your data:</p>
          <p>
            <strong>Letterboxd:</strong> Settings → Import & Export → Export your data
          </p>
          <p>
            <strong>MyAnimeList:</strong> Profile → History → Export List
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
