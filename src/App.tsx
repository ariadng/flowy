import { useState, useEffect, useRef } from 'react';
import { Canvas, WorkflowUtils } from './lib';
import type { WorkflowData } from './lib';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const [workflow, setWorkflow] = useState<WorkflowData>(() => {
    const node1 = WorkflowUtils.createNode(
      'node-1',
      'trigger',
      { x: 100, y: 100 },
      {
        title: 'Start',
        description: 'Workflow trigger',
        outputs: [{ name: 'output', type: 'any' }]
      }
    );

    const node2 = WorkflowUtils.createNode(
      'node-2',
      'action',
      { x: 350, y: 100 },
      {
        title: 'Process',
        description: 'Data processing',
        inputs: [{ name: 'input', type: 'any' }],
        outputs: [{ name: 'output', type: 'any' }]
      }
    );

    const node3 = WorkflowUtils.createNode(
      'node-3',
      'action',
      { x: 600, y: 100 },
      {
        title: 'End',
        description: 'Workflow end',
        inputs: [{ name: 'input', type: 'any' }]
      }
    );

    const wire1 = WorkflowUtils.createWire('wire-1', 'node-1', 'node-2');
    const wire2 = WorkflowUtils.createWire('wire-2', 'node-2', 'node-3');

    return WorkflowUtils.createWorkflow([node1, node2, node3], [wire1, wire2]);
  });

  const addRandomNode = () => {
    const newNode = WorkflowUtils.createNode(
      WorkflowUtils.generateId(),
      'action',
      { 
        x: Math.random() * 500 + 50, 
        y: Math.random() * 300 + 50 
      },
      {
        title: 'New Node',
        description: 'A new workflow node',
        inputs: [{ name: 'input', type: 'any' }],
        outputs: [{ name: 'output', type: 'any' }]
      }
    );
    
    setWorkflow(prev => WorkflowUtils.addNodeToWorkflow(prev, newNode));
  };

  const exportWorkflow = () => {
    const json = WorkflowUtils.serializeWorkflow(workflow);
    console.log('Workflow JSON:', json);
    navigator.clipboard.writeText(json).then(() => {
      alert('Workflow copied to clipboard!');
    });
  };

  // Update canvas size when container resizes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-100" style={{ width: '100svw', height: '100svh' }}>
      {/* Header Bar - Fixed height, no grow/shrink */}
      <header className="flex-grow-0 flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Flowy - Workflow Builder
          </h1>
          
          <div className="flex gap-3">
            <button
              onClick={addRandomNode}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
            >
              Add Node
            </button>
            <button
              onClick={exportWorkflow}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
            >
              Export JSON
            </button>
          </div>
        </div>
      </header>
      
      {/* Canvas Container - Grows to fill remaining space */}
      <main 
        ref={containerRef}
        className="flex-grow flex-shrink overflow-hidden bg-gray-50"
      >
        <Canvas
          workflow={workflow}
          onWorkflowChange={setWorkflow}
          width={canvasSize.width}
          height={canvasSize.height}
          className="w-full h-full"
        />
      </main>
    </div>
  );
}

export default App
