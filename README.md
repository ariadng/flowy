# Flowy

A React.js library for building interactive drag-and-drop workflows with visual node connections.

## Features

- 🎯 **Drag & Drop Nodes** - Smooth, responsive node dragging with performance optimizations
- 🔗 **Visual Wire Connections** - Connect nodes with beautiful Bezier curve wires
- 📐 **Smart Alignment Guides** - Figma-style snapping and alignment guides for tidy workflows
- ⚡ **Optimized Performance** - Uses CSS transforms and React.memo for smooth interactions
- 🎨 **Modern UI** - Clean, intuitive interface with hover states and action buttons
- ⌨️ **Keyboard Support** - Esc key to clear selections and cancel operations
- 🎛️ **Node Actions** - Edit and delete buttons with seamless hover interactions
- 📱 **TypeScript** - Full TypeScript support with comprehensive type definitions

## Quick Start

```bash
npm install @flowy/react
```

```tsx
import React, { useState } from 'react';
import { Canvas, WorkflowUtils } from '@flowy/react';
import type { WorkflowData } from '@flowy/react';

function App() {
  const [workflow, setWorkflow] = useState<WorkflowData>(() => {
    const node1 = WorkflowUtils.createNode('node-1', 'trigger', { x: 100, y: 100 }, {
      title: 'Start',
      inputs: [],
      outputs: [{ name: 'output', type: 'any' }]
    });

    const node2 = WorkflowUtils.createNode('node-2', 'action', { x: 350, y: 100 }, {
      title: 'Process',
      inputs: [{ name: 'input', type: 'any' }],
      outputs: [{ name: 'output', type: 'any' }]
    });

    return WorkflowUtils.createWorkflow([node1, node2], []);
  });

  return (
    <Canvas
      workflow={workflow}
      onWorkflowChange={setWorkflow}
      width={800}
      height={600}
    />
  );
}
```

## Core Concepts

### Canvas
The main component that renders the workflow editor. Handles all interactions, drag operations, and state management.

### Nodes
Represent actions or triggers in your workflow. Each node has:
- **Fixed dimensions**: 160x80 pixels for consistent layouts
- **Input/Output handles**: Connect nodes with wires
- **Action buttons**: Edit and delete functionality
- **Drag & drop**: Smooth movement with alignment guides

### Wires
Visual connections between nodes using SVG Bezier curves:
- **Smart routing**: Automatic curve calculation
- **Interactive**: Hover effects and delete buttons
- **Color coding**: Different colors for input/output connections

## API Reference

### Canvas Props
```tsx
interface CanvasProps {
  workflow: WorkflowData;
  onWorkflowChange: (workflow: WorkflowData) => void;
  width?: number;
  height?: number;
  className?: string;
}
```

### WorkflowUtils
Utility functions for managing workflow data:
- `createNode(id, type, position, data)` - Create a new node
- `createWire(id, sourceNodeId, targetNodeId)` - Create a wire connection
- `createWorkflow(nodes, wires)` - Create a workflow
- `serializeWorkflow(workflow)` - Export to JSON
- `deserializeWorkflow(json)` - Import from JSON

## Interactions

### Mouse
- **Drag nodes** to reposition them
- **Click handles** to start wire connections
- **Hover wires** to show delete button
- **Click empty canvas** to clear selections

### Keyboard
- **Esc** - Clear node selection or cancel wire connection

### Alignment
- Drag nodes near others to see **red alignment guides**
- Nodes automatically **snap to alignment** (center, edges)
- **8px snap threshold** for precise positioning

## Styling

Flowy uses TailwindCSS for styling. Make sure to include Tailwind in your project:

```bash
npm install tailwindcss
```

The library is designed to work seamlessly with your existing Tailwind setup.

## Development

Built with:
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **Vite** for build tooling
- **Lucide React** for icons

## License

MIT