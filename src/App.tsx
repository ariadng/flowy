import { useState, useEffect, useRef } from 'react';
import { Canvas, WorkflowUtils } from './lib';
import type { WorkflowData } from './lib';
import { getHandlePosition } from './lib/utils';
import { X, Plus, Search } from 'lucide-react';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingConnection, setPendingConnection] = useState<{
    sourceNodeId: string;
    sourceType: 'input' | 'output';
    sourceIndex: number;
    position: { x: number; y: number };
  } | null>(null);
  const [shouldCancelConnection, setShouldCancelConnection] = useState(false);
  
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    // Clear search when opening sidebar
    if (!isSidebarOpen) {
      setSearchQuery('');
    } else {
      // Clear pending connection and cancel wire when closing sidebar
      if (pendingConnection) {
        setShouldCancelConnection(true);
        setPendingConnection(null);
        // Reset cancel flag after a brief delay
        setTimeout(() => setShouldCancelConnection(false), 100);
      }
    }
  };

  const handleNodeCreationRequest = (connectionInfo: {
    sourceNodeId: string;
    sourceType: 'input' | 'output';
    sourceIndex: number;
    position: { x: number; y: number };
  }) => {
    setPendingConnection(connectionInfo);
    setIsSidebarOpen(true);
    setSearchQuery('');
  };

  const addNode = (nodeType: string) => {
    const nodeConfigs = {
      trigger: {
        title: 'Trigger',
        description: 'Start workflow execution',
        inputs: [],
        outputs: [{ name: 'output', type: 'any' }]
      },
      action: {
        title: 'Action',
        description: 'Perform an operation',
        inputs: [{ name: 'input', type: 'any' }],
        outputs: [{ name: 'output', type: 'any' }]
      },
      conditional: {
        title: 'Conditional',
        description: 'Branch based on conditions',
        inputs: [{ name: 'input', type: 'any' }],
        outputs: [
          { name: 'true', type: 'any' },
          { name: 'false', type: 'any' }
        ]
      },
      loop: {
        title: 'Loop',
        description: 'Repeat actions iteratively',
        inputs: [{ name: 'input', type: 'any' }],
        outputs: [
          { name: 'item', type: 'any' },
          { name: 'done', type: 'any' }
        ]
      },
      data: {
        title: 'Data',
        description: 'Store or retrieve data',
        inputs: [{ name: 'input', type: 'any' }],
        outputs: [{ name: 'output', type: 'any' }]
      },
      tool: {
        title: 'Tool',
        description: 'External tool integration',
        inputs: [{ name: 'input', type: 'any' }],
        outputs: [{ name: 'output', type: 'any' }]
      },
      memory: {
        title: 'Memory',
        description: 'Store and recall information',
        inputs: [
          { name: 'store', type: 'any' },
          { name: 'retrieve', type: 'any' }
        ],
        outputs: [{ name: 'output', type: 'any' }]
      },
      ai_agent: {
        title: 'AI Agent',
        description: 'AI model processing',
        inputs: [{ name: 'prompt', type: 'any' }],
        outputs: [{ name: 'response', type: 'any' }]
      },
      merge: {
        title: 'Merge',
        description: 'Combine multiple inputs into one output',
        inputs: [
          { name: 'input1', type: 'any' },
          { name: 'input2', type: 'any' },
          { name: 'input3', type: 'any' }
        ],
        outputs: [{ name: 'merged', type: 'any' }]
      },
      split: {
        title: 'Split',
        description: 'Split one input into multiple outputs',
        inputs: [{ name: 'input', type: 'any' }],
        outputs: [
          { name: 'output1', type: 'any' },
          { name: 'output2', type: 'any' },
          { name: 'output3', type: 'any' }
        ]
      },
      custom: {
        title: 'Custom',
        description: 'Custom node implementation',
        inputs: [{ name: 'input', type: 'any' }],
        outputs: [{ name: 'output', type: 'any' }]
      }
    };

    const config = nodeConfigs[nodeType as keyof typeof nodeConfigs] || nodeConfigs.action;
    
    let position: { x: number; y: number };
    
    if (pendingConnection) {
      // Calculate node position so the target handle aligns with the release position
      const isSourceOutput = pendingConnection.sourceType === 'output';
      const targetHandleType = isSourceOutput ? 'input' : 'output';
      const targetHandleIndex = 0; // Always use first handle
      
      // Create a temporary node to calculate handle position
      const tempNode = WorkflowUtils.createNode(
        'temp',
        nodeType,
        { x: 0, y: 0 }, // Start at origin
        config
      );
      
      // Calculate where the target handle would be if the node was at origin
      const handleOffset = getHandlePosition(tempNode, !isSourceOutput, targetHandleIndex);
      
      // Calculate the actual node position by offsetting from the release position
      position = {
        x: pendingConnection.position.x - handleOffset.x,
        y: pendingConnection.position.y - handleOffset.y
      };
    } else {
      // Random position for manual node creation
      position = { x: Math.random() * 500 + 50, y: Math.random() * 300 + 50 };
    }
    
    const newNode = WorkflowUtils.createNode(
      WorkflowUtils.generateId(),
      nodeType,
      position,
      config
    );
    
    setWorkflow(prev => {
      const updatedWorkflow = WorkflowUtils.addNodeToWorkflow(prev, newNode);
      
      // If there's a pending connection, create the wire
      if (pendingConnection) {
        const wireId = `wire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const isSourceOutput = pendingConnection.sourceType === 'output';
        
        // Determine which handle to connect to on the new node
        let targetHandleIndex = 0;
        const targetHandleType = isSourceOutput ? 'input' : 'output';
        
        // Check if the new node has the required handle type
        const targetHandles = isSourceOutput ? newNode.data.inputs : newNode.data.outputs;
        if (!targetHandles || targetHandles.length === 0) {
          // Can't connect - new node doesn't have compatible handles
          return updatedWorkflow;
        }
        
        const newWire = {
          id: wireId,
          sourceNodeId: isSourceOutput ? pendingConnection.sourceNodeId : newNode.id,
          targetNodeId: isSourceOutput ? newNode.id : pendingConnection.sourceNodeId,
          sourceOutput: isSourceOutput ? pendingConnection.sourceIndex.toString() : targetHandleIndex.toString(),
          targetInput: isSourceOutput ? targetHandleIndex.toString() : pendingConnection.sourceIndex.toString(),
        };
        
        return {
          ...updatedWorkflow,
          wires: [...updatedWorkflow.wires, newWire]
        };
      }
      
      return updatedWorkflow;
    });
    
    // Clear pending connection and cancel temporary wire
    if (pendingConnection) {
      setShouldCancelConnection(true);
      setPendingConnection(null);
      // Reset cancel flag after a brief delay
      setTimeout(() => setShouldCancelConnection(false), 100);
    }
  };

  // Define available node types for the sidebar
  const availableNodeTypes = [
    { type: 'trigger', title: 'Trigger', description: 'Start workflow execution' },
    { type: 'action', title: 'Action', description: 'Perform an operation' },
    { type: 'conditional', title: 'Conditional', description: 'Branch based on conditions' },
    { type: 'loop', title: 'Loop', description: 'Repeat actions iteratively' },
    { type: 'data', title: 'Data', description: 'Store or retrieve data' },
    { type: 'tool', title: 'Tool', description: 'External tool integration' },
    { type: 'memory', title: 'Memory', description: 'Store and recall information' },
    { type: 'ai_agent', title: 'AI Agent', description: 'AI model processing' },
    { type: 'merge', title: 'Merge', description: 'Combine multiple inputs into one output' },
    { type: 'split', title: 'Split', description: 'Split one input into multiple outputs' }
  ];

  // Filter node types based on search query and sort alphabetically
  const filteredNodeTypes = availableNodeTypes
    .filter(nodeType =>
      nodeType.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nodeType.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title));

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

  // Handle Esc key for pending connections
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && pendingConnection) {
        setShouldCancelConnection(true);
        setPendingConnection(null);
        setIsSidebarOpen(false);
        // Reset cancel flag after a brief delay
        setTimeout(() => setShouldCancelConnection(false), 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pendingConnection]);

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
              onClick={toggleSidebar}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
            >
              <Plus size={16} />
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
        className="flex-grow flex-shrink overflow-hidden bg-gray-50 relative"
      >
        <Canvas
          workflow={workflow}
          onWorkflowChange={setWorkflow}
          width={canvasSize.width}
          height={canvasSize.height}
          className="w-full h-full"
          onRequestNodeCreation={handleNodeCreationRequest}
          cancelConnection={shouldCancelConnection}
          isSidebarOpen={isSidebarOpen}
        />
        
        {/* Floating Sidebar */}
        {isSidebarOpen && (
          <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl border-l border-gray-200 flex flex-col z-50">
            {/* Sidebar Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add Node</h2>
                <button
                  onClick={toggleSidebar}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close sidebar"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search node types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Scrollable List Container */}
            <div className="flex-grow flex-shrink overflow-y-auto p-4">
              <div className="space-y-3">
                {filteredNodeTypes.length > 0 ? (
                  <>
                    <div className="text-sm text-gray-500 mb-4">
                      {pendingConnection 
                        ? `Creating node to connect to ${pendingConnection.sourceType} handle:` 
                        : searchQuery 
                          ? `Found ${filteredNodeTypes.length} result(s)` 
                          : 'Select a node type to add:'
                      }
                    </div>
                    
                    {/* Filtered Node type options */}
                    {filteredNodeTypes.map((nodeType) => (
                      <button
                        key={nodeType.type}
                        onClick={() => {
                          addNode(nodeType.type);
                          setIsSidebarOpen(false);
                        }}
                        className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{nodeType.title}</div>
                        <div className="text-sm text-gray-600">{nodeType.description}</div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Search size={32} className="mx-auto" />
                    </div>
                    <div className="text-sm text-gray-500">
                      No nodes found matching "{searchQuery}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App
