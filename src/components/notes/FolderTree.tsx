'use client';

import { useState, memo, useCallback, useRef } from 'react';
import { FolderTreeNode, NoteSection } from '@/types/notes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  useDndContext,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Trash2,
  MoreHorizontal,
  Plus,
  Pencil,
  Pin,
  PinOff,
  LayoutList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Drop Indicator Line ──────────────────────────────────────────────────────

interface DropIndicator {
  folderId: string;
  position: 'above' | 'below';
  sectionId: string | null;
}

function DropIndicatorLine() {
  return (
    <div className="relative h-0 z-10">
      <div className="absolute left-2 right-2 border-t-2 border-primary rounded-full" />
      <div className="absolute left-1 top-[-3px] w-[6px] h-[6px] rounded-full bg-primary" />
    </div>
  );
}

// ─── Draggable + Droppable Folder Item ────────────────────────────────────────

interface FolderItemProps {
  folder: FolderTreeNode;
  level: number;
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onRename: (folderId: string, currentName: string) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  onPinFolder: (folderId: string, isPinned: boolean) => void;
  isDragging?: boolean;
  dropIndicator: DropIndicator | null;
}

function DraggableFolderItem(props: FolderItemProps) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `folder-${props.folder.id}`,
    data: { type: 'folder', folderId: props.folder.id, sectionId: props.folder.sectionId },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `folder-drop-${props.folder.id}`,
    data: { type: 'folder-target', folderId: props.folder.id, sectionId: props.folder.sectionId },
  });

  const style = isDragging
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: 50,
        position: 'relative' as const,
      }
    : undefined;

  // Combine refs
  const combinedRef = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );

  return (
    <FolderItem
      {...props}
      dragRef={combinedRef}
      dragListeners={listeners}
      dragAttributes={attributes}
      isDragActive={isDragging}
      dragStyle={style}
    />
  );
}

const FolderItem = memo(function FolderItem({
  folder,
  level,
  selectedFolderId,
  onSelect,
  onRename,
  onDelete,
  onCreateSubfolder,
  onPinFolder,
  dragRef,
  dragListeners,
  dragAttributes,
  isDragActive,
  dragStyle,
  dropIndicator,
}: FolderItemProps & {
  dragRef?: (node: HTMLElement | null) => void;
  dragListeners?: ReturnType<typeof useDraggable>['listeners'];
  dragAttributes?: ReturnType<typeof useDraggable>['attributes'];
  isDragActive?: boolean;
  dragStyle?: React.CSSProperties;
}) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;
  const canCreateSubfolder = level < 2;

  const showAbove = dropIndicator?.folderId === folder.id && dropIndicator.position === 'above';
  const showBelow = dropIndicator?.folderId === folder.id && dropIndicator.position === 'below';

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <div>
      {showAbove && <DropIndicatorLine />}
      <div
        ref={dragRef}
        className={cn(
          'group flex items-center gap-1 py-2 md:py-1 pr-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors touch-none min-w-0',
          isSelected && 'bg-accent',
          isDragActive && 'bg-card border border-border shadow-lg rounded-md opacity-50'
        )}
        style={{ paddingLeft: `${level * 12 + 6}px`, ...dragStyle }}
        onClick={() => onSelect(folder.id)}
        {...dragListeners}
        {...dragAttributes}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-favorite flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-favorite flex-shrink-0" />
        )}

        {folder.isPinned && (
          <Pin className="h-3 w-3 text-favorite fill-favorite/20 flex-shrink-0" />
        )}

        <span className="flex-1 text-base truncate">{folder.name}</span>

        <span className="text-xs text-muted-foreground min-w-[1.25rem] text-right">
          {folder.noteCount > 0 ? folder.noteCount : ''}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 md:opacity-0 md:group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPinFolder(folder.id, !folder.isPinned)}>
              {folder.isPinned ? (
                <>
                  <PinOff className="h-4 w-4 mr-2" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4 mr-2" />
                  Pin to top
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename(folder.id, folder.name)}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            {canCreateSubfolder && (
              <DropdownMenuItem onClick={() => onCreateSubfolder(folder.id)}>
                <Plus className="h-4 w-4 mr-2" />
                New Subfolder
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(folder.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {showBelow && <DropIndicatorLine />}

      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <DraggableFolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCreateSubfolder={onCreateSubfolder}
              onPinFolder={onPinFolder}
              dropIndicator={dropIndicator}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Droppable Section ────────────────────────────────────────────────────────

interface SectionItemProps {
  section: NoteSection;
  folders: FolderTreeNode[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onPinFolder: (folderId: string, isPinned: boolean) => void;
  onRenameSection: (sectionId: string, currentName: string) => void;
  onDeleteSection: (sectionId: string) => void;
  dropIndicator: DropIndicator | null;
}

function SectionItem({
  section,
  folders,
  selectedFolderId,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
  onPinFolder,
  onRenameSection,
  onDeleteSection,
  dropIndicator,
}: SectionItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { isOver, setNodeRef } = useDroppable({
    id: `section-${section.id}`,
    data: { type: 'section', sectionId: section.id },
  });
  const { active } = useDndContext();

  const activeSectionId = active?.data.current?.sectionId as string | null | undefined;
  const isOverSection = isOver && activeSectionId !== section.id;
  const hasFolderIndicator = dropIndicator && dropIndicator.sectionId === section.id;
  const showDropHighlight = isOverSection && !hasFolderIndicator;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mt-1 rounded-md transition-colors',
        showDropHighlight && 'bg-primary/10 ring-1 ring-primary/30'
      )}
    >
      <div
        className={cn(
          'group flex items-center gap-1.5 py-2 md:py-1 px-2 rounded-md cursor-pointer hover:bg-accent/30 transition-colors min-w-0',
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <LayoutList className="h-3.5 w-3.5 text-info flex-shrink-0" />
        <span className="flex-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {section.name}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 md:opacity-0 md:group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCreateFolder()}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRenameSection(section.id, section.name)}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename Section
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteSection(section.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && (
        <div className="ml-1">
          {folders.length === 0 && (
            <div className="py-1 px-4 text-xs text-muted-foreground/60 italic">
              Drop folders here
            </div>
          )}
          {folders.map((folder) => (
            <DraggableFolderItem
              key={folder.id}
              folder={folder}
              level={1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelectFolder}
              onRename={onRenameFolder}
              onDelete={onDeleteFolder}
              onCreateSubfolder={(parentId) => onCreateFolder(parentId)}
              onPinFolder={onPinFolder}
              dropIndicator={dropIndicator}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Droppable "Unsectioned" area ─────────────────────────────────────────────

function UnsectionedDropZone({
  folders,
  selectedFolderId,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
  onPinFolder,
  dropIndicator,
}: {
  folders: FolderTreeNode[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onPinFolder: (folderId: string, isPinned: boolean) => void;
  dropIndicator: DropIndicator | null;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'section-unsectioned',
    data: { type: 'section', sectionId: null },
  });

  if (folders.length === 0) return null;

  return (
    <div ref={setNodeRef} className="mt-1.5">
      <div
        className={cn(
          'px-2 py-0.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider rounded-md transition-colors',
          isOver && 'bg-primary/10 ring-1 ring-primary/30'
        )}
      >
        Folders
      </div>
      {folders.map((folder) => (
        <DraggableFolderItem
          key={folder.id}
          folder={folder}
          level={0}
          selectedFolderId={selectedFolderId}
          onSelect={onSelectFolder}
          onRename={onRenameFolder}
          onDelete={onDeleteFolder}
          onCreateSubfolder={(parentId) => onCreateFolder(parentId)}
          onPinFolder={onPinFolder}
          dropIndicator={dropIndicator}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface FolderTreeProps {
  folders: FolderTreeNode[];
  sections: NoteSection[];
  selectedFolderId: string | null;
  showTrash: boolean;
  onSelectFolder: (folderId: string | null) => void;
  onToggleTrash: () => void;
  onCreateFolder: (parentId?: string) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onPinFolder: (folderId: string, isPinned: boolean) => void;
  onCreateSection: () => void;
  onRenameSection: (sectionId: string, currentName: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderFolders: (folderIds: string[], sectionId: string | null) => void;
  totalNotes: number;
  trashedNotes: number;
}

export function FolderTree({
  folders,
  sections,
  selectedFolderId,
  showTrash,
  onSelectFolder,
  onToggleTrash,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onPinFolder,
  onCreateSection,
  onRenameSection,
  onDeleteSection,
  onReorderFolders,
  totalNotes,
  trashedNotes,
}: FolderTreeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const dropIndicatorRef = useRef<DropIndicator | null>(null);

  // Group folders by section
  const sectionFolders = new Map<string, FolderTreeNode[]>();
  const unsectionedFolders: FolderTreeNode[] = [];

  for (const folder of folders) {
    if (folder.sectionId) {
      if (!sectionFolders.has(folder.sectionId)) {
        sectionFolders.set(folder.sectionId, []);
      }
      sectionFolders.get(folder.sectionId)!.push(folder);
    } else {
      unsectionedFolders.push(folder);
    }
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const folderId = event.active.data.current?.folderId as string;
    onSelectFolder(folderId);
  }, [onSelectFolder]);

  const updateDropIndicator = useCallback((value: DropIndicator | null) => {
    dropIndicatorRef.current = value;
    setDropIndicator(value);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !active) {
      updateDropIndicator(null);
      return;
    }

    const overData = over.data.current;
    const activeFolderId = active.data.current?.folderId as string;

    // Over a folder target - show line indicator
    if (overData?.type === 'folder-target') {
      const targetFolderId = overData.folderId as string;
      const targetSectionId = overData.sectionId as string | null;

      if (targetFolderId === activeFolderId) {
        updateDropIndicator(null);
        return;
      }

      if (over.rect) {
        const rect = over.rect;
        const cursorY = (event.activatorEvent as PointerEvent)?.clientY;
        const deltaY = event.delta?.y ?? 0;
        const currentY = cursorY + deltaY;
        const midY = rect.top + rect.height / 2;

        updateDropIndicator({
          folderId: targetFolderId,
          position: currentY < midY ? 'above' : 'below',
          sectionId: targetSectionId,
        });
      }
      return;
    }

    if (overData?.type === 'section') {
      updateDropIndicator(null);
    }
  }, [updateDropIndicator]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const currentDropIndicator = dropIndicatorRef.current;
    updateDropIndicator(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    const activeFolderId = activeData?.folderId as string;
    const activeSectionId = activeData?.sectionId as string | null;

    // Dropped on a folder target - reorder
    if (overData?.type === 'folder-target' && currentDropIndicator) {
      const targetFolderId = currentDropIndicator.folderId;
      const targetSectionId = currentDropIndicator.sectionId;

      const targetFolders = targetSectionId
        ? [...(sectionFolders.get(targetSectionId) || [])]
        : [...unsectionedFolders];

      if (activeSectionId === targetSectionId) {
        const folderIds = targetFolders.map((f) => f.id);
        const activeIndex = folderIds.indexOf(activeFolderId);
        let targetIndex = folderIds.indexOf(targetFolderId);

        if (activeIndex === -1 || targetIndex === -1) return;
        if (activeIndex === targetIndex) return;

        folderIds.splice(activeIndex, 1);
        targetIndex = folderIds.indexOf(targetFolderId);
        if (targetIndex === -1) return;

        const insertIndex = currentDropIndicator.position === 'above' ? targetIndex : targetIndex + 1;
        folderIds.splice(insertIndex, 0, activeFolderId);

        onReorderFolders(folderIds, targetSectionId);
      } else {
        const targetFolderIds = targetFolders.map((f) => f.id);
        const targetIndex = targetFolderIds.indexOf(targetFolderId);

        if (targetIndex === -1) return;

        const insertIndex = currentDropIndicator.position === 'above' ? targetIndex : targetIndex + 1;
        targetFolderIds.splice(insertIndex, 0, activeFolderId);

        const sourceFolders = activeSectionId
          ? [...(sectionFolders.get(activeSectionId) || [])]
          : [...unsectionedFolders];
        const sourceFolderIds = sourceFolders.map((f) => f.id).filter((id) => id !== activeFolderId);

        onReorderFolders(sourceFolderIds, activeSectionId);
        onReorderFolders(targetFolderIds, targetSectionId);
      }
      return;
    }

    // Dropped on a section - append to end
    if (overData?.type === 'section') {
      const targetSectionId = overData.sectionId as string | null;

      if (activeSectionId === targetSectionId) return;

      const sourceFolders = activeSectionId
        ? [...(sectionFolders.get(activeSectionId) || [])]
        : [...unsectionedFolders];
      const sourceFolderIds = sourceFolders.map((f) => f.id).filter((id) => id !== activeFolderId);

      const targetFolders = targetSectionId
        ? [...(sectionFolders.get(targetSectionId) || [])]
        : [...unsectionedFolders];
      const targetFolderIds = [...targetFolders.map((f) => f.id), activeFolderId];

      onReorderFolders(sourceFolderIds, activeSectionId);
      onReorderFolders(targetFolderIds, targetSectionId);
    }
  }, [updateDropIndicator, folders, sectionFolders, unsectionedFolders, onReorderFolders]);

  const handleDragCancel = useCallback(() => {
    updateDropIndicator(null);
  }, [updateDropIndicator]);

  return (
    <div className="h-full flex flex-col overflow-x-clip">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <h2 className="font-semibold text-base">Notes</h2>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCreateSection}
            title="New Section"
          >
            <LayoutList className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onCreateFolder()}
            title="New Folder"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-clip py-1.5">
        {/* All Notes */}
        <div
          className={cn(
            'flex items-center gap-1.5 py-2 md:py-1 px-2 cursor-pointer hover:bg-accent/50 transition-colors',
            selectedFolderId === null && !showTrash && 'bg-accent'
          )}
          onClick={() => onSelectFolder(null)}
        >
          <FileText className="h-4 w-4 text-info" />
          <span className="flex-1 text-base">All Notes</span>
          <span className="text-xs text-muted-foreground">{totalNotes}</span>
        </div>

        {/* DnD Context wraps sections and folders */}
        <DndContext
          sensors={sensors}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Sections */}
          {sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              folders={sectionFolders.get(section.id) || []}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateFolder={onCreateFolder}
              onPinFolder={onPinFolder}
              onRenameSection={onRenameSection}
              onDeleteSection={onDeleteSection}
              dropIndicator={dropIndicator}
            />
          ))}

          {/* Unsectioned Folders */}
          <UnsectionedDropZone
            folders={unsectionedFolders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onCreateFolder={onCreateFolder}
            onPinFolder={onPinFolder}
            dropIndicator={dropIndicator}
          />
        </DndContext>
      </div>

      {/* Trash */}
      <div className="border-t border-border p-1.5">
        <div
          className={cn(
            'flex items-center gap-1.5 py-2 md:py-1 px-2 cursor-pointer hover:bg-accent/50 rounded-md transition-colors',
            showTrash && 'bg-accent'
          )}
          onClick={onToggleTrash}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-base">Trash</span>
          {trashedNotes > 0 && (
            <span className="text-xs text-muted-foreground">{trashedNotes}</span>
          )}
        </div>
      </div>
    </div>
  );
}
