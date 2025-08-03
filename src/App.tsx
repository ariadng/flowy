import { useState } from 'react';
import { Canvas, WorkflowUtils } from './lib';
import type { WorkflowData } from './lib';

function App() {
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Flowy - Workflow Builder Demo
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={addRandomNode}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add Random Node
            </button>
            <button
              onClick={exportWorkflow}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Export Workflow
            </button>
          </div>
          
          <Canvas
            workflow={workflow}
            onWorkflowChange={setWorkflow}
            width={1000}
            height={600}
            className="border-2 border-gray-200 rounded"
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-2">Instructions:</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Drag nodes to move them around</li>
            <li>Connect nodes by dragging from output handles (right side) to input handles (left side)</li>
            <li>Click the × button on nodes to delete them</li>
            <li>Hover over wires and click the delete button to remove connections</li>
            <li>Add new nodes with the "Add Random Node" button</li>
            <li>Export your workflow to JSON</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App
