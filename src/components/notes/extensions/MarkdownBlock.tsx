'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Module augmentation for TipTap commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    markdownBlock: {
      setMarkdownBlock: (attributes?: { content?: string }) => ReturnType;
    };
  }
}

interface MarkdownBlockAttributes {
  content?: string;
}

// React component for the markdown block node view
function MarkdownBlockView({ node, updateAttributes, selected }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(!node.attrs.content);
  const [editContent, setEditContent] = useState(node.attrs.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize on initial render
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    updateAttributes({ content: editContent });
    setIsEditing(false);
  }, [editContent, updateAttributes]);

  const handleCancel = useCallback(() => {
    setEditContent(node.attrs.content || '');
    setIsEditing(false);
  }, [node.attrs.content]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
    // Ctrl/Cmd + Enter to save
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  }, [handleCancel, handleSave]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }, []);

  return (
    <NodeViewWrapper className="markdown-block-wrapper">
      <div
        className={cn(
          'markdown-block',
          'relative my-2 transition-all',
          selected && 'ring-2 ring-primary/30'
        )}
      >
        {isEditing ? (
          <div className="p-3">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter markdown here... (Ctrl+Enter to save, Escape to cancel)"
              className="w-full min-h-[100px] bg-transparent font-mono text-sm resize-none focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-end gap-2 mt-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSave}
                className="h-7 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="group relative"
            onDoubleClick={() => setIsEditing(true)}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsEditing(true)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
              title="Edit markdown"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <div className="markdown-block-content p-3 prose prose-sm max-w-none text-white [&_*]:text-white">
              {node.attrs.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {node.attrs.content}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic text-sm">
                  Double-click to add markdown content...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// TipTap Node Extension
export const MarkdownBlock = Node.create({
  name: 'markdownBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      content: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="markdown-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'markdown-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MarkdownBlockView);
  },

  addCommands() {
    return {
      setMarkdownBlock:
        (attributes?: MarkdownBlockAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
