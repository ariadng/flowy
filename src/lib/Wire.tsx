import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { WireData, NodeData, Position } from './types';
import { getHandlePosition } from './utils';

interface WireProps {
  wire: WireData;
  nodes: NodeData[];
  onDelete?: (wireId: string) => void;
}


// Use the shared utility function for exact positioning
const calculateConnectionPoint = (
  node: NodeData,
  isOutput: boolean,
  handleIndex: number
): Position => {
  const position = getHandlePosition(node, isOutput, handleIndex);
  return position;
};

export const Wire: React.FC<WireProps> = ({ wire, nodes, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const sourceNode = nodes.find(n => n.id === wire.sourceNodeId);
  const targetNode = nodes.find(n => n.id === wire.targetNodeId);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Get handle indexes from wire data (default to 0 if not specified)
  const sourceIndex = parseInt(wire.sourceOutput || '0');
  const targetIndex = parseInt(wire.targetInput || '0');

  const sourcePos = calculateConnectionPoint(sourceNode, true, sourceIndex);
  const targetPos = calculateConnectionPoint(targetNode, false, targetIndex);

  // Calculate direction vector from source to target
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate angle in degrees for arrow rotation with easing for curved wires
  const rawAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  // Apply easing function to make rotation more natural for curved paths
  const easingFactor = Math.abs(rawAngle) / 180; // 0 to 1 based on angle magnitude
  const easedAngle = rawAngle * (0.3 + easingFactor * 0.2); // Gentle easing between 30%-50% of original
  const angle = easedAngle;
  
  // Normalize direction vector
  const unitX = dx / length;
  const unitY = dy / length;
  
  // Offset the end points to stop before the handles (8px radius + 2px margin = 10px)
  const handleOffset = 10;
  const adjustedSourcePos = {
    x: sourcePos.x + unitX * handleOffset,
    y: sourcePos.y + unitY * handleOffset
  };
  const adjustedTargetPos = {
    x: targetPos.x - unitX * handleOffset,
    y: targetPos.y - unitY * handleOffset
  };

  const midX = (adjustedSourcePos.x + adjustedTargetPos.x) / 2;
  const midY = (adjustedSourcePos.y + adjustedTargetPos.y) / 2;
  const controlX1 = adjustedSourcePos.x + Math.abs(adjustedTargetPos.x - adjustedSourcePos.x) * 0.3;
  const controlX2 = adjustedTargetPos.x - Math.abs(adjustedTargetPos.x - adjustedSourcePos.x) * 0.3;

  const pathData = `M ${adjustedSourcePos.x} ${adjustedSourcePos.y} C ${controlX1} ${adjustedSourcePos.y} ${controlX2} ${adjustedTargetPos.y} ${adjustedTargetPos.x} ${adjustedTargetPos.y}`;

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(wire.id);
    }
  };

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Define arrow marker */}
      <defs>
        <marker
          id={`arrowhead-${wire.id}`}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient={angle}
          markerUnits="strokeWidth"
        >
          <path
            d="M2,2 L6,4 L2,6"
            stroke={isHovered ? "#ef4444" : "#6b7280"}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-200"
          />
        </marker>
      </defs>
      {/* Invisible wider path for easier hovering */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
      />
      
      {/* Visible wire path */}
      <path
        d={pathData}
        stroke={isHovered ? "#ef4444" : "#6b7280"}
        strokeWidth="2"
        fill="none"
        style={{ pointerEvents: 'none' }}
        className="transition-colors duration-200"
        markerEnd={`url(#arrowhead-${wire.id})`}
      />
      
      {/* Action button when hovered */}
      {isHovered && onDelete && (
        <g>
          {/* Button background */}
          <circle
            cx={midX}
            cy={midY}
            r="12"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
            className="drop-shadow-sm"
          />
          
          {/* Delete icon */}
          <foreignObject
            x={midX - 8}
            y={midY - 8}
            width="16"
            height="16"
            className="cursor-pointer"
            onClick={handleDelete}
          >
            <X
              size={16}
              className="text-red-500 hover:text-red-700 transition-colors"
            />
          </foreignObject>
        </g>
      )}
    </g>
  );
};