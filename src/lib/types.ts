export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  type: string;
  position: Position;
  data: Record<string, any>;
}

export interface WireData {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceOutput?: string;
  targetInput?: string;
}

export interface WorkflowData {
  nodes: NodeData[];
  wires: WireData[];
}

export interface CanvasProps {
  workflow: WorkflowData;
  onWorkflowChange: (workflow: WorkflowData) => void;
  width?: number;
  height?: number;
  className?: string;
  onRequestNodeCreation?: (connectionInfo: {
    sourceNodeId: string;
    sourceType: 'input' | 'output';
    sourceIndex: number;
    position: { x: number; y: number };
  }) => void;
  cancelConnection?: boolean;
  isSidebarOpen?: boolean;
}

export interface NodeProps {
  node: NodeData;
  onNodeChange: (node: NodeData, isDragging?: boolean) => void;
  onDragEnd?: () => void;
  onDelete: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
  onSelect?: (nodeId: string, event?: React.MouseEvent) => void;
  isSelected?: boolean;
  onStartConnection?: (nodeId: string, type: 'input' | 'output', index: number, position: { x: number; y: number }) => void;
  onEndConnection?: (nodeId: string, type: 'input' | 'output', index: number) => void;
  isConnecting?: boolean;
  connectionSourceType?: 'input' | 'output' | null;
}