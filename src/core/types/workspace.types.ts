export type WorkspaceItemType = 
  | 'calculation' 
  | 'expression' 
  | 'graphFunction' 
  | 'dataset' 
  | 'matrix' 
  | 'vector' 
  | 'equation' 
  | 'geometry' 
  | 'note';

export interface WorkspaceItem {
  id: string;
  type: WorkspaceItemType;
  content: any; // Will be typed based on WorkspaceItemType in future iterations
  createdAt: number;
  updatedAt: number;
}

export interface Workspace {
  id: string;
  name: string;
  items: WorkspaceItem[];
  createdAt: number;
  updatedAt: number;
}
