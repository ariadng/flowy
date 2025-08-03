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

  const midX = (sourcePos.x + targetPos.x) / 2;
  const midY = (sourcePos.y + targetPos.y) / 2;
  const controlX1 = sourcePos.x + Math.abs(targetPos.x - sourcePos.x) * 0.3;
  const controlX2 = targetPos.x - Math.abs(targetPos.x - sourcePos.x) * 0.3;

  const pathData = `M ${sourcePos.x} ${sourcePos.y} C ${controlX1} ${sourcePos.y} ${controlX2} ${targetPos.y} ${targetPos.x} ${targetPos.y}`;

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