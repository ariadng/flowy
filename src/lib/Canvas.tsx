import React, { useRef, useState, useCallback } from 'react';
import type { CanvasProps, NodeData, WireData } from './types';
import { Node } from './Node';
import { Wire } from './Wire';
import { getHandlePosition } from './utils';

interface ConnectionState {
  isConnecting: boolean;
  sourceNodeId: string | null;
  sourceType: 'input' | 'output' | null;
  sourceIndex: number | null;
  currentPosition: { x: number; y: number } | null;
  hasMouseMoved: boolean;
}

interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  nodeIds: string[];
  start: number;
  end: number;
}

export const Canvas: React.FC<CanvasProps> = ({
  workflow,
  onWorkflowChange,
  width = 800,
  height = 600,
  className = '',
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnecting: false,
    sourceNodeId: null,
    sourceType: null,
    sourceIndex: null,
    currentPosition: null,
    hasMouseMoved: false,
  });
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  // Constants for snapping
  const SNAP_THRESHOLD = 8; // pixels
  const NODE_WIDTH = 160; // standardized node width
  const NODE_HEIGHT = 80; // standardized node height

  // Function to calculate snapping and alignment guides
  const calculateSnapping = useCallback((draggedNode: NodeData, otherNodes: NodeData[]) => {
    const guides: AlignmentGuide[] = [];
    let snappedX = draggedNode.position.x;
    let snappedY = draggedNode.position.y;

    // Calculate center points for the dragged node
    const draggedCenterX = draggedNode.position.x + NODE_WIDTH / 2;
    const draggedCenterY = draggedNode.position.y + NODE_HEIGHT / 2;
    const draggedLeft = draggedNode.position.x;
    const draggedRight = draggedNode.position.x + NODE_WIDTH;
    const draggedTop = draggedNode.position.y;
    const draggedBottom = draggedNode.position.y + NODE_HEIGHT;

    for (const otherNode of otherNodes) {
      if (otherNode.id === draggedNode.id) continue;

      const otherCenterX = otherNode.position.x + NODE_WIDTH / 2;
      const otherCenterY = otherNode.position.y + NODE_HEIGHT / 2;
      const otherLeft = otherNode.position.x;
      const otherRight = otherNode.position.x + NODE_WIDTH;
      const otherTop = otherNode.position.y;
      const otherBottom = otherNode.position.y + NODE_HEIGHT;

      // Vertical alignment (X-axis snapping)
      // Center to center
      if (Math.abs(draggedCenterX - otherCenterX) < SNAP_THRESHOLD) {
        snappedX = otherNode.position.x;
        const startY = Math.min(draggedTop, otherTop) - 5;
        const endY = Math.max(draggedBottom, otherBottom) + 5;
        guides.push({ 
          type: 'vertical', 
          position: otherCenterX, 
          nodeIds: [draggedNode.id, otherNode.id],
          start: startY,
          end: endY
        });
      }
      // Left edges
      if (Math.abs(draggedLeft - otherLeft) < SNAP_THRESHOLD) {
        snappedX = otherNode.position.x;
        const startY = Math.min(draggedTop, otherTop) - 5;
        const endY = Math.max(draggedBottom, otherBottom) + 5;
        guides.push({ 
          type: 'vertical', 
          position: otherLeft, 
          nodeIds: [draggedNode.id, otherNode.id],
          start: startY,
          end: endY
        });
      }
      // Right edges
      if (Math.abs(draggedRight - otherRight) < SNAP_THRESHOLD) {
        snappedX = otherNode.position.x;
        const startY = Math.min(draggedTop, otherTop) - 5;
        const endY = Math.max(draggedBottom, otherBottom) + 5;
        guides.push({ 
          type: 'vertical', 
          position: otherRight, 
          nodeIds: [draggedNode.id, otherNode.id],
          start: startY,
          end: endY
        });
      }

      // Horizontal alignment (Y-axis snapping)
      // Center to center
      if (Math.abs(draggedCenterY - otherCenterY) < SNAP_THRESHOLD) {
        snappedY = otherNode.position.y;
        const startX = Math.min(draggedLeft, otherLeft) - 5;
        const endX = Math.max(draggedRight, otherRight) + 5;
        guides.push({ 
          type: 'horizontal', 
          position: otherCenterY, 
          nodeIds: [draggedNode.id, otherNode.id],
          start: startX,
          end: endX
        });
      }
      // Top edges
      if (Math.abs(draggedTop - otherTop) < SNAP_THRESHOLD) {
        snappedY = otherNode.position.y;
        const startX = Math.min(draggedLeft, otherLeft) - 5;
        const endX = Math.max(draggedRight, otherRight) + 5;
        guides.push({ 
          type: 'horizontal', 
          position: otherTop, 
          nodeIds: [draggedNode.id, otherNode.id],
          start: startX,
          end: endX
        });
      }
      // Bottom edges
      if (Math.abs(draggedBottom - otherBottom) < SNAP_THRESHOLD) {
        snappedY = otherNode.position.y;
        const startX = Math.min(draggedLeft, otherLeft) - 5;
        const endX = Math.max(draggedRight, otherRight) + 5;
        guides.push({ 
          type: 'horizontal', 
          position: otherBottom, 
          nodeIds: [draggedNode.id, otherNode.id],
          start: startX,
          end: endX
        });
      }
    }

    return {
      snappedPosition: { x: snappedX, y: snappedY },
      guides
    };
  }, []);

  const [currentDragNode, setCurrentDragNode] = useState<{node: NodeData, isDragging: boolean} | null>(null);

  const handleNodeChange = useCallback((updatedNode: NodeData, isDragging = false) => {
    // Store drag state for guide calculations
    if (isDragging) {
      setCurrentDragNode({node: updatedNode, isDragging});
    } else {
      setCurrentDragNode(null);
    }

    onWorkflowChange(prevWorkflow => {
      const otherNodes = prevWorkflow.nodes.filter(node => node.id !== updatedNode.id);
      
      let finalNode = updatedNode;
      
      // Apply snapping only during dragging
      if (isDragging) {
        const snapResult = calculateSnapping(updatedNode, otherNodes);
        finalNode = {
          ...updatedNode,
          position: snapResult.snappedPosition
        };
      }
      
      const updatedNodes = prevWorkflow.nodes.map(node =>
        node.id === updatedNode.id ? finalNode : node
      );
      return {
        ...prevWorkflow,
        nodes: updatedNodes,
      };
    });
  }, [onWorkflowChange, calculateSnapping]);

  // Update alignment guides based on current drag state
  React.useEffect(() => {
    if (currentDragNode?.isDragging) {
      const otherNodes = workflow.nodes.filter(node => node.id !== currentDragNode.node.id);
      const snapResult = calculateSnapping(currentDragNode.node, otherNodes);
      setAlignmentGuides(snapResult.guides);
    } else {
      setAlignmentGuides([]);
    }
  }, [currentDragNode, workflow.nodes, calculateSnapping]);

  const handleNodeDragEnd = useCallback(() => {
    // Clear drag state and alignment guides when dragging ends
    setCurrentDragNode(null);
    setAlignmentGuides([]);
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    onWorkflowChange(prevWorkflow => {
      const updatedNodes = prevWorkflow.nodes.filter(node => node.id !== nodeId);
      const updatedWires = prevWorkflow.wires.filter(
        wire => wire.sourceNodeId !== nodeId && wire.targetNodeId !== nodeId
      );
      return {
        nodes: updatedNodes,
        wires: updatedWires,
      };
    });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [onWorkflowChange, selectedNodeId]);

  const handleNodeEdit = useCallback((nodeId: string) => {
    // For now, just log the edit action - this can be extended later
    console.log('Edit node:', nodeId);
    // You could show a modal, inline editing, or other edit interface here
  }, []);

  const handleWireDelete = useCallback((wireId: string) => {
    onWorkflowChange(prevWorkflow => ({
      ...prevWorkflow,
      wires: prevWorkflow.wires.filter(wire => wire.id !== wireId),
    }));
  }, [onWorkflowChange]);

  const handleStartConnection = useCallback((
    nodeId: string,
    type: 'input' | 'output',
    index: number,
    position: { x: number; y: number }
  ) => {
    setConnectionState({
      isConnecting: true,
      sourceNodeId: nodeId,
      sourceType: type,
      sourceIndex: index,
      currentPosition: position,
      hasMouseMoved: false,
    });
  }, []);

  const handleEndConnection = useCallback((
    nodeId: string,
    type: 'input' | 'output',
    index: number
  ) => {
    if (!connectionState.isConnecting || !connectionState.sourceNodeId) {
      return;
    }

    // Don't allow connecting to the same node or same type (output to output, input to input)
    if (
      connectionState.sourceNodeId === nodeId ||
      connectionState.sourceType === type
    ) {
      setConnectionState({
        isConnecting: false,
        sourceNodeId: null,
        sourceType: null,
        sourceIndex: null,
        currentPosition: null,
        hasMouseMoved: false,
      });
      return;
    }

    // Create new wire
    const wireId = `wire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isSourceOutput = connectionState.sourceType === 'output';
    
    const newWire: WireData = {
      id: wireId,
      sourceNodeId: isSourceOutput ? connectionState.sourceNodeId : nodeId,
      targetNodeId: isSourceOutput ? nodeId : connectionState.sourceNodeId,
      sourceOutput: isSourceOutput ? connectionState.sourceIndex?.toString() : index.toString(),
      targetInput: isSourceOutput ? index.toString() : connectionState.sourceIndex?.toString(),
    };

    // Check if wire already exists and add if it doesn't
    onWorkflowChange(prevWorkflow => {
      const wireExists = prevWorkflow.wires.some(
        wire =>
          wire.sourceNodeId === newWire.sourceNodeId &&
          wire.targetNodeId === newWire.targetNodeId &&
          wire.sourceOutput === newWire.sourceOutput &&
          wire.targetInput === newWire.targetInput
      );

      if (!wireExists) {
        return {
          ...prevWorkflow,
          wires: [...prevWorkflow.wires, newWire],
        };
      }
      
      return prevWorkflow;
    });

    setConnectionState({
      isConnecting: false,
      sourceNodeId: null,
      sourceType: null,
      sourceIndex: null,
      currentPosition: null,
      hasMouseMoved: false,
    });
  }, [connectionState, onWorkflowChange]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (connectionState.isConnecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setConnectionState(prev => ({
        ...prev,
        currentPosition: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
        hasMouseMoved: true,
      }));
    }
  }, [connectionState.isConnecting]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // Check if clicked on canvas background or SVG background
    const target = event.target as HTMLElement;
    const isCanvasBackground = target === canvasRef.current;
    const isSvgBackground = target.tagName === 'svg';
    
    if (isCanvasBackground || isSvgBackground) {
      setSelectedNodeId(null);
      // Cancel connection if clicking on canvas
      if (connectionState.isConnecting) {
        setConnectionState({
          isConnecting: false,
          sourceNodeId: null,
          sourceType: null,
          sourceIndex: null,
          currentPosition: null,
          hasMouseMoved: false,
        });
      }
    }
  }, [connectionState.isConnecting]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // Clear selection on Esc
      setSelectedNodeId(null);
      
      // Cancel connection if active
      if (connectionState.isConnecting) {
        setConnectionState({
          isConnecting: false,
          sourceNodeId: null,
          sourceType: null,
          sourceIndex: null,
          currentPosition: null,
          hasMouseMoved: false,
        });
      }
    }
  }, [connectionState.isConnecting]);

  // Add mouse move listener for connection dragging
  React.useEffect(() => {
    if (connectionState.isConnecting) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [connectionState.isConnecting, handleMouseMove]);

  // Add keyboard listener for Esc key
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      ref={canvasRef}
      className={`relative bg-gray-50 border border-gray-300 overflow-hidden ${className}`}
      style={{ width, height }}
      onClick={handleCanvasClick}
    >
      <svg 
        className="absolute inset-0" 
        width={width} 
        height={height}
        style={{ pointerEvents: 'auto' }}
      >
        {workflow.wires.map(wire => (
          <Wire
            key={wire.id}
            wire={wire}
            nodes={workflow.nodes}
            onDelete={handleWireDelete}
          />
        ))}
        
        {/* Alignment guides */}
        {alignmentGuides.map((guide, index) => (
          <line
            key={`guide-${index}`}
            x1={guide.type === 'vertical' ? guide.position : guide.start}
            y1={guide.type === 'vertical' ? guide.start : guide.position}
            x2={guide.type === 'vertical' ? guide.position : guide.end}
            y2={guide.type === 'vertical' ? guide.end : guide.position}
            stroke="#ff6b6b"
            strokeWidth="1"
            strokeDasharray="4,4"
            style={{ pointerEvents: 'none' }}
            className="opacity-75"
          />
        ))}
        
        {/* Temporary connection line while dragging */}
        {connectionState.isConnecting && connectionState.currentPosition && connectionState.sourceNodeId && connectionState.sourceIndex !== null && connectionState.hasMouseMoved && (
          (() => {
            const sourceNode = workflow.nodes.find(n => n.id === connectionState.sourceNodeId);
            if (!sourceNode) return null;
            
            const isOutput = connectionState.sourceType === 'output';
            const nodeWidth = 160;
            const nodeHeight = 80;
            
            // Use the same utility function as Wire component for exact positioning
            const sourcePosition = getHandlePosition(
              sourceNode,
              isOutput,
              connectionState.sourceIndex
            );
            const sourceX = sourcePosition.x;
            const sourceY = sourcePosition.y;
            
            const targetX = connectionState.currentPosition.x;
            const targetY = connectionState.currentPosition.y;
            
            const controlX1 = sourceX + Math.abs(targetX - sourceX) * 0.3;
            const controlX2 = targetX - Math.abs(targetX - sourceX) * 0.3;
            
            const pathData = `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY} ${controlX2} ${targetY} ${targetX} ${targetY}`;
            
            // Color based on source handle type: green for outputs, blue for inputs
            const wireColor = isOutput ? "#10b981" : "#3b82f6"; // green-500 for output, blue-500 for input
            
            return (
              <path
                d={pathData}
                stroke={wireColor}
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                style={{ pointerEvents: 'none' }}
              />
            );
          })()
        )}
      </svg>
      
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {workflow.nodes.map(node => (
          <Node
            key={node.id}
            node={node}
            onNodeChange={handleNodeChange}
            onDragEnd={handleNodeDragEnd}
            onDelete={handleNodeDelete}
            onEdit={handleNodeEdit}
            onSelect={handleNodeSelect}
            isSelected={selectedNodeId === node.id}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
            isConnecting={connectionState.isConnecting}
          />
        ))}
      </div>
    </div>
  );
};