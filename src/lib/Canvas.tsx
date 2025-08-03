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
  onRequestNodeCreation,
  cancelConnection = false,
  isSidebarOpen = false,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnecting: false,
    sourceNodeId: null,
    sourceType: null,
    sourceIndex: null,
    currentPosition: null,
    hasMouseMoved: false,
  });
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  
  // Viewport/Panning state
  const [viewportTransform, setViewportTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Touch state
  const [touchState, setTouchState] = useState<{
    initialDistance: number;
    initialScale: number;
    initialCenter: { x: number; y: number };
    lastTouchCenter: { x: number; y: number };
  } | null>(null);

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
    // Clear selection if any deleted nodes were selected
    setSelectedNodeIds(prev => prev.filter(id => id !== nodeId));
  }, [onWorkflowChange]);

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
    // Only update wire position if connecting and sidebar is not open
    if (connectionState.isConnecting && canvasRef.current && !isSidebarOpen) {
      const rect = canvasRef.current.getBoundingClientRect();
      // Convert screen coordinates to canvas coordinates considering viewport transform
      const canvasX = (event.clientX - rect.left - viewportTransform.x) / viewportTransform.scale;
      const canvasY = (event.clientY - rect.top - viewportTransform.y) / viewportTransform.scale;
      
      setConnectionState(prev => ({
        ...prev,
        currentPosition: {
          x: canvasX,
          y: canvasY,
        },
        hasMouseMoved: true,
      }));
    }
  }, [connectionState.isConnecting, viewportTransform, isSidebarOpen]);

  const handleNodeSelect = useCallback((nodeId: string, event?: React.MouseEvent) => {
    const isMultiSelect = event && (event.ctrlKey || event.metaKey);
    
    if (isMultiSelect) {
      // Multi-select: toggle node in selection
      setSelectedNodeIds(prev => {
        if (prev.includes(nodeId)) {
          // Remove if already selected
          return prev.filter(id => id !== nodeId);
        } else {
          // Add to selection
          return [...prev, nodeId];
        }
      });
    } else {
      // Single select: replace selection
      setSelectedNodeIds([nodeId]);
    }
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // Only handle clicks if not panning
    if (isPanning) return;
    
    // Check if clicked on canvas background or SVG background
    const target = event.target as HTMLElement;
    const isCanvasBackground = target === canvasRef.current;
    const isSvgBackground = target.tagName === 'svg';
    
    if (isCanvasBackground || isSvgBackground) {
      setSelectedNodeIds([]);
      // Handle connection release on blank canvas
      if (connectionState.isConnecting && connectionState.hasMouseMoved && onRequestNodeCreation) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          // Convert screen coordinates to canvas coordinates
          const canvasX = (event.clientX - rect.left - viewportTransform.x) / viewportTransform.scale;
          const canvasY = (event.clientY - rect.top - viewportTransform.y) / viewportTransform.scale;
          
          // Update the current position to the click location and keep connection active
          setConnectionState(prev => ({
            ...prev,
            currentPosition: { x: canvasX, y: canvasY }
          }));
          
          onRequestNodeCreation({
            sourceNodeId: connectionState.sourceNodeId!,
            sourceType: connectionState.sourceType!,
            sourceIndex: connectionState.sourceIndex!,
            position: { x: canvasX, y: canvasY }
          });
          
          // Don't clear connection state - keep temporary wire visible
          return;
        }
      }
      
      // Only clear selection, don't cancel connection on canvas click
      // Connection will be cancelled when user presses Esc or closes sidebar
    }
  }, [connectionState, isPanning, onRequestNodeCreation, viewportTransform]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // Clear selection on Esc
      setSelectedNodeIds([]);
    } else if (event.key === 'Delete' && selectedNodeIds.length > 0) {
      // Delete selected nodes on Delete key
      event.preventDefault();
      selectedNodeIds.forEach(nodeId => handleNodeDelete(nodeId));
      
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
  }, [connectionState.isConnecting, selectedNodeIds, handleNodeDelete]);

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

  // Handle connection cancellation from parent component
  React.useEffect(() => {
    if (cancelConnection && connectionState.isConnecting) {
      setConnectionState({
        isConnecting: false,
        sourceNodeId: null,
        sourceType: null,
        sourceIndex: null,
        currentPosition: null,
        hasMouseMoved: false,
      });
    }
  }, [cancelConnection, connectionState.isConnecting]);

  // Panning handlers
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    // Only start panning if clicking on canvas background (not nodes or other elements)
    const target = event.target as HTMLElement;
    const isCanvasBackground = target === canvasRef.current;
    const isSvgBackground = target.tagName === 'svg';
    
    if ((isCanvasBackground || isSvgBackground) && event.button === 0) {
      setIsPanning(true);
      setPanStart({
        x: event.clientX - viewportTransform.x,
        y: event.clientY - viewportTransform.y
      });
      event.preventDefault();
    }
  }, [viewportTransform]);

  const handleCanvasMouseMove = useCallback((event: MouseEvent) => {
    if (isPanning) {
      const newX = event.clientX - panStart.x;
      const newY = event.clientY - panStart.y;
      
      setViewportTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    }
  }, [isPanning, panStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Add panning event listeners
  React.useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleCanvasMouseMove);
      document.addEventListener('mouseup', handleCanvasMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleCanvasMouseMove);
        document.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [isPanning, handleCanvasMouseMove, handleCanvasMouseUp]);

  // Detect platform for zoom behavior
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Zoom handler with platform-specific behavior
  const handleWheel = useCallback((event: WheelEvent) => {
    let shouldZoom = false;
    
    if (isMac) {
      // Mac: Detect trackpad pinch (ctrlKey set by browser) OR trackpad scroll OR ctrl+mouse scroll
      const isTrackpadPinch = event.ctrlKey; // Browser sets this for pinch gestures
      const isTrackpadScroll = !event.ctrlKey && Math.abs(event.deltaY) < 50 && event.deltaY % 1 !== 0; // Trackpad has fractional values
      const isCtrlScroll = event.ctrlKey && Math.abs(event.deltaY) >= 50; // Ctrl+mouse wheel
      
      shouldZoom = isTrackpadPinch || isTrackpadScroll || isCtrlScroll;
    } else {
      // Windows/Linux: Regular mouse scroll (without ctrl key)
      shouldZoom = !event.ctrlKey;
    }
    
    if (!shouldZoom) {
      return; // Let browser handle normal scroll
    }
    
    event.preventDefault();
    
    // Platform-specific zoom sensitivity
    let zoomFactor;
    if (isMac) {
      const isTrackpadPinch = event.ctrlKey;
      const isTrackpadScroll = !event.ctrlKey && Math.abs(event.deltaY) < 50 && event.deltaY % 1 !== 0;
      
      if (isTrackpadPinch) {
        // Pinch gestures: very small factor since deltaY can be large
        zoomFactor = Math.abs(event.deltaY) * 0.001;
      } else if (isTrackpadScroll) {
        // Trackpad scroll: small factor for smooth zooming
        zoomFactor = Math.abs(event.deltaY) * 0.01;
      } else {
        // Ctrl+mouse wheel: standard factor
        zoomFactor = 0.1;
      }
    } else {
      // Windows/Linux: standard mouse wheel
      zoomFactor = 0.1;
    }
    
    const zoomDirection = event.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.1, Math.min(3, viewportTransform.scale + (zoomDirection * zoomFactor)));
    
    if (newScale !== viewportTransform.scale && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Calculate zoom center point
      const scaleDelta = newScale / viewportTransform.scale;
      const newX = mouseX - (mouseX - viewportTransform.x) * scaleDelta;
      const newY = mouseY - (mouseY - viewportTransform.y) * scaleDelta;
      
      setViewportTransform({
        x: newX,
        y: newY,
        scale: newScale
      });
    }
  }, [viewportTransform, isMac]);

  // Add wheel listener for zooming
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Touch helper functions
  const getTouchDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  // Touch event handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      // Two fingers - start pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = getTouchDistance(touch1, touch2);
      const center = getTouchCenter(touch1, touch2);
      
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const canvasCenter = {
          x: center.x - rect.left,
          y: center.y - rect.top
        };
        
        setTouchState({
          initialDistance: distance,
          initialScale: viewportTransform.scale,
          initialCenter: canvasCenter,
          lastTouchCenter: canvasCenter
        });
      }
      
      event.preventDefault();
    } else if (event.touches.length === 1) {
      // Single finger - start pan
      const touch = event.touches[0];
      const target = event.target as HTMLElement;
      const isCanvasBackground = target === canvasRef.current || target.tagName === 'svg';
      
      if (isCanvasBackground) {
        setIsPanning(true);
        setPanStart({
          x: touch.clientX - viewportTransform.x,
          y: touch.clientY - viewportTransform.y
        });
        event.preventDefault();
      }
    }
  }, [viewportTransform]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2 && touchState) {
      // Two fingers - pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = getTouchDistance(touch1, touch2);
      const center = getTouchCenter(touch1, touch2);
      
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const canvasCenter = {
          x: center.x - rect.left,
          y: center.y - rect.top
        };
        
        // Calculate new scale
        const scaleChange = distance / touchState.initialDistance;
        const newScale = Math.max(0.1, Math.min(3, touchState.initialScale * scaleChange));
        
        // Calculate new position (zoom to center point)
        const scaleDelta = newScale / viewportTransform.scale;
        const newX = touchState.initialCenter.x - (touchState.initialCenter.x - viewportTransform.x) * scaleDelta;
        const newY = touchState.initialCenter.y - (touchState.initialCenter.y - viewportTransform.y) * scaleDelta;
        
        setViewportTransform({
          x: newX,
          y: newY,
          scale: newScale
        });
      }
      
      event.preventDefault();
    } else if (event.touches.length === 1 && isPanning) {
      // Single finger - pan
      const touch = event.touches[0];
      const newX = touch.clientX - panStart.x;
      const newY = touch.clientY - panStart.y;
      
      setViewportTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
      
      event.preventDefault();
    }
  }, [touchState, isPanning, panStart, viewportTransform]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (event.touches.length < 2) {
      setTouchState(null);
    }
    if (event.touches.length === 0) {
      setIsPanning(false);
    }
  }, []);

  // Find the center of the top-left-most node
  const getContentCenter = useCallback(() => {
    if (workflow.nodes.length === 0) {
      // Fallback to canvas center if no nodes
      return { x: width / 2, y: height / 2 };
    }
    
    // Find the top-left-most node (smallest x + y sum)
    const topLeftNode = workflow.nodes.reduce((closest, node) => {
      const nodeScore = node.position.x + node.position.y;
      const closestScore = closest.position.x + closest.position.y;
      return nodeScore < closestScore ? node : closest;
    });
    
    // Return center of that node in world coordinates, then convert to screen coordinates
    const nodeCenterX = topLeftNode.position.x + NODE_WIDTH / 2;
    const nodeCenterY = topLeftNode.position.y + NODE_HEIGHT / 2;
    
    // Convert world coordinates to current screen coordinates
    const screenX = nodeCenterX * viewportTransform.scale + viewportTransform.x;
    const screenY = nodeCenterY * viewportTransform.scale + viewportTransform.y;
    
    return { x: screenX, y: screenY };
  }, [workflow.nodes, width, height, viewportTransform]);

  // Zoom control functions
  const zoomIn = useCallback(() => {
    let newScale = Math.min(3, viewportTransform.scale + 0.2);
    
    // Snap to 100% if close
    if (Math.abs(newScale - 1) < 0.1) {
      newScale = 1;
    }
    
    if (newScale !== viewportTransform.scale) {
      // Zoom to center of top-left-most node
      const contentCenter = getContentCenter();
      const scaleDelta = newScale / viewportTransform.scale;
      const newX = contentCenter.x - (contentCenter.x - viewportTransform.x) * scaleDelta;
      const newY = contentCenter.y - (contentCenter.y - viewportTransform.y) * scaleDelta;
      
      setViewportTransform({
        x: newX,
        y: newY,
        scale: newScale
      });
    }
  }, [viewportTransform, getContentCenter]);

  const zoomOut = useCallback(() => {
    let newScale = Math.max(0.1, viewportTransform.scale - 0.2);
    
    // Snap to 100% if close
    if (Math.abs(newScale - 1) < 0.1) {
      newScale = 1;
    }
    
    if (newScale !== viewportTransform.scale) {
      // Zoom to center of top-left-most node
      const contentCenter = getContentCenter();
      const scaleDelta = newScale / viewportTransform.scale;
      const newX = contentCenter.x - (contentCenter.x - viewportTransform.x) * scaleDelta;
      const newY = contentCenter.y - (contentCenter.y - viewportTransform.y) * scaleDelta;
      
      setViewportTransform({
        x: newX,
        y: newY,
        scale: newScale
      });
    }
  }, [viewportTransform, getContentCenter]);

  const resetZoom = useCallback(() => {
    if (workflow.nodes.length === 0) {
      // No nodes - just reset to origin
      setViewportTransform({ x: 0, y: 0, scale: 1 });
      return;
    }
    
    // Find the top-left-most node (same logic as getContentCenter)
    const topLeftNode = workflow.nodes.reduce((closest, node) => {
      const nodeScore = node.position.x + node.position.y;
      const closestScore = closest.position.x + closest.position.y;
      return nodeScore < closestScore ? node : closest;
    });
    
    // Calculate center of that node
    const nodeCenterX = topLeftNode.position.x + NODE_WIDTH / 2;
    const nodeCenterY = topLeftNode.position.y + NODE_HEIGHT / 2;
    
    // Center that node in the canvas viewport
    const canvasCenterX = width / 2;
    const canvasCenterY = height / 2;
    
    setViewportTransform({
      x: canvasCenterX - nodeCenterX,
      y: canvasCenterY - nodeCenterY,
      scale: 1
    });
  }, [workflow.nodes, width, height]);

  return (
    <div
      ref={canvasRef}
      className={`relative bg-gray-50 border border-gray-300 overflow-hidden ${className} ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ 
        width, 
        height,
        touchAction: 'none', // Disable default touch behaviors
        userSelect: 'none'   // Prevent text selection on touch
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <svg 
        className="absolute inset-0" 
        width={width} 
        height={height}
        style={{ pointerEvents: 'auto' }}
      >
        <g transform={`translate(${viewportTransform.x}, ${viewportTransform.y}) scale(${viewportTransform.scale})`}>
        {/* Define arrow marker for temporary wires - these will be dynamically created */}
        <defs></defs>
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
            const handlePosition = getHandlePosition(
              sourceNode,
              isOutput,
              connectionState.sourceIndex
            );
            
            let sourceX, sourceY, targetX, targetY;
            
            if (isOutput) {
              // Dragging FROM output TO cursor (normal direction)
              sourceX = handlePosition.x;
              sourceY = handlePosition.y;
              targetX = connectionState.currentPosition.x;
              targetY = connectionState.currentPosition.y;
            } else {
              // Dragging FROM input TO cursor (reverse direction for visual logic)
              // Draw from cursor to input handle for proper arrow direction
              sourceX = connectionState.currentPosition.x;
              sourceY = connectionState.currentPosition.y;
              targetX = handlePosition.x;
              targetY = handlePosition.y;
            }
            
            // Calculate direction vector and offset source point to avoid handle overlap
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate angle for arrow rotation with easing for curved wires
            const rawTempAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            // Apply same easing function as permanent wires
            const easingFactor = Math.abs(rawTempAngle) / 180; // 0 to 1 based on angle magnitude
            const easedTempAngle = rawTempAngle * (0.3 + easingFactor * 0.2); // Gentle easing between 30%-50% of original
            const tempAngle = easedTempAngle;
            
            let adjustedSourceX = sourceX;
            let adjustedSourceY = sourceY;
            let adjustedTargetX = targetX;
            let adjustedTargetY = targetY;
            
            if (length > 0) {
              const unitX = dx / length;
              const unitY = dy / length;
              const handleOffset = 10; // Same offset as in Wire component
              
              if (isOutput) {
                // Offset source (handle) forward
                adjustedSourceX = sourceX + unitX * handleOffset;
                adjustedSourceY = sourceY + unitY * handleOffset;
              } else {
                // Offset target (handle) backward  
                adjustedTargetX = targetX - unitX * handleOffset;
                adjustedTargetY = targetY - unitY * handleOffset;
              }
            }
            
            const controlX1 = adjustedSourceX + Math.abs(adjustedTargetX - adjustedSourceX) * 0.3;
            const controlX2 = adjustedTargetX - Math.abs(adjustedTargetX - adjustedSourceX) * 0.3;
            
            const pathData = `M ${adjustedSourceX} ${adjustedSourceY} C ${controlX1} ${adjustedSourceY} ${controlX2} ${adjustedTargetY} ${adjustedTargetX} ${adjustedTargetY}`;
            
            // Color based on source handle type: green for outputs, blue for inputs
            const wireColor = isOutput ? "#10b981" : "#3b82f6"; // green-500 for output, blue-500 for input
            const arrowId = `temp-arrow-${isOutput ? 'green' : 'blue'}-${tempAngle.toFixed(1)}`;
            
            return (
              <g>
                {/* Dynamic arrow marker definition */}
                <defs>
                  <marker
                    id={arrowId}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient={tempAngle}
                    markerUnits="strokeWidth"
                  >
                    <path
                      d="M2,2 L6,4 L2,6"
                      stroke={wireColor}
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </marker>
                </defs>
                
                <path
                  d={pathData}
                  stroke={wireColor}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  style={{ pointerEvents: 'none' }}
                  markerEnd={`url(#${arrowId})`}
                />
              </g>
            );
          })()
        )}
        
        {/* Render nodes as SVG foreignObject to maintain same coordinate system */}
        {workflow.nodes.map(node => (
          <foreignObject
            key={node.id}
            x={node.position.x}
            y={node.position.y}
            width="160"
            height="80"
            style={{ pointerEvents: 'auto', overflow: 'visible' }}
          >
            <Node
              node={node}
              onNodeChange={handleNodeChange}
              onDragEnd={handleNodeDragEnd}
              onDelete={handleNodeDelete}
              onEdit={handleNodeEdit}
              onSelect={handleNodeSelect}
              isSelected={selectedNodeIds.includes(node.id)}
              onStartConnection={handleStartConnection}
              onEndConnection={handleEndConnection}
              isConnecting={connectionState.isConnecting}
              connectionSourceType={connectionState.sourceType}
            />
          </foreignObject>
        ))}
        
        </g>
      </svg>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={zoomIn}
          className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200"
          title="Zoom In"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3a.5.5 0 0 1 .5.5v4h4a.5.5 0 0 1 0 1h-4v4a.5.5 0 0 1-1 0v-4h-4a.5.5 0 0 1 0-1h4v-4A.5.5 0 0 1 8 3z"/>
          </svg>
        </button>
        
        <button
          onClick={zoomOut}
          className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200"
          title="Zoom Out"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
          </svg>
        </button>
        
        <button
          onClick={resetZoom}
          className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors text-xs font-medium"
          title="Reset Zoom (100%)"
          type="button"
        >
          {Math.round(viewportTransform.scale * 100)}%
        </button>
      </div>
    </div>
  );
};