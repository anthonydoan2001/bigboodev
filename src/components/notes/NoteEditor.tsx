'use client';

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { useCallback, useEffect, useRef, memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Pin,
  PinOff,
  Folder,
  FolderOpen,
  Tags,
  LinkIcon as Link2Icon,
  Paperclip,
  Trash2,
  X,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  Check,
  FileSpreadsheet,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NoteWithRelations, TagWithCount, TagSummary, TaskSummary } from '@/types/notes';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Custom extension to handle Ctrl/Cmd+Click on links
const LinkClickHandler = Extension.create({
  name: 'linkClickHandler',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('handleLinkClick'),
        props: {
          handleClick(view, pos, event) {
            // Only handle clicks with Ctrl (Windows/Linux) or Cmd (Mac)
            if (event.ctrlKey || event.metaKey) {
              const { doc } = view.state;
              const resolved = doc.resolve(pos);

              // Check for link mark at the clicked position
              const marks = resolved.marks();
              const linkMark = marks.find((mark) => mark.type.name === 'link');

              if (linkMark?.attrs.href) {
                window.open(linkMark.attrs.href, '_blank', 'noopener,noreferrer');
                event.preventDefault();
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

// Attachment type for editor (matches API response)
interface AttachmentSummary {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
}

interface NoteEditorProps {
  note: NoteWithRelations | null;
  title: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  isPinned: boolean;
  onPinToggle: () => void;
  tags: TagWithCount[];
  noteTags: TagSummary[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => void;
  folders: { id: string; name: string }[];
  currentFolderId: string | null;
  onFolderChange: (folderId: string | null) => void;
  attachments: AttachmentSummary[];
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  linkedTasks: TaskSummary[];
  onLinkTask: () => void;
  onUnlinkTask: (taskId: string) => void;
  isUploading?: boolean;
}

const EditorToolbar = memo(function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const addLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border bg-muted/40 sticky top-0 z-10">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'transition-all',
          editor.isActive('bold') && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Bold (Cmd+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'transition-all',
          editor.isActive('italic') && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Italic (Cmd+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          'transition-all',
          editor.isActive('underline') && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Underline (Cmd+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(
          'transition-all',
          editor.isActive('strike') && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1.5" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          'transition-all',
          editor.isActive('heading', { level: 1 }) && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          'transition-all',
          editor.isActive('heading', { level: 2 }) && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          'transition-all',
          editor.isActive('heading', { level: 3 }) && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1.5" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          'transition-all',
          editor.isActive('bulletList') && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Bullet List (Ctrl+Shift+8)"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          'transition-all',
          editor.isActive('orderedList') && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Numbered List (Ctrl+Shift+7)"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1.5" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(
          'transition-all',
          editor.isActive('codeBlock') && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          'transition-all',
          editor.isActive('blockquote') && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={addLink}
        className={cn(
          'transition-all',
          editor.isActive('link') && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        title="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
});

export function NoteEditor({
  note,
  title,
  onTitleChange,
  onContentChange,
  isPinned,
  onPinToggle,
  tags,
  noteTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  folders,
  currentFolderId,
  onFolderChange,
  attachments,
  onUploadAttachment,
  onDeleteAttachment,
  linkedTasks,
  onLinkTask,
  onUnlinkTask,
  isUploading,
}: NoteEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
          title: 'Ctrl+Click to open link',
        },
      }),
      LinkClickHandler,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: note?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4 prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4',
      },
    },
    onUpdate: ({ editor }) => {
      // Call immediately - let page.tsx handle caching and debounced saving
      onContentChange(editor.getHTML());
    },
  });

  // Update editor content when note changes
  useEffect(() => {
    if (editor && note?.content !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== note.content) {
        editor.commands.setContent(note.content || '');
      }
    }
  }, [editor, note?.id]); // Only update when note ID changes

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAttachment(file);
    }
    e.target.value = '';
  }, [onUploadAttachment]);

  const availableTags = tags.filter(
    (tag) => !noteTags.some((nt) => nt.id === tag.id)
  );

  // Get current folder name
  const currentFolder = folders.find((f) => f.id === currentFolderId);

  return (
    <div className="flex flex-col h-full">
      {/* Title and Actions */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Note title..."
          className="text-base font-semibold border-none shadow-none focus-visible:ring-0 px-0"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onPinToggle}
          title={isPinned ? 'Unpin note' : 'Pin note'}
        >
          {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </Button>
      </div>

      {/* Metadata Bar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        {/* Folder Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5 border-input hover:bg-accent hover:border-primary/30 transition-all shadow-sm"
            >
              {currentFolder ? (
                <Folder className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/20" />
              ) : (
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="max-w-[120px] truncate font-medium">
                {currentFolder?.name || 'No folder'}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => onFolderChange(null)}
              className="gap-2 cursor-pointer"
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">No folder</span>
              {!currentFolderId && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            {folders.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => onFolderChange(folder.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <Folder className="h-4 w-4 text-yellow-500" />
                    <span className="flex-1 truncate">{folder.name}</span>
                    {currentFolderId === folder.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-border" />

        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          <Tags className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          {noteTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all hover:shadow-md group"
              style={{
                backgroundColor: tag.color + '15',
                borderColor: tag.color + '40',
                color: tag.color
              }}
            >
              <span className="truncate max-w-[100px]">{tag.name}</span>
              <button
                onClick={() => onRemoveTag(tag.id)}
                className="opacity-60 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                aria-label="Remove tag"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          {availableTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[11px] border-dashed gap-1 hover:bg-accent hover:border-primary/30 transition-all shadow-sm"
                >
                  + Add tag
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
                {availableTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.id}
                    onClick={() => onAddTag(tag.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <div
                      className="h-3 w-3 rounded-full border-2 flex-shrink-0"
                      style={{
                        borderColor: tag.color,
                        backgroundColor: tag.color + '20'
                      }}
                    />
                    <span className="flex-1 truncate">{tag.name}</span>
                    <span className="text-xs text-muted-foreground">{tag._count?.notes || 0}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Link Task */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLinkTask}
          className="h-7 text-[11px] gap-1.5 hover:bg-accent hover:border-primary/30 transition-all shadow-sm px-2.5"
        >
          <Link2Icon className="h-3 w-3" />
          Link Task
        </Button>

        {/* Attachment Upload */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-7 text-[11px] gap-1.5 hover:bg-accent hover:border-primary/30 transition-all shadow-sm px-2.5 disabled:opacity-50"
        >
          <Paperclip className="h-3 w-3" />
          {isUploading ? 'Uploading...' : 'Attach'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.csv,.md,.xls,.xlsx,.ods"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Editor Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Linked Tasks */}
      {linkedTasks.length > 0 && (
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <div className="text-[10px] font-semibold text-foreground mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
            <Link2Icon className="h-3 w-3" />
            Linked Tasks ({linkedTasks.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {linkedTasks.map((task) => (
              <div
                key={task.id}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-background rounded border border-border text-[11px] hover:shadow-sm transition-all group"
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  task.status === 'DONE' && 'bg-green-500',
                  task.status === 'IN_PROGRESS' && 'bg-yellow-500',
                  task.status === 'TODO' && 'bg-gray-400'
                )} />
                <span className="truncate max-w-[150px] font-medium">{task.title}</span>
                <button
                  onClick={() => onUnlinkTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                  aria-label="Unlink task"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <div className="text-[10px] font-semibold text-foreground mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
            <Paperclip className="h-3 w-3" />
            Attachments ({attachments.length})
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="group relative rounded border border-border bg-card overflow-hidden hover:shadow-sm transition-all"
              >
                {attachment.fileType === 'image' ? (
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square"
                  >
                    <img
                      src={attachment.fileUrl}
                      alt={attachment.fileName}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </a>
                ) : (
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center aspect-square bg-muted hover:bg-muted/70 transition-colors"
                  >
                    {attachment.fileType === 'spreadsheet' ? (
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    ) : attachment.fileType === 'pdf' ? (
                      <FileText className="h-8 w-8 text-red-500" />
                    ) : attachment.fileType === 'text' ? (
                      <FileText className="h-8 w-8 text-blue-500" />
                    ) : (
                      <File className="h-8 w-8 text-muted-foreground" />
                    )}
                  </a>
                )}
                <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 to-transparent text-white text-[9px] truncate">
                  {attachment.fileName}
                </div>
                <button
                  onClick={() => onDeleteAttachment(attachment.id)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-white rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/90 shadow-sm"
                  aria-label="Delete attachment"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
