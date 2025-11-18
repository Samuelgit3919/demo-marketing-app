import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Line, Rect, PencilBrush } from "fabric";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Eraser, Pencil, Undo } from "lucide-react";

interface DrawingCanvasProps {
  onDrawingComplete: (dataUrl: string) => void;
  spaceId: string;
}

export const DrawingCanvas = ({ onDrawingComplete, spaceId }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [wallCount, setWallCount] = useState(0);
  const [tool, setTool] = useState<"draw" | "erase">("draw");
  const [brushColor, setBrushColor] = useState("#1a1a1a");
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState<string[]>([]);
  const gridLinesRef = useRef<any[]>([]);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 500,
      backgroundColor: "#ffffff",
      selection: false,
    });

    // Add grid background
    const gridSize = 20;
    const gridLines: any[] = [];
    for (let i = 0; i < canvas.width! / gridSize; i++) {
      const line = new Line([i * gridSize, 0, i * gridSize, canvas.height!], {
        stroke: "#e5e7eb",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
      gridLines.push(line);
    }
    for (let i = 0; i < canvas.height! / gridSize; i++) {
      const line = new Line([0, i * gridSize, canvas.width!, i * gridSize], {
        stroke: "#e5e7eb",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
      gridLines.push(line);
    }
    
    gridLinesRef.current = gridLines;

    // Enable drawing mode and configure brush
    canvas.isDrawingMode = true;
    const pencilBrush = new PencilBrush(canvas);
    pencilBrush.color = brushColor;
    pencilBrush.width = brushSize;
    canvas.freeDrawingBrush = pencilBrush;
    
    // Enable touch scrolling prevention
    canvasRef.current.style.touchAction = 'none';

    setFabricCanvas(canvas);
    setHistory([]);
    setWallCount(0);

    return () => {
      canvas.dispose();
    };
  }, [spaceId]);

  useEffect(() => {
    if (!fabricCanvas || isRestoringRef.current) return;

    const handlePathCreated = (e: any) => {
      // Remove grid lines before saving to history
      const allObjects = fabricCanvas.getObjects();
      const drawingObjects = allObjects.filter(obj => !gridLinesRef.current.includes(obj));
      
      if (tool === "erase") {
        // For eraser, remove the path that was just drawn
        fabricCanvas.remove(e.path);
        
        // Check if any drawing objects intersect with the eraser path
        const eraserPath = e.path;
        const eraserBounds = eraserPath.getBoundingRect();
        
        drawingObjects.forEach((obj: any) => {
          if (obj === eraserPath) return;
          const objBounds = obj.getBoundingRect();
          
          // Simple bounding box intersection check
          if (
            eraserBounds.left < objBounds.left + objBounds.width &&
            eraserBounds.left + eraserBounds.width > objBounds.left &&
            eraserBounds.top < objBounds.top + objBounds.height &&
            eraserBounds.top + eraserBounds.height > objBounds.top
          ) {
            fabricCanvas.remove(obj);
          }
        });
        
        fabricCanvas.renderAll();
      }
      
      const updatedObjects = fabricCanvas.getObjects().filter(obj => !gridLinesRef.current.includes(obj));
      setWallCount(updatedObjects.length);
      
      // Save current state to history (without grid lines)
      const canvasState = fabricCanvas.toJSON();
      // Remove grid lines from the saved state
      canvasState.objects = canvasState.objects.filter((obj: any) => 
        !gridLinesRef.current.some(gridLine => gridLine.toJSON().type === obj.type && 
          gridLine.toJSON().stroke === obj.stroke)
      );
      
      setHistory(prev => [...prev, JSON.stringify(canvasState)]);
      
      const dataUrl = fabricCanvas.toDataURL();
      onDrawingComplete(dataUrl);
    };

    fabricCanvas.on("path:created", handlePathCreated);

    return () => {
      fabricCanvas.off("path:created", handlePathCreated);
    };
  }, [fabricCanvas, onDrawingComplete, tool]);

  // Update brush when tool, color, or size changes
  useEffect(() => {
    if (!fabricCanvas) return;

    const pencilBrush = new PencilBrush(fabricCanvas);
    
    if (tool === "draw") {
      pencilBrush.color = brushColor;
      pencilBrush.width = brushSize;
    } else if (tool === "erase") {
      // For eraser, we use a transparent color - the actual erasing happens in path:created
      pencilBrush.color = 'rgba(0,0,0,1)';
      pencilBrush.width = brushSize;
    }
    
    fabricCanvas.freeDrawingBrush = pencilBrush;
  }, [fabricCanvas, tool, brushColor, brushSize]);

  const addQuickRoom = () => {
    if (!fabricCanvas) return;

    // Add a simple room rectangle with opening
    const roomWidth = 300;
    const roomHeight = 200;
    const x = (fabricCanvas.width! - roomWidth) / 2;
    const y = (fabricCanvas.height! - roomHeight) / 2;

    // Main room outline
    const walls = [
      new Line([x, y, x + roomWidth, y], { stroke: "#1a1a1a", strokeWidth: 3 }), // Top
      new Line([x + roomWidth, y, x + roomWidth, y + roomHeight], { stroke: "#1a1a1a", strokeWidth: 3 }), // Right
      new Line([x + roomWidth, y + roomHeight, x, y + roomHeight], { stroke: "#1a1a1a", strokeWidth: 3 }), // Bottom
      new Line([x, y + roomHeight, x, y + 80], { stroke: "#1a1a1a", strokeWidth: 3 }), // Left bottom
      new Line([x, y + 120, x, y], { stroke: "#1a1a1a", strokeWidth: 3 }), // Left top
    ];

    walls.forEach((wall) => fabricCanvas.add(wall));
    
    const allObjects = fabricCanvas.getObjects().filter(obj => !gridLinesRef.current.includes(obj));
    setWallCount(allObjects.length);
    fabricCanvas.renderAll();

    // Save to history
    const canvasState = fabricCanvas.toJSON();
    canvasState.objects = canvasState.objects.filter((obj: any) => 
      !gridLinesRef.current.some(gridLine => gridLine.toJSON().type === obj.type)
    );
    setHistory(prev => [...prev, JSON.stringify(canvasState)]);

    const dataUrl = fabricCanvas.toDataURL();
    onDrawingComplete(dataUrl);
    toast.success("Quick room added!");
  };

  const handleUndo = () => {
    if (!fabricCanvas || history.length === 0) return;
    
    isRestoringRef.current = true;
    
    const newHistory = [...history];
    newHistory.pop(); // Remove the current state
    
    fabricCanvas.clear();
    
    // Re-add grid first
    gridLinesRef.current.forEach((line) => fabricCanvas.add(line));
    
    if (newHistory.length > 0) {
      const lastState = newHistory[newHistory.length - 1];
      fabricCanvas.loadFromJSON(lastState, () => {
        fabricCanvas.renderAll();
        
        const drawingObjects = fabricCanvas.getObjects().filter(obj => !gridLinesRef.current.includes(obj));
        setWallCount(drawingObjects.length);
        
        const dataUrl = fabricCanvas.toDataURL();
        onDrawingComplete(dataUrl);
        
        setHistory(newHistory);
        isRestoringRef.current = false;
      });
    } else {
      fabricCanvas.backgroundColor = "#ffffff";
      fabricCanvas.renderAll();
      setWallCount(0);
      onDrawingComplete("");
      setHistory([]);
      isRestoringRef.current = false;
    }
    
    toast.success("Undo successful!");
  };

  const handleReset = () => {
    if (!fabricCanvas) return;

    fabricCanvas.clear();
    
    // Re-add grid
    gridLinesRef.current.forEach((line) => fabricCanvas.add(line));
    
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    setWallCount(0);
    setHistory([]);
    onDrawingComplete("");
    toast.success("Canvas cleared!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">Draw your space layout</h3>
          <p className="text-sm text-muted-foreground">Use your finger or mouse to draw walls and layout</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleUndo} variant="outline" size="sm" disabled={history.length === 0}>
            <Undo className="w-4 h-4 mr-2" />
            Undo
          </Button>
          <Button onClick={addQuickRoom} variant="outline" size="sm">
            Quick Room
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            Clear
          </Button>
        </div>
      </div>

      {/* Drawing Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
        <div className="space-y-2">
          <Label>Tool</Label>
          <div className="flex gap-2">
            <Button
              variant={tool === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("draw")}
              className="flex-1"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Draw
            </Button>
            <Button
              variant={tool === "erase" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("erase")}
              className="flex-1"
            >
              <Eraser className="w-4 h-4 mr-2" />
              Erase
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex gap-2">
            {["#1a1a1a", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b"].map((color) => (
              <button
                key={color}
                onClick={() => {
                  setBrushColor(color);
                  setTool("draw");
                }}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  brushColor === color && tool === "draw"
                    ? "border-primary scale-110"
                    : "border-border hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Brush Size: {brushSize}px</Label>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="border-2 border-border rounded-lg shadow-lg overflow-hidden bg-white" style={{ touchAction: 'none' }}>
        <canvas ref={canvasRef} className="w-full h-auto touch-none" />
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Walls drawn: {wallCount}
        </p>
        <p className="text-muted-foreground">
          {tool === "draw" ? "Drawing mode" : "Eraser mode"} - {isDrawing ? "Active" : "Click and drag"}
        </p>
      </div>
    </div>
  );
};