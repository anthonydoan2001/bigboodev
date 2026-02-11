import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { FolderDialogState, SectionDialogState } from '@/lib/hooks/useFolderSectionDialogs';

interface FolderSectionDialogsProps {
  folderDialog: FolderDialogState;
  setFolderDialog: (state: FolderDialogState) => void;
  onFolderDialogSubmit: () => void;
  isCreatingFolder: boolean;
  isUpdatingFolder: boolean;
  sectionDialog: SectionDialogState;
  setSectionDialog: (state: SectionDialogState) => void;
  onSectionDialogSubmit: () => void;
  isCreatingSection: boolean;
  isUpdatingSection: boolean;
}

export function FolderSectionDialogs({
  folderDialog,
  setFolderDialog,
  onFolderDialogSubmit,
  isCreatingFolder,
  isUpdatingFolder,
  sectionDialog,
  setSectionDialog,
  onSectionDialogSubmit,
  isCreatingSection,
  isUpdatingSection,
}: FolderSectionDialogsProps) {
  return (
    <>
      {/* Folder Dialog */}
      <Dialog
        open={folderDialog.open}
        onOpenChange={(open) => !open && setFolderDialog({ open: false, name: '' })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {folderDialog.editId ? 'Rename Folder' : 'New Folder'}
            </DialogTitle>
            <DialogDescription>
              {folderDialog.editId
                ? 'Enter a new name for the folder'
                : 'Enter a name for the new folder'}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={folderDialog.name}
            onChange={(e) => setFolderDialog({ ...folderDialog, name: e.target.value })}
            placeholder="Folder name..."
            onKeyDown={(e) => e.key === 'Enter' && onFolderDialogSubmit()}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFolderDialog({ open: false, name: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={onFolderDialogSubmit}
              disabled={!folderDialog.name.trim() || isCreatingFolder || isUpdatingFolder}
            >
              {folderDialog.editId ? 'Rename' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Dialog */}
      <Dialog
        open={sectionDialog.open}
        onOpenChange={(open) => !open && setSectionDialog({ open: false, name: '' })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {sectionDialog.editId ? 'Rename Section' : 'New Section'}
            </DialogTitle>
            <DialogDescription>
              {sectionDialog.editId
                ? 'Enter a new name for the section'
                : 'Sections group your folders (e.g. "IT", "Personal")'}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={sectionDialog.name}
            onChange={(e) => setSectionDialog({ ...sectionDialog, name: e.target.value })}
            placeholder="Section name..."
            onKeyDown={(e) => e.key === 'Enter' && onSectionDialogSubmit()}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSectionDialog({ open: false, name: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={onSectionDialogSubmit}
              disabled={!sectionDialog.name.trim() || isCreatingSection || isUpdatingSection}
            >
              {sectionDialog.editId ? 'Rename' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
