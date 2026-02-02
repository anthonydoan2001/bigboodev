'use client';

import { useState, useEffect } from 'react';
import { BookmarkListItem, BookmarkFolderTreeNode, CreateBookmarkInput, UpdateBookmarkInput } from '@/types/bookmarks';
import { fetchUrlMetadata } from '@/lib/api/bookmarks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, Link2 } from 'lucide-react';

interface BookmarkFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBookmarkInput | UpdateBookmarkInput) => void;
  bookmark?: BookmarkListItem | null;
  folders: BookmarkFolderTreeNode[];
  isSubmitting?: boolean;
}

// Flatten folder tree for select options
function flattenFolders(folders: BookmarkFolderTreeNode[], level = 0): { id: string; name: string; level: number }[] {
  const result: { id: string; name: string; level: number }[] = [];
  for (const folder of folders) {
    result.push({ id: folder.id, name: folder.name, level });
    if (folder.children.length > 0) {
      result.push(...flattenFolders(folder.children, level + 1));
    }
  }
  return result;
}

export function BookmarkForm({
  open,
  onClose,
  onSubmit,
  bookmark,
  folders,
  isSubmitting,
}: BookmarkFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const isEditing = !!bookmark;
  const flatFolders = flattenFolders(folders);

  useEffect(() => {
    if (bookmark) {
      setUrl(bookmark.url);
      setTitle(bookmark.title);
      setDescription(bookmark.description || '');
      setFaviconUrl(bookmark.faviconUrl || '');
      setFolderId(bookmark.folderId);
      setIsPinned(bookmark.isPinned);
    } else {
      setUrl('');
      setTitle('');
      setDescription('');
      setFaviconUrl('');
      setFolderId(null);
      setIsPinned(false);
    }
  }, [bookmark, open]);

  const handleFetchMetadata = async () => {
    if (!url.trim()) return;

    setIsFetching(true);
    try {
      const metadata = await fetchUrlMetadata(url);
      if (metadata.title) setTitle(metadata.title);
      if (metadata.faviconUrl) setFaviconUrl(metadata.faviconUrl);
      if (metadata.description) setDescription(metadata.description);
    } catch (error) {
      console.error('Failed to fetch URL metadata:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim() || !title.trim()) return;

    onSubmit({
      url: url.trim(),
      title: title.trim(),
      description: description.trim() || null,
      faviconUrl: faviconUrl || null,
      folderId: folderId || null,
      isPinned,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Bookmark' : 'Add Bookmark'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleFetchMetadata}
                disabled={isFetching || !url.trim()}
                title="Fetch page info"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={2}
            />
          </div>

          {/* Favicon Preview */}
          {faviconUrl && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center overflow-hidden">
                <img
                  src={faviconUrl}
                  alt=""
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="truncate flex-1">Favicon loaded</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFaviconUrl('')}
                className="text-xs h-6"
              >
                Clear
              </Button>
            </div>
          )}

          {/* Folder */}
          <div className="space-y-2">
            <Label htmlFor="folder">Folder</Label>
            <Select
              value={folderId || 'none'}
              onValueChange={(value) => setFolderId(value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    No folder
                  </span>
                </SelectItem>
                {flatFolders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <span style={{ paddingLeft: `${folder.level * 12}px` }}>
                      {folder.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pin */}
          <div className="flex items-center justify-between">
            <Label htmlFor="pinned" className="cursor-pointer">Pin to top</Label>
            <button
              id="pinned"
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                isPinned ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isPinned ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !url.trim() || !title.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditing ? 'Save Changes' : 'Add Bookmark'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
