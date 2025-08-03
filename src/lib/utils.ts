import type { NodeData, WireData, WorkflowData, Position } from './types';

export const createNode = (
  id: string,
  type: string,
  position: Position,
  data: Record<string, any> = {}
): NodeData => ({
  id,
  type,
  position,
  data: {
    title: type,
    ...data,
  },
});

export const createWire = (
  id: string,
  sourceNodeId: string,
  targetNodeId: string,
  sourceOutput?: string,
  targetInput?: string
): WireData => ({
  id,
  sourceNodeId,
  targetNodeId,
  sourceOutput,
  targetInput,
});

export const createWorkflow = (
  nodes: NodeData[] = [],
  wires: WireData[] = []
): WorkflowData => ({
  nodes,
  wires,
});

export const addNodeToWorkflow = (
  workflow: WorkflowData,
  node: NodeData
): WorkflowData => ({
  ...workflow,
  nodes: [...workflow.nodes, node],
});

export const addWireToWorkflow = (
  workflow: WorkflowData,
  wire: WireData
): WorkflowData => ({
  ...workflow,
  wires: [...workflow.wires, wire],
});

export const removeNodeFromWorkflow = (
  workflow: WorkflowData,
  nodeId: string
): WorkflowData => ({
  nodes: workflow.nodes.filter(node => node.id !== nodeId),
  wires: workflow.wires.filter(
    wire => wire.sourceNodeId !== nodeId && wire.targetNodeId !== nodeId
  ),
});

export const removeWireFromWorkflow = (
  workflow: WorkflowData,
  wireId: string
): WorkflowData => ({
  ...workflow,
  wires: workflow.wires.filter(wire => wire.id !== wireId),
});

export const updateNodeInWorkflow = (
  workflow: WorkflowData,
  nodeId: string,
  updates: Partial<NodeData>
): WorkflowData => ({
  ...workflow,
  nodes: workflow.nodes.map(node =>
    node.id === nodeId ? { ...node, ...updates } : node
  ),
});

export const serializeWorkflow = (workflow: WorkflowData): string => {
  return JSON.stringify(workflow, null, 2);
};

export const deserializeWorkflow = (json: string): WorkflowData => {
  try {
    const parsed = JSON.parse(json);
    return {
      nodes: parsed.nodes || [],
      wires: parsed.wires || [],
    };
  } catch (error) {
    console.error('Failed to deserialize workflow:', error);
    return createWorkflow();
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Get exact handle position matching Node component logic
export const getHandlePosition = (
  node: NodeData,
  isOutput: boolean,
  handleIndex: number
): { x: number; y: number } => {
  // Standardized node dimensions (160x80 pixels)
  const nodeWidth = 160;
  const nodeHeight = 80;
  const handleSize = 16; // w-4 h-4 = 16px
  const handleOffset = 8; // handles are positioned -8px from edge
  
  if (isOutput) {
    // Output handle on right side
    const totalOutputs = node.data.outputs?.length || 1;
    const topOffsetPercent = totalOutputs === 1 
      ? 50 
      : ((handleIndex + 1) / (totalOutputs + 1)) * 100;
    
    return {
      x: node.position.x + nodeWidth, // handle center at right edge
      y: node.position.y + (nodeHeight * topOffsetPercent / 100), // Center of handle position
    };
  } else {
    // Input handle on left side  
    const totalInputs = node.data.inputs?.length || 1;
    const topOffsetPercent = totalInputs === 1 
      ? 50 
      : ((handleIndex + 1) / (totalInputs + 1)) * 100;
    
    return {
      x: node.position.x, // handle center at left edge
      y: node.position.y + (nodeHeight * topOffsetPercent / 100), // Center of handle position
    };
  }
};