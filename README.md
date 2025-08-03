# Flowy

A React.js library for building interactive drag-and-drop workflows with visual node connections. Features infinite canvas navigation, multi-platform input support, intelligent wire routing, and professional-grade workflow editing capabilities.

## Features

- 🎯 **Drag & Drop Nodes** - Smooth, responsive node dragging with performance optimizations
- 🔗 **Visual Wire Connections** - Connect nodes with beautiful Bezier curve wires and directional arrows
- 📐 **Smart Alignment Guides** - Figma-style snapping and alignment guides for tidy workflows
- 🌐 **Infinite Canvas** - Pan and zoom through unlimited workspace
- 🔍 **Multi-Platform Zoom** - Mouse scroll (Windows/Linux), trackpad pinch (Mac), touch gestures (mobile)
- 📱 **Touch Support** - Native pinch-to-zoom and touch panning on mobile devices
- 🎮 **Zoom Controls** - UI controls with smart 100% snapping and content-aware centering
- ⚡ **Optimized Performance** - Uses CSS transforms and React.memo for smooth interactions
- 🎨 **Modern UI** - Clean, intuitive interface with hover states and action buttons
- ⌨️ **Keyboard Support** - Esc key to clear selections and cancel operations
- 🎛️ **Node Actions** - Edit and delete buttons with seamless hover interactions
- 🔍 **Smart Node Creation** - Drag wires to canvas to auto-open node selection sidebar
- 🎯 **Intelligent Highlighting** - Only highlights compatible connection targets
- 🧠 **Multiple Node Types** - Built-in support for various workflow patterns
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
The main component that renders the workflow editor with infinite pan and zoom capabilities. Handles all interactions, drag operations, and state management.

### Nodes
Represent actions or triggers in your workflow. Each node has:
- **Fixed dimensions**: 160x80 pixels for consistent layouts
- **Input/Output handles**: Connect nodes with wires
- **Action buttons**: Edit and delete functionality
- **Drag & drop**: Smooth movement with alignment guides
- **Smart handles**: Fully visible handle circles that extend beyond node boundaries
- **Multiple types**: Built-in support for various workflow patterns

#### Available Node Types
- **Action** - Perform an operation
- **AI Agent** - AI model processing
- **Conditional** - Branch based on conditions
- **Data** - Store or retrieve data
- **Loop** - Repeat actions iteratively
- **Memory** - Store and recall information
- **Merge** - Combine multiple inputs into one output
- **Split** - Split one input into multiple outputs
- **Tool** - External tool integration
- **Trigger** - Start workflow execution

### Wires
Visual connections between nodes using SVG Bezier curves:
- **Smart routing**: Automatic curve calculation with precise positioning
- **Directional arrows**: Line-based arrows with intelligent rotation and easing
- **Interactive**: Hover effects and delete buttons
- **Color coding**: Different colors for input/output connections and temporary wires
- **Transform-aware**: Properly positioned in infinite canvas coordinate system
- **Handle alignment**: Wires start and end precisely at handle centers

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

### Canvas Navigation
- **Pan**: Click and drag on empty canvas (mouse) or single-finger drag (touch)
- **Zoom**: Platform-specific controls for optimal experience

### Platform-Specific Zoom
- **Windows/Linux**: Mouse scroll wheel
- **Mac**: Trackpad pinch-to-zoom OR Ctrl + mouse scroll
- **Mobile/Tablet**: Two-finger pinch gesture

### Zoom Controls
- **Zoom In/Out buttons**: Located in bottom-right corner
- **100% snap**: Automatically snaps to 100% when zooming near it
- **Smart reset**: Centers on top-left-most node when resetting to 100%
- **Real-time display**: Shows current zoom percentage

### Node Interactions
- **Drag nodes** to reposition them with automatic alignment guides
- **Click handles** to start wire connections
- **Drag to nodes** to connect wires anywhere on compatible nodes
- **Hover nodes** to show action buttons (edit/delete)
- **Selection**: Click to select, Esc to deselect
- **Smart highlighting**: Only compatible connection targets are highlighted

### Wire Interactions
- **Drag from handles** to create connections with real-time preview
- **Drag to canvas** to open node creation sidebar with auto-connection
- **Hover wires** to show delete button with color transitions
- **Color-coded creation**: Green for output connections, blue for input connections
- **Smart deletion**: Click X button on hovered wires
- **Intelligent targeting**: Only opposing handle types are highlighted during connection

### Advanced Workflows
- **Auto-node creation**: Drag wire to empty canvas → select node type → auto-connect
- **Handle-precise positioning**: New nodes position so handles align perfectly with wire endpoints
- **Persistent preview**: Temporary wires stay visible during node selection
- **Multi-platform support**: Touch, mouse, and trackpad interactions

### General Controls
- **Click empty canvas** to clear selections
- **Esc key** - Clear node selection or cancel wire connection

### Alignment System
- Drag nodes near others to see **red alignment guides**
- Nodes automatically **snap to alignment** (center, edges)
- **8px snap threshold** for precise positioning
- **Figma-style guides** appear and disappear dynamically

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
- **SVG** for wire rendering and arrows
- **CSS Transforms** for performance optimization

## License

MIT