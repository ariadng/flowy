import React, { useState, useRef, useCallback } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { NodeProps, Position } from './types';

const NodeComponent: React.FC<NodeProps> = ({
  node,
  onNodeChange,
  onDragEnd,
  onDelete,
  onEdit,
  onSelect,
  isSelected = false,
  onStartConnection,
  onEndConnection,
  isConnecting = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const onNodeChangeRef = useRef(onNodeChange);
  const nodeDataRef = useRef(node);
  
  // Update refs when props change
  React.useEffect(() => {
    onNodeChangeRef.current = onNodeChange;
    nodeDataRef.current = node;
  });

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setIsDragging(true);
    setIsHovered(false); // Clear hover state when dragging starts
    setHasMouseMoved(false);
    dragStartRef.current = {
      x: event.clientX - nodeDataRef.current.position.x,
      y: event.clientY - nodeDataRef.current.position.y,
    };
  }, [node.id]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;

    // Mark that the mouse has moved (indicating a drag, not a click)
    setHasMouseMoved(true);

    const newPosition = {
      x: event.clientX - dragStartRef.current.x,
      y: event.clientY - dragStartRef.current.y,
    };

    onNodeChangeRef.current({
      ...nodeDataRef.current,
      position: newPosition,
    }, true); // isDragging = true
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    // Only trigger selection if this was a click (no mouse movement)
    if (!hasMouseMoved && onSelect) {
      onSelect(node.id);
    }
    
    setIsDragging(false);
    setIsHovered(false); // Clear hover state when dragging ends
    setHasMouseMoved(false);
    
    // Call drag end handler to clear alignment guides
    if (onDragEnd) {
      onDragEnd();
    }
  }, [hasMouseMoved, onSelect, node.id, onDragEnd]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDelete = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete(node.id);
  }, [node.id, onDelete]);

  const handleEdit = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (onEdit) {
      onEdit(node.id);
    }
  }, [node.id, onEdit]);

  const handleConnectionStart = useCallback((
    event: React.MouseEvent,
    type: 'input' | 'output',
    index: number
  ) => {
    if (!onStartConnection) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    
    onStartConnection(node.id, type, index, position);
  }, [node.id, onStartConnection]);

  const handleConnectionEnd = useCallback((
    event: React.MouseEvent,
    type: 'input' | 'output',
    index: number
  ) => {
    if (!onEndConnection || !isConnecting) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    onEndConnection(node.id, type, index);
  }, [node.id, onEndConnection, isConnecting]);

  const showActionsBar = isSelected || isHovered;

  return (
    <div
      ref={nodeRef}
      className={`bg-white border-2 rounded-lg shadow-md cursor-move p-2 flex flex-col justify-center ${
        isDragging 
          ? '' // No transitions during dragging
          : 'transition-all duration-200'
      } ${
        isSelected 
          ? 'border-blue-500 shadow-lg' 
          : isHovered 
            ? 'border-gray-400 shadow-lg' 
            : 'border-gray-300'
      }`}
      style={{
        width: '160px',
        height: '80px',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isDragging && setIsHovered(true)}
      onMouseLeave={() => !isDragging && setIsHovered(false)}
    >
      {/* Invisible bridge to maintain hover state between node and actions */}
      <div 
        className={`absolute -top-12 left-1/2 transform -translate-x-1/2 w-20 h-12 z-10 ${
          showActionsBar ? '' : 'pointer-events-none'
        }`}
        style={{ background: 'transparent' }}
        onMouseEnter={() => !isDragging && setIsHovered(true)}
        onMouseLeave={() => !isDragging && setIsHovered(false)}
      />
      
      {/* Actions bar positioned above the node */}
      <div 
        className={`absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-md shadow-lg px-2 py-1 flex gap-1 z-20 transition-opacity duration-200 ${
          showActionsBar ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onMouseEnter={() => !isDragging && setIsHovered(true)}
        onMouseLeave={() => !isDragging && setIsHovered(false)}
      >
        {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit node"
            >
              <Edit size={14} />
            </button>
          )}
        <button
          onClick={handleDelete}
          className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete node"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="text-center">
        <div className="font-semibold text-sm text-gray-800 truncate">
          {node.data.title || node.type}
        </div>
        {node.data.description && (
          <div className="text-xs text-gray-600 truncate mt-1">
            {node.data.description}
          </div>
        )}
      </div>

      {/* Input handles on the left side */}
      {node.data.inputs?.map((input: any, index: number) => {
        const totalInputs = node.data.inputs?.length || 1;
        const topOffset = totalInputs === 1 
          ? '50%' 
          : `${((index + 1) / (totalInputs + 1)) * 100}%`;
        
        return (
          <div
            key={`input-${index}`}
            className={`absolute w-4 h-4 rounded-full border-2 border-white cursor-pointer transition-colors ${
              isConnecting
                ? 'bg-blue-400 hover:bg-blue-500'
                : 'bg-gray-300 hover:bg-blue-400'
            }`}
            style={{
              left: '-8px',
              top: topOffset,
              transform: 'translateY(-50%)',
              pointerEvents: 'auto',
              zIndex: 10,
            }}
            title={input.name || `Input ${index + 1}`}
            onMouseDown={(e) => handleConnectionStart(e, 'input', index)}
            onMouseUp={(e) => handleConnectionEnd(e, 'input', index)}
          />
        );
      })}

      {/* Output handles on the right side */}
      {node.data.outputs?.map((output: any, index: number) => {
        const totalOutputs = node.data.outputs?.length || 1;
        const topOffset = totalOutputs === 1 
          ? '50%' 
          : `${((index + 1) / (totalOutputs + 1)) * 100}%`;
        
        return (
          <div
            key={`output-${index}`}
            className={`absolute w-4 h-4 rounded-full border-2 border-white cursor-pointer transition-colors ${
              isConnecting
                ? 'bg-green-400 hover:bg-green-500'
                : 'bg-gray-300 hover:bg-green-400'
            }`}
            style={{
              right: '-8px',
              top: topOffset,
              transform: 'translateY(-50%)',
              pointerEvents: 'auto',
              zIndex: 10,
            }}
            title={output.name || `Output ${index + 1}`}
            onMouseDown={(e) => handleConnectionStart(e, 'output', index)}
            onMouseUp={(e) => handleConnectionEnd(e, 'output', index)}
          />
        );
      })}
    </div>
  );
};

export const Node = React.memo(NodeComponent, (prevProps, nextProps) => {
  // Only re-render if the node data, selected state, or connecting state changes
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.position.x === nextProps.node.position.x &&
    prevProps.node.position.y === nextProps.node.position.y &&
    prevProps.node.data === nextProps.node.data &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isConnecting === nextProps.isConnecting
  );
});