'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getSeriesThumbnailUrl, uploadSeriesThumbnail, deleteSeriesThumbnail } from '@/lib/api/manga';
import { KomgaSeries } from '@/types/komga';
import { Upload, Trash2, Loader2, ImageIcon, CheckCircle, XCircle } from 'lucide-react';

interface ThumbnailUploadDialogProps {
  series: KomgaSeries | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ThumbnailUploadDialog({
  series,
  open,
  onOpenChange,
  onSuccess,
}: ThumbnailUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setIsDragging(false);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setResult(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setResult({ success: false, message: 'Please select an image file' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setResult({ success: false, message: 'File size must be less than 10MB' });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!series || !selectedFile) return;

    setIsUploading(true);
    setResult(null);

    try {
      await uploadSeriesThumbnail(series.id, selectedFile);
      setResult({ success: true, message: 'Thumbnail uploaded successfully' });
      onSuccess?.();
      // Close dialog after short delay
      setTimeout(() => handleOpenChange(false), 1000);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload thumbnail',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!series) return;

    setIsDeleting(true);
    setResult(null);

    try {
      await deleteSeriesThumbnail(series.id);
      setResult({ success: true, message: 'Thumbnail reset to default' });
      onSuccess?.();
      // Close dialog after short delay
      setTimeout(() => handleOpenChange(false), 1000);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reset thumbnail',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!series) return null;

  const currentThumbnailUrl = getSeriesThumbnailUrl(series.id);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Thumbnail</DialogTitle>
          <DialogDescription className="line-clamp-1">
            {series.metadata.title || series.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current vs New Preview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Current</p>
              <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden">
                <Image
                  src={`${currentThumbnailUrl}?t=${Date.now()}`}
                  alt="Current thumbnail"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">New</p>
              <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="New thumbnail preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragging ? 'Drop image here' : 'Drag and drop or click to select'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              JPG, PNG, WebP (max 10MB)
            </p>
            <p className="text-xs text-muted-foreground/70">
              Recommended: 600×900px (2:3 aspect ratio)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name}
            </p>
          )}

          {/* Result message */}
          {result && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                result.success
                  ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isUploading}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Reset to Default
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || isDeleting}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
