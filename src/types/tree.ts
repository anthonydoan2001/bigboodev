export interface TreeNode {
  id: string;
  name: string;
  parentId: string | null;
  sectionId: string | null;
  children: TreeNode[];
  isPinned: boolean;
  position: number;
}

export interface TreeSection {
  id: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
