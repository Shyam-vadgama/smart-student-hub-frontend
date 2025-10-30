import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";

type ComponentType = 'battery' | 'resistor' | 'led' | 'capacitor' | 'inductor' | 'switch';
type ConnectionPoint = { id: string; x: number; y: number; componentId: string };

interface CircuitComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
  properties: {
    [key: string]: number | string;
  };
  connections: string[]; // IDs of connection points
}

interface Wire {
  id: string;
  from: string; // connection point ID
  to: string;   // connection point ID
}

export default function CircuitDesignPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [connectionPoints, setConnectionPoints] = useState<ConnectionPoint[]>([]);
  const [problem, setProblem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [draggingComponent, setDraggingComponent] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [tempWire, setTempWire] = useState<{x: number, y: number} | null>(null);
  const [notes, setNotes] = useState("");
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationResults, setSimulationResults] = useState<{[key: string]: any}>({});
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/circuit/:id");
  const problemId = params?.id;

  // Add a new component to the canvas
  const addComponent = (type: ComponentType, x: number, y: number) => {
    const id = `comp-${Date.now()}`;
    const newComponent: CircuitComponent = {
      id,
      type,
      x,
      y,
      rotation: 0,
      properties: getDefaultProperties(type),
      connections: []
    };
    
    setComponents([...components, newComponent]);
    
    // Add connection points for the component
    const points = getConnectionPoints(id, type, x, y);
    setConnectionPoints([...connectionPoints, ...points]);
  };

  // Get default properties for a component type
  const getDefaultProperties = (type: ComponentType) => {
    switch (type) {
      case 'battery': return { voltage: 9, internalResistance: 0.5 };
      case 'resistor': return { resistance: 1000 };
      case 'led': return { forwardVoltage: 2.0, maxCurrent: 20 };
      case 'capacitor': return { capacitance: 100 };
      case 'inductor': return { inductance: 10 };
      case 'switch': return { state: 'open' };
      default: return {};
    }
  };

  // Get connection points for a component
  const getConnectionPoints = (componentId: string, type: ComponentType, x: number, y: number): ConnectionPoint[] => {
    const points: ConnectionPoint[] = [];
    
    switch (type) {
      case 'battery':
        points.push({ id: `${componentId}-pos`, x: x + 30, y, componentId });
        points.push({ id: `${componentId}-neg`, x: x - 30, y, componentId });
        break;
      case 'resistor':
      case 'capacitor':
      case 'inductor':
        points.push({ id: `${componentId}-left`, x: x - 30, y, componentId });
        points.push({ id: `${componentId}-right`, x: x + 30, y, componentId });
        break;
      case 'led':
        points.push({ id: `${componentId}-anode`, x: x - 20, y, componentId });
        points.push({ id: `${componentId}-cathode`, x: x + 20, y, componentId });
        break;
      case 'switch':
        points.push({ id: `${componentId}-in`, x: x - 25, y, componentId });
        points.push({ id: `${componentId}-out`, x: x + 25, y, componentId });
        break;
    }
    
    return points;
  };

  // Start dragging a component
  const startDragging = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingComponent(id);
    setSelectedComponent(id);
  };

  // Handle mouse move on canvas
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // If dragging a component
    if (draggingComponent) {
      setComponents(components.map(comp => 
        comp.id === draggingComponent ? { ...comp, x, y } : comp
      ));
      
      // Update connection points
      const updatedPoints = connectionPoints.map(point => {
        if (point.componentId === draggingComponent) {
          const comp = components.find(c => c.id === draggingComponent);
          if (comp) {
            const points = getConnectionPoints(comp.id, comp.type, x, y);
            const matchingPoint = points.find(p => p.id === point.id);
            if (matchingPoint) return matchingPoint;
          }
        }
        return point;
      });
      setConnectionPoints(updatedPoints);
    }
    
    // If creating a wire
    if (connectingFrom) {
      setTempWire({ x, y });
    }
  };

  // Handle mouse up on canvas
  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Stop dragging
    setDraggingComponent(null);
    
    // If connecting, check if we're over a connection point
    if (connectingFrom) {
      const targetPoint = connectionPoints.find(point => {
        const dx = point.x - x;
        const dy = point.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 10; // Within 10px radius
      });
      
      if (targetPoint && targetPoint.id !== connectingFrom) {
        // Create a new wire
        const wireId = `wire-${Date.now()}`;
        const newWire: Wire = {
          id: wireId,
          from: connectingFrom,
          to: targetPoint.id
        };
        
        setWires([...wires, newWire]);
        
        // Update component connections
        const fromComponent = components.find(c => c.id === targetPoint.componentId);
        if (fromComponent) {
          setComponents(components.map(c => 
            c.id === fromComponent.id 
              ? { ...c, connections: [...c.connections, wireId] } 
              : c
          ));
        }
      }
      
      setConnectingFrom(null);
      setTempWire(null);
    }
  };

  // Start creating a wire from a connection point
  const startConnection = (pointId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingFrom(pointId);
    const point = connectionPoints.find(p => p.id === pointId);
    if (point) {
      setTempWire({ x: point.x, y: point.y });
    }
  };

  // Clear the canvas
  const clearCanvas = () => {
    setComponents([]);
    setWires([]);
    setConnectionPoints([]);
    setSelectedComponent(null);
    setSimulationResults({});
  };

  // Rotate selected component
  const rotateComponent = () => {
    if (!selectedComponent) return;
    
    setComponents(components.map(comp => 
      comp.id === selectedComponent 
        ? { ...comp, rotation: (comp.rotation + 90) % 360 } 
        : comp
    ));
    
    // Update connection points
    const comp = components.find(c => c.id === selectedComponent);
    if (comp) {
      const updatedPoints = connectionPoints.map(point => {
        if (point.componentId === selectedComponent) {
          const newPoints = getConnectionPoints(comp.id, comp.type, comp.x, comp.y, (comp.rotation + 90) % 360);
          const matchingPoint = newPoints.find(p => p.id === point.id);
          if (matchingPoint) return matchingPoint;
        }
        return point;
      });
      setConnectionPoints(updatedPoints);
    }
  };

  // Delete selected component
  const deleteSelectedComponent = () => {
    if (!selectedComponent) return;
    
    // Remove component
    setComponents(components.filter(comp => comp.id !== selectedComponent));
    
    // Remove related connection points
    setConnectionPoints(connectionPoints.filter(point => point.componentId !== selectedComponent));
    
    // Remove related wires
    const relatedWires = wires.filter(wire => 
      connectionPoints.some(point => 
        point.componentId === selectedComponent && 
        (point.id === wire.from || point.id === wire.to)
      )
    );
    
    setWires(wires.filter(wire => !relatedWires.some(rw => rw.id === wire.id)));
    
    setSelectedComponent(null);
  };

  // Run circuit simulation
  const runSimulation = () => {
    setSimulationRunning(true);
    setSimulationResults({});
    
    // Simulate circuit analysis (in a real app, this would be a complex algorithm)
    setTimeout(() => {
      // Mock simulation results
      const results: {[key: string]: any} = {};
      
      // Calculate voltage drops and currents
      components.forEach(comp => {
        if (comp.type === 'battery') {
          results[comp.id] = {
            type: 'battery',
            voltage: comp.properties.voltage,
            current: 0.015, // 15mA
            power: 0.135 // 135mW
          };
        } else if (comp.type === 'resistor') {
          results[comp.id] = {
            type: 'resistor',
            resistance: comp.properties.resistance,
            voltage: 9,
            current: 0.009, // 9mA
            power: 0.081 // 81mW
          };
        } else if (comp.type === 'led') {
          results[comp.id] = {
            type: 'led',
            forwardVoltage: comp.properties.forwardVoltage,
            current: 0.015, // 15mA
            power: 0.03, // 30mW
            status: 'ON'
          };
        }
      });
      
      setSimulationResults(results);
      setSimulationRunning(false);
    }, 1500);
  };

  // Submit design
  const submitDesign = async () => {
    if (!problemId) return;
    setIsSubmitting(true);
    
    try {
      const design = {
        components,
        wires,
        notes
      };
      
      const res = await fetch(`/api/circuit/problems/${problemId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ design, notes })
      });
      
      if (res.ok) {
        setComponents([]);
        setWires([]);
        setConnectionPoints([]);
        setNotes("");
        setLocation('/circuit');
      } else {
        console.error('Submit design failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load problem data
  useEffect(() => {
    const dept = (user as any)?.department?.toLowerCase();
    const allowed = ['ee','electrical','ec','ece','electronics','electronics & communication'];
    if (dept && !allowed.includes(dept)) {
      setLocation('/');
      return;
    }
    
    if (problemId) {
      fetch(`/api/circuit/problems/${problemId}`, { credentials: 'include' })
        .then(async (r) => {
          if (!r.ok) return null;
          const ct = r.headers.get('content-type') || '';
          if (ct.includes('application/json')) return r.json();
          return null;
        })
        .then(setProblem)
        .catch(() => setProblem(null));
    }
  }, [problemId, user, setLocation]);

  // Render a component on the canvas
  const renderComponent = (comp: CircuitComponent) => {
    const isSelected = selectedComponent === comp.id;
    const hasResults = simulationResults[comp.id];
    
    let componentElement;
    
    switch (comp.type) {
      case 'battery':
        componentElement = (
          <div className={`relative w-16 h-8 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="absolute inset-0 bg-gray-800 rounded flex items-center justify-center">
              <div className="w-1 h-6 bg-white absolute left-2"></div>
              <div className="w-1 h-6 bg-white absolute right-2"></div>
              <div className="w-1 h-4 bg-white"></div>
            </div>
            {hasResults && (
              <div className="absolute -top-6 left-0 text-xs bg-blue-100 px-1 rounded">
                {hasResults.voltage}V, {hasResults.current * 1000}mA
              </div>
            )}
          </div>
        );
        break;
        
      case 'resistor':
        componentElement = (
          <div className={`relative w-16 h-6 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="absolute inset-0 bg-amber-700 rounded flex items-center justify-center">
              <div className="text-white text-xs">{comp.properties.resistance}Ω</div>
            </div>
            {hasResults && (
              <div className="absolute -top-6 left-0 text-xs bg-blue-100 px-1 rounded">
                {hasResults.voltage}V, {hasResults.current * 1000}mA
              </div>
            )}
          </div>
        );
        break;
        
      case 'led':
        componentElement = (
          <div className={`relative w-10 h-10 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className={`absolute inset-0 rounded-full ${hasResults?.status === 'ON' ? 'bg-red-500' : 'bg-gray-400'} flex items-center justify-center`}>
              <div className="w-1 h-4 bg-white absolute -left-1"></div>
              <div className="w-1 h-4 bg-white absolute -right-1"></div>
            </div>
            {hasResults && (
              <div className="absolute -top-6 left-0 text-xs bg-blue-100 px-1 rounded">
                {hasResults.current * 1000}mA
              </div>
            )}
          </div>
        );
        break;
        
      case 'capacitor':
        componentElement = (
          <div className={`relative w-12 h-8 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-6 bg-blue-500"></div>
              <div className="w-1 h-6 bg-blue-500 ml-2"></div>
            </div>
            <div className="text-xs text-center mt-6">{comp.properties.capacitance}μF</div>
          </div>
        );
        break;
        
      case 'inductor':
        componentElement = (
          <div className={`relative w-16 h-8 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-3 h-3 border-2 border-green-600 rounded-full -mx-1"></div>
                ))}
              </div>
            </div>
            <div className="text-xs text-center mt-6">{comp.properties.inductance}mH</div>
          </div>
        );
        break;
        
      case 'switch':
        componentElement = (
          <div className={`relative w-12 h-8 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-1 bg-gray-600"></div>
              <div className={`absolute w-6 h-1 bg-gray-600 origin-left ${comp.properties.state === 'open' ? 'rotate-45' : ''}`}></div>
            </div>
            <div className="text-xs text-center mt-6">{comp.properties.state === 'open' ? 'OPEN' : 'CLOSED'}</div>
          </div>
        );
        break;
    }
    
    return (
      <div
        key={comp.id}
        className="absolute cursor-move"
        style={{ left: comp.x - 30, top: comp.y - 20, transform: `rotate(${comp.rotation}deg)` }}
        onMouseDown={(e) => startDragging(comp.id, e)}
        onClick={() => setSelectedComponent(comp.id)}
      >
        {componentElement}
        
        {/* Connection points */}
        {connectionPoints
          .filter(point => point.componentId === comp.id)
          .map(point => (
            <div
              key={point.id}
              className="absolute w-3 h-3 bg-red-500 rounded-full cursor-crosshair transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: point.x - comp.x + 30, top: point.y - comp.y + 20 }}
              onMouseDown={(e) => startConnection(point.id, e)}
            />
          ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={problem ? `Circuit: ${problem.title}` : "Circuit Builder (EE/EC)"} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Component Palette */}
            <Card>
              <CardHeader>
                <CardTitle>Component Palette</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => addComponent('battery', 100, 100)} 
                  className="w-full justify-start"
                >
                  <div className="w-4 h-4 bg-gray-800 mr-2"></div>
                  Battery
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => addComponent('resistor', 100, 150)} 
                  className="w-full justify-start"
                >
                  <div className="w-4 h-4 bg-amber-700 mr-2"></div>
                  Resistor
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => addComponent('led', 100, 200)} 
                  className="w-full justify-start"
                >
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  LED
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => addComponent('capacitor', 100, 250)} 
                  className="w-full justify-start"
                >
                  <div className="w-4 h-4 bg-blue-500 mr-2"></div>
                  Capacitor
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => addComponent('inductor', 100, 300)} 
                  className="w-full justify-start"
                >
                  <div className="w-4 h-4 bg-green-600 mr-2"></div>
                  Inductor
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => addComponent('switch', 100, 350)} 
                  className="w-full justify-start"
                >
                  <div className="w-4 h-4 bg-gray-600 mr-2"></div>
                  Switch
                </Button>
                <Button variant="destructive" onClick={clearCanvas} className="w-full">
                  Clear Canvas
                </Button>
              </CardContent>
            </Card>
            
            {/* Circuit Canvas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Circuit Canvas</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={canvasRef}
                  className="relative border border-border rounded-md bg-gray-50 h-[500px] overflow-hidden"
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={() => {
                    setDraggingComponent(null);
                    setConnectingFrom(null);
                    setTempWire(null);
                  }}
                >
                  {/* Grid background */}
                  <div className="absolute inset-0 bg-grid bg-repeat" style={{ backgroundSize: '20px 20px' }}></div>
                  
                  {/* Components */}
                  {components.map(renderComponent)}
                  
                  {/* Wires */}
                  {wires.map(wire => {
                    const fromPoint = connectionPoints.find(p => p.id === wire.from);
                    const toPoint = connectionPoints.find(p => p.id === wire.to);
                    
                    if (!fromPoint || !toPoint) return null;
                    
                    return (
                      <svg key={wire.id} className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <line
                          x1={fromPoint.x}
                          y1={fromPoint.y}
                          x2={toPoint.x}
                          y2={toPoint.y}
                          stroke="#4b5563"
                          strokeWidth="2"
                        />
                      </svg>
                    );
                  })}
                  
                  {/* Temporary wire during connection */}
                  {connectingFrom && tempWire && (
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      <line
                        x1={connectionPoints.find(p => p.id === connectingFrom)?.x || 0}
                        y1={connectionPoints.find(p => p.id === connectingFrom)?.y || 0}
                        x2={tempWire.x}
                        y2={tempWire.y}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    </svg>
                  )}
                  
                  {components.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      Drag components from the palette to start designing your circuit.
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button onClick={runSimulation} disabled={components.length === 0 || simulationRunning}>
                    {simulationRunning ? 'Simulating...' : 'Run Simulation'}
                  </Button>
                  <Button 
                    onClick={submitDesign} 
                    disabled={!problemId || components.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Design'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Properties Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedComponent ? (
                  <Tabs defaultValue="properties" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="properties">Properties</TabsTrigger>
                      <TabsTrigger value="actions">Actions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="properties" className="space-y-4">
                      {components
                        .filter(comp => comp.id === selectedComponent)
                        .map(comp => (
                          <div key={comp.id}>
                            <div className="mb-2 font-medium">{comp.type.charAt(0).toUpperCase() + comp.type.slice(1)}</div>
                            
                            {Object.entries(comp.properties).map(([key, value]) => (
                              <div key={key} className="space-y-1">
                                <Label htmlFor={`${comp.id}-${key}`}>
                                  {key.charAt(0).toUpperCase() + key.slice(1)}
                                </Label>
                                <Input
                                  id={`${comp.id}-${key}`}
                                  type="number"
                                  value={value}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value);
                                    setComponents(components.map(c => 
                                      c.id === comp.id 
                                        ? { 
                                            ...c, 
                                            properties: { 
                                              ...c.properties, 
                                              [key]: isNaN(newValue) ? value : newValue 
                                            } 
                                          } 
                                        : c
                                    ));
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                    </TabsContent>
                    
                    <TabsContent value="actions" className="space-y-4">
                      <Button onClick={rotateComponent} className="w-full">
                        Rotate Component
                      </Button>
                      <Button variant="destructive" onClick={deleteSelectedComponent} className="w-full">
                        Delete Component
                      </Button>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    Select a component to view properties
                  </div>
                )}
                
                <div className="mt-6">
                  <Label htmlFor="notes">Design Notes</Label>
                  <textarea
                    id="notes"
                    className="w-full mt-1 p-2 border rounded-md"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about your circuit design..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Simulation Results */}
          {Object.keys(simulationResults).length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Simulation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(simulationResults).map(([compId, results]) => {
                    const comp = components.find(c => c.id === compId);
                    if (!comp) return null;
                    
                    return (
                      <div key={compId} className="border rounded-md p-4">
                        <div className="font-medium">{comp.type.charAt(0).toUpperCase() + comp.type.slice(1)}</div>
                        <div className="mt-2 space-y-1 text-sm">
                          {results.type === 'battery' && (
                            <>
                              <div>Voltage: {results.voltage}V</div>
                              <div>Current: {(results.current * 1000).toFixed(1)}mA</div>
                              <div>Power: {(results.power * 1000).toFixed(1)}mW</div>
                            </>
                          )}
                          {results.type === 'resistor' && (
                            <>
                              <div>Resistance: {results.resistance}Ω</div>
                              <div>Voltage: {results.voltage}V</div>
                              <div>Current: {(results.current * 1000).toFixed(1)}mA</div>
                              <div>Power: {(results.power * 1000).toFixed(1)}mW</div>
                            </>
                          )}
                          {results.type === 'led' && (
                            <>
                              <div>Forward Voltage: {results.forwardVoltage}V</div>
                              <div>Current: {(results.current * 1000).toFixed(1)}mA</div>
                              <div>Power: {(results.power * 1000).toFixed(1)}mW</div>
                              <div className="font-medium">Status: {results.status}</div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}