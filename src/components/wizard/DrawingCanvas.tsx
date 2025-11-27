import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Line, Rect, PencilBrush, Text as FabricText, Shadow, Circle, Path, Group } from "fabric";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eraser, Pencil, Undo } from "lucide-react";

interface DrawingCanvasProps {
  onDrawingComplete: (
    dataUrl: string,
    wallMeasurements: WallMeasurement[],
    totalPerimeter: number,
    totalArea: number
  ) => void;
  spaceId: string;
  unit: "cm" | "in";
}

interface WallMeasurement {
  label: string;
  length: string;
}

export const DrawingCanvas = ({ onDrawingComplete, spaceId, unit }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [wallCount, setWallCount] = useState(0);
  const [tool, setTool] = useState<"draw" | "erase">("draw");
  const [brushColor, setBrushColor] = useState("#1a1a1a");
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState<string[]>([]);
  const [wallMeasurements, setWallMeasurements] = useState<WallMeasurement[]>([]);
  const [shapeTemplates] = useState([
    { id: "arc", label: "Arc", icon: "⌒" },
    { id: "circle", label: "Circle", icon: "○" },
    { id: "halfcircle", label: "Half Circle", icon: "⌓" },
    { id: "rectangle", label: "Rectangle", icon: "▭" },
  ]);
  const gridLinesRef = useRef<any[]>([]);
  const isRestoringRef = useRef(false);
  const wallLabelsRef = useRef<any[]>([]);
  const previousUnitRef = useRef<"cm" | "in">(unit);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Responsive canvas size
    const isMobile = window.innerWidth < 768;
    const canvasWidth = isMobile ? Math.min(window.innerWidth - 60, 600) : 800;
    const canvasHeight = isMobile ? 400 : 500;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#ffffff",
      selection: true, // Enable selection to move shapes
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

    // Enable drawing mode and configure brush with line straightening
    canvas.isDrawingMode = true;
    const pencilBrush = new PencilBrush(canvas);
    pencilBrush.color = brushColor;
    pencilBrush.width = brushSize;
    pencilBrush.shadow = new Shadow({
      color: 'rgba(0, 0, 0, 0.3)',
      blur: 8,
      offsetX: 2,
      offsetY: 2,
    });
    // Enable line straightening
    pencilBrush.decimate = 10; // Reduce points for straighter lines
    canvas.freeDrawingBrush = pencilBrush;

    // Enable touch scrolling prevention
    canvasRef.current.style.touchAction = 'none';

    setFabricCanvas(canvas);
    setHistory([]);
    setWallCount(0);
    setWallMeasurements([]);
    wallLabelsRef.current = [];

    // Handle window resize
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const newWidth = isMobile ? Math.min(window.innerWidth - 60, 600) : 800;
      const newHeight = isMobile ? 400 : 500;

      canvas.setDimensions({
        width: newWidth,
        height: newHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, [spaceId]);

  // Handle unit conversion when unit changes
  useEffect(() => {
    if (previousUnitRef.current === unit) return;

    const conversionFactor = unit === "cm" ? 2.54 : 1 / 2.54;

    setWallMeasurements(prev => prev.map(wall => {
      const currentValue = parseFloat(wall.length) || 0;
      const convertedValue = currentValue * conversionFactor;
      return {
        ...wall,
        length: convertedValue > 0 ? convertedValue.toFixed(2) : ''
      };
    }));

    previousUnitRef.current = unit;
  }, [unit]);

  useEffect(() => {
    if (!fabricCanvas || isRestoringRef.current) return;

    const handlePathCreated = (e: any) => {
      // Remove grid lines before saving to history
      const allObjects = fabricCanvas.getObjects();
      const drawingObjects = allObjects.filter(obj =>
        !gridLinesRef.current.includes(obj) &&
        !(obj instanceof FabricText)
      );

      // Auto-straighten lines for draw tool
      if (e.path && tool === "draw") {
        const path = e.path;
        const pathData = path.path;

        // Check if this is a relatively straight line
        if (pathData && pathData.length >= 2) {
          const firstPoint = pathData[0];
          const lastPoint = pathData[pathData.length - 1];

          // Get start and end coordinates
          const startX = firstPoint[1];
          const startY = firstPoint[2];
          const endX = lastPoint[lastPoint.length - 2];
          const endY = lastPoint[lastPoint.length - 1];

          // Calculate if the line is mostly horizontal or vertical
          const dx = Math.abs(endX - startX);
          const dy = Math.abs(endY - startY);
          const totalLength = Math.sqrt(dx * dx + dy * dy);

          // If the line is reasonably straight (deviation < 20% of length), replace with a Line
          const isApproximatelyStraight = totalLength > 20; // Minimum length to consider

          if (isApproximatelyStraight) {
            // Remove the drawn path
            fabricCanvas.remove(path);

            // Create a proper Line object
            const straightLine = new Line([startX, startY, endX, endY], {
              stroke: brushColor,
              strokeWidth: brushSize,
              shadow: new Shadow({
                color: 'rgba(0, 0, 0, 0.3)',
                blur: 8,
                offsetX: 2,
                offsetY: 2,
              }),
              selectable: true,
              hasControls: true,
              hasBorders: true,
              cornerSize: 10,
              transparentCorners: false,
              cornerColor: '#3b82f6',
              cornerStyle: 'circle',
              lockRotation: false,
            });

            fabricCanvas.add(straightLine);

            // Use the straight line for labeling
            const bounds = straightLine.getBoundingRect();
            const label = String.fromCharCode(65 + wallLabelsRef.current.length);

            const text = new FabricText(label, {
              left: bounds.left + bounds.width / 2,
              top: bounds.top + bounds.height / 2 - 10,
              fontSize: 20,
              fill: '#ef4444',
              fontWeight: 'bold',
              selectable: false,
              evented: false,
            });

            fabricCanvas.add(text);
            wallLabelsRef.current.push({ shape: straightLine, label: text });

            // Add object:moving event listener to move label with shape
            straightLine.on('moving', function () {
              const bounds = straightLine.getBoundingRect();
              text.set({
                left: bounds.left + bounds.width / 2,
                top: bounds.top + bounds.height / 2 - 10,
              });
              fabricCanvas.renderAll();
            });

            straightLine.on('scaling', function () {
              const bounds = straightLine.getBoundingRect();
              text.set({
                left: bounds.left + bounds.width / 2,
                top: bounds.top + bounds.height / 2 - 10,
              });
              fabricCanvas.renderAll();
            });

            straightLine.on('rotating', function () {
              const bounds = straightLine.getBoundingRect();
              text.set({
                left: bounds.left + bounds.width / 2,
                top: bounds.top + bounds.height / 2 - 10,
              });
              fabricCanvas.renderAll();
            });

            // Add to measurements list
            setWallMeasurements(prev => [...prev, { label, length: '' }]);

            fabricCanvas.renderAll();

            const updatedObjects = fabricCanvas.getObjects().filter(obj =>
              !gridLinesRef.current.includes(obj) &&
              !(obj instanceof FabricText)
            );
            setWallCount(updatedObjects.length);

            // Save current state to history
            const canvasState = fabricCanvas.toJSON();
            canvasState.objects = canvasState.objects.filter((obj: any) =>
              !gridLinesRef.current.some(gridLine => gridLine.toJSON().type === obj.type)
            );
            setHistory(prev => [...prev, JSON.stringify(canvasState)]);

            const dataUrl = fabricCanvas.toDataURL();
            const currentPerimeter = wallMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
            const currentArea = calculateArea();
            onDrawingComplete(dataUrl, wallMeasurements, currentPerimeter, currentArea);

            return; // Exit early since we've handled everything
          }
        }

        // If not straightened, apply normal controls
        path.set({
          selectable: true,
          hasControls: true,
          hasBorders: true,
          cornerSize: 10,
          transparentCorners: false,
          cornerColor: '#3b82f6',
          cornerStyle: 'circle',
          lockRotation: false,
        });
      }

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

            // Find and remove all associated labels for this shape
            const labelIndices: number[] = [];
            wallLabelsRef.current.forEach((labelData: any, idx: number) => {
              if (labelData.shape === obj) {
                fabricCanvas.remove(labelData.label);
                labelIndices.push(idx);
              }
            });

            // Remove labels from wallLabelsRef (in reverse order to maintain indices)
            labelIndices.reverse().forEach(idx => {
              wallLabelsRef.current.splice(idx, 1);
              setWallMeasurements(prev => prev.filter((_, i) => i !== idx));
            });
          }
        });

        fabricCanvas.renderAll();
      } else {
        // Add label for the new path
        const path = e.path;
        const bounds = path.getBoundingRect();
        const label = String.fromCharCode(65 + wallLabelsRef.current.length); // A, B, C, etc.

        const text = new FabricText(label, {
          left: bounds.left + bounds.width / 2,
          top: bounds.top + bounds.height / 2,
          fontSize: 20,
          fill: '#ef4444',
          fontWeight: 'bold',
          selectable: false,
          evented: false,
        });

        fabricCanvas.add(text);
        wallLabelsRef.current.push({ shape: path, label: text });

        // Add object:moving event listener to move label with shape
        path.on('moving', function () {
          const bounds = path.getBoundingRect();
          text.set({
            left: bounds.left + bounds.width / 2,
            top: bounds.top + bounds.height / 2,
          });
          fabricCanvas.renderAll();
        });

        path.on('scaling', function () {
          const bounds = path.getBoundingRect();
          text.set({
            left: bounds.left + bounds.width / 2,
            top: bounds.top + bounds.height / 2,
          });
          fabricCanvas.renderAll();
        });

        path.on('rotating', function () {
          const bounds = path.getBoundingRect();
          text.set({
            left: bounds.left + bounds.width / 2,
            top: bounds.top + bounds.height / 2,
          });
          fabricCanvas.renderAll();
        });

        // Add to measurements list
        setWallMeasurements(prev => [...prev, { label, length: '' }]);
      }

      const updatedObjects = fabricCanvas.getObjects().filter(obj =>
        !gridLinesRef.current.includes(obj) &&
        !(obj instanceof FabricText)
      );
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
      const currentPerimeter = wallMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
      const currentArea = calculateArea();
      onDrawingComplete(dataUrl, wallMeasurements, currentPerimeter, currentArea);
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
      pencilBrush.shadow = new Shadow({
        color: 'rgba(0, 0, 0, 0.3)',
        blur: 8,
        offsetX: 2,
        offsetY: 2,
      });
      pencilBrush.decimate = 10; // Keep lines straight
      fabricCanvas.isDrawingMode = true;
    } else if (tool === "erase") {
      // For eraser, we use a transparent color - the actual erasing happens in path:created
      pencilBrush.color = 'rgba(0,0,0,1)';
      pencilBrush.width = brushSize;
      fabricCanvas.isDrawingMode = true;
    }

    fabricCanvas.freeDrawingBrush = pencilBrush;
  }, [fabricCanvas, tool, brushColor, brushSize]);

  // Update color of all existing shapes when brush color changes
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.getObjects().forEach(obj => {
      // Skip grid lines and text labels
      if (gridLinesRef.current.includes(obj) || obj instanceof FabricText) {
        return;
      }

      // Update stroke color for all drawing objects
      if (obj.stroke) {
        obj.set({ stroke: brushColor });
      }
    });

    fabricCanvas.renderAll();
  }, [brushColor, fabricCanvas]);

  const addShapeTemplate = (shapeType: string) => {
    if (!fabricCanvas) return;

    const centerX = fabricCanvas.width! / 2;
    const centerY = fabricCanvas.height! / 2;
    const wallShadow = new Shadow({
      color: 'rgba(0, 0, 0, 0.3)',
      blur: 8,
      offsetX: 2,
      offsetY: 2,
    });

    let shape: any;
    let labels: FabricText[] = [];
    let wallLengths: string[] = [];
    const currentLabelIndex = wallLabelsRef.current.length;

    switch (shapeType) {
      case "arc":
        // Create arc using fabric Path
        const arcPath = "M 0,50 Q 50,0 100,50";
        shape = new Path(arcPath, {
          left: centerX - 50,
          top: centerY - 25,
          stroke: brushColor,
          strokeWidth: 3,
          fill: '',
          shadow: wallShadow,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          cornerSize: 10,
          transparentCorners: false,
          cornerColor: '#3b82f6',
          cornerStyle: 'circle',
          lockRotation: false,
        });
        // Arc has 1 edge - approximate arc length (~π*radius)
        wallLengths = ['157'];
        const arcLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex), {
          left: centerX,
          top: centerY - 40,
          fill: '#ef4444',
          fontSize: 20,
          fontWeight: 'bold',
          selectable: false,
          evented: false,
        });
        labels.push(arcLabel);
        break;

      case "circle":
        shape = new Circle({
          left: centerX - 50,
          top: centerY - 50,
          radius: 50,
          stroke: brushColor,
          strokeWidth: 3,
          fill: '',
          shadow: wallShadow,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          cornerSize: 10,
          transparentCorners: false,
          cornerColor: '#3b82f6',
          cornerStyle: 'circle',
          lockRotation: false,
        });
        // Circle has 1 edge - circumference (2*π*radius)
        wallLengths = ['314'];
        const circleLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex), {
          left: centerX - 5,
          top: centerY - 60,
          fill: '#ef4444',
          fontSize: 20,
          fontWeight: 'bold',
          selectable: false,
          evented: false,
        });
        labels.push(circleLabel);
        break;

      case "halfcircle":
        // Half circle using Path with diameter line
        const halfCirclePath = "M 0,50 A 50,50 0 0,1 100,50 L 0,50";
        shape = new Path(halfCirclePath, {
          left: centerX - 50,
          top: centerY - 25,
          stroke: brushColor,
          strokeWidth: 3,
          fill: '',
          shadow: wallShadow,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          cornerSize: 10,
          transparentCorners: false,
          cornerColor: '#3b82f6',
          cornerStyle: 'circle',
          lockRotation: false,
        });
        // Half circle has 2 edges - arc + diameter
        wallLengths = ['157', '100'];
        const halfArcLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex), {
          left: centerX,
          top: centerY - 40,
          fill: '#ef4444',
          fontSize: 20,
          fontWeight: 'bold',
          selectable: false,
          evented: false,
        });
        const halfDiameterLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
          left: centerX,
          top: centerY + 15,
          fill: '#ef4444',
          fontSize: 20,
          fontWeight: 'bold',
          selectable: false,
          evented: false,
        });
        labels.push(halfArcLabel, halfDiameterLabel);
        break;

      case "rectangle":
        shape = new Rect({
          left: centerX - 75,
          top: centerY - 50,
          width: 150,
          height: 100,
          stroke: brushColor,
          strokeWidth: 3,
          fill: '',
          shadow: wallShadow,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          cornerSize: 10,
          transparentCorners: false,
          cornerColor: '#3b82f6',
          cornerStyle: 'circle',
          lockRotation: false,
        });
        // Rectangle has 4 walls - top, right, bottom, left
        wallLengths = ['150', '100', '150', '100'];
        // Top wall
        const topLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex), {
          left: centerX,
          top: centerY - 65,
          fill: '#ef4444',
          fontSize: 20,
          fontWeight: 'bold',
          selectable: false,
          evented: false,
        });
        // Right wall
        const rightLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
          left: centerX + 85,
          top: centerY,
          fill: '#ef4444',
          fontSize: 20,
          fontWeight: 'bold',
          selectable: false,
          evented: false,
        });
        // Bottom wall
        const bottomLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
          left: centerX,
          top: centerY + 60,
          fill: '#ef4444',
          fontSize: 20,
          fontWeight: 'bold',
          selectable: false,
          evented: false,
        });
        // Left wall
        const leftLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
          left: centerX - 95,
          top: centerY,
          fill: '#ef4444',
          fontSize: 20,
          fontWeight: 'bold',
          selectable: false,
          evented: false,
        });
        labels.push(topLabel, rightLabel, bottomLabel, leftLabel);
        break;
    }

    if (shape) {
      fabricCanvas.add(shape);
      labels.forEach(label => {
        fabricCanvas.add(label);
        wallLabelsRef.current.push({ shape, label });
      });

      // Add event listeners to move labels with shape
      shape.on('moving', function () {
        const shapeCenter = shape.getCenterPoint();
        const bounds = shape.getBoundingRect();

        labels.forEach((label, idx) => {
          // Position labels based on shape type
          if (shapeType === "rectangle") {
            // Top, Right, Bottom, Left
            const positions = [
              { left: shapeCenter.x, top: bounds.top - 15 },
              { left: bounds.left + bounds.width + 10, top: shapeCenter.y },
              { left: shapeCenter.x, top: bounds.top + bounds.height + 15 },
              { left: bounds.left - 20, top: shapeCenter.y }
            ];
            label.set(positions[idx]);
          } else if (shapeType === "halfcircle") {
            // Arc and diameter
            const positions = [
              { left: shapeCenter.x, top: bounds.top - 15 },
              { left: shapeCenter.x, top: bounds.top + bounds.height + 5 }
            ];
            label.set(positions[idx]);
          } else {
            // Arc and circle - center label
            label.set({
              left: shapeCenter.x - 5,
              top: bounds.top - 15
            });
          }
        });
        fabricCanvas.renderAll();
      });

      shape.on('scaling', function () {
        const shapeCenter = shape.getCenterPoint();
        const bounds = shape.getBoundingRect();

        labels.forEach((label, idx) => {
          if (shapeType === "rectangle") {
            const positions = [
              { left: shapeCenter.x, top: bounds.top - 15 },
              { left: bounds.left + bounds.width + 10, top: shapeCenter.y },
              { left: shapeCenter.x, top: bounds.top + bounds.height + 15 },
              { left: bounds.left - 20, top: shapeCenter.y }
            ];
            label.set(positions[idx]);
          } else if (shapeType === "halfcircle") {
            const positions = [
              { left: shapeCenter.x, top: bounds.top - 15 },
              { left: shapeCenter.x, top: bounds.top + bounds.height + 5 }
            ];
            label.set(positions[idx]);
          } else {
            label.set({
              left: shapeCenter.x - 5,
              top: bounds.top - 15
            });
          }
        });
        fabricCanvas.renderAll();
      });

      shape.on('rotating', function () {
        const shapeCenter = shape.getCenterPoint();
        const bounds = shape.getBoundingRect();

        labels.forEach((label, idx) => {
          if (shapeType === "rectangle") {
            const positions = [
              { left: shapeCenter.x, top: bounds.top - 15 },
              { left: bounds.left + bounds.width + 10, top: shapeCenter.y },
              { left: shapeCenter.x, top: bounds.top + bounds.height + 15 },
              { left: bounds.left - 20, top: shapeCenter.y }
            ];
            label.set(positions[idx]);
          } else if (shapeType === "halfcircle") {
            const positions = [
              { left: shapeCenter.x, top: bounds.top - 15 },
              { left: shapeCenter.x, top: bounds.top + bounds.height + 5 }
            ];
            label.set(positions[idx]);
          } else {
            label.set({
              left: shapeCenter.x - 5,
              top: bounds.top - 15
            });
          }
        });
        fabricCanvas.renderAll();
      });

      // Add measurements to state
      const newMeasurements = wallLengths.map((length, index) => ({
        label: String.fromCharCode(65 + currentLabelIndex + index),
        length: length,
      }));
      setWallMeasurements(prev => [...prev, ...newMeasurements]);

      fabricCanvas.setActiveObject(shape);
      fabricCanvas.isDrawingMode = false; // Exit drawing mode to allow immediate manipulation
      fabricCanvas.renderAll();

      // Update wall count
      const drawingObjects = fabricCanvas.getObjects().filter(obj =>
        !gridLinesRef.current.includes(obj) &&
        !(obj instanceof FabricText)
      );
      setWallCount(drawingObjects.length);

      // Save to history
      const canvasState = fabricCanvas.toJSON();
      canvasState.objects = canvasState.objects.filter((obj: any) =>
        !gridLinesRef.current.some(gridLine => gridLine.toJSON().type === obj.type)
      );
      setHistory(prev => [...prev, JSON.stringify(canvasState)]);

      const dataUrl = fabricCanvas.toDataURL();
      const currentPerimeter = wallMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
      const currentArea = calculateArea();
      onDrawingComplete(dataUrl, wallMeasurements, currentPerimeter, currentArea);
      toast.success(`${shapeType} template with ${wallLengths.length} wall(s) added!`);
    }
  };

  const addQuickRoom = () => {
    if (!fabricCanvas) return;

    // Add a simple room rectangle with opening
    const roomWidth = 300;
    const roomHeight = 200;
    const x = (fabricCanvas.width! - roomWidth) / 2;
    const y = (fabricCanvas.height! - roomHeight) / 2;

    // Main room outline with 3D effect
    const wallShadow = new Shadow({
      color: 'rgba(0, 0, 0, 0.3)',
      blur: 8,
      offsetX: 2,
      offsetY: 2,
    });

    const walls = [
      new Line([x, y, x + roomWidth, y], {
        stroke: "#1a1a1a",
        strokeWidth: 3,
        shadow: wallShadow,
        selectable: true,
        hasControls: true,
        hasBorders: true,
      }), // Top
      new Line([x + roomWidth, y, x + roomWidth, y + roomHeight], {
        stroke: "#1a1a1a",
        strokeWidth: 3,
        shadow: wallShadow,
        selectable: true,
        hasControls: true,
        hasBorders: true,
      }), // Right
      new Line([x + roomWidth, y + roomHeight, x, y + roomHeight], {
        stroke: "#1a1a1a",
        strokeWidth: 3,
        shadow: wallShadow,
        selectable: true,
        hasControls: true,
        hasBorders: true,
      }), // Bottom
      new Line([x, y + roomHeight, x, y + 80], {
        stroke: "#1a1a1a",
        strokeWidth: 3,
        shadow: wallShadow,
        selectable: true,
        hasControls: true,
        hasBorders: true,
      }), // Left bottom
      new Line([x, y + 120, x, y], {
        stroke: "#1a1a1a",
        strokeWidth: 3,
        shadow: wallShadow,
        selectable: true,
        hasControls: true,
        hasBorders: true,
      }), // Left top
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
    const currentPerimeter = wallMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
    const currentArea = calculateArea();
    onDrawingComplete(dataUrl, wallMeasurements, currentPerimeter, currentArea);
    toast.success("Quick room added!");
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;

    const allObjects = fabricCanvas.getObjects();
    const drawingObjects = allObjects.filter(obj =>
      !gridLinesRef.current.includes(obj) &&
      !(obj instanceof FabricText)
    );

    if (drawingObjects.length === 0) {
      toast.error("Nothing to undo!");
      return;
    }

    isRestoringRef.current = true;

    // Remove the last drawing object
    const lastObject = drawingObjects[drawingObjects.length - 1];
    fabricCanvas.remove(lastObject);

    // Remove the last label if it exists
    if (wallLabelsRef.current.length > 0) {
      const lastLabelData = wallLabelsRef.current[wallLabelsRef.current.length - 1];
      const lastLabel = lastLabelData.label || lastLabelData;
      fabricCanvas.remove(lastLabel);
      wallLabelsRef.current.pop();

      // Remove last measurement
      setWallMeasurements(prev => prev.slice(0, -1));
    }

    fabricCanvas.renderAll();

    // Update counts
    const updatedDrawingObjects = fabricCanvas.getObjects().filter(obj =>
      !gridLinesRef.current.includes(obj) &&
      !(obj instanceof FabricText)
    );
    setWallCount(updatedDrawingObjects.length);

    // Save current state to history
    const canvasState = fabricCanvas.toJSON();
    canvasState.objects = canvasState.objects.filter((obj: any) =>
      !gridLinesRef.current.some(gridLine => gridLine.toJSON().type === obj.type)
    );
    setHistory(prev => [...prev, JSON.stringify(canvasState)]);

    const dataUrl = fabricCanvas.toDataURL();
    const currentPerimeter = wallMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
    const currentArea = calculateArea();
    onDrawingComplete(dataUrl, wallMeasurements, currentPerimeter, currentArea);

    isRestoringRef.current = false;
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
    setWallMeasurements([]);
    wallLabelsRef.current = [];
    setHistory([]);
    onDrawingComplete("", [], 0, 0);
    toast.success("Canvas cleared!");
  };

  const handleMeasurementChange = (index: number, value: string) => {
    setWallMeasurements(prev => {
      const newMeasurements = [...prev];
      newMeasurements[index] = { ...newMeasurements[index], length: value };

      // Update the drawing complete callback with new measurements
      if (fabricCanvas) {
        const dataUrl = fabricCanvas.toDataURL();
        const currentPerimeter = newMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
        const currentArea = calculateAreaFromMeasurements(newMeasurements);
        onDrawingComplete(dataUrl, newMeasurements, currentPerimeter, currentArea);
      }

      return newMeasurements;
    });
  };

  // Helper function to calculate area from measurements
  const calculateAreaFromMeasurements = (measurements: WallMeasurement[]) => {
    if (measurements.length < 4) return 0;

    const lengths = measurements
      .map(w => parseFloat(w.length) || 0)
      .filter(l => l > 0);

    if (lengths.length >= 2) {
      const sortedLengths = [...lengths].sort((a, b) => a - b);
      const width = sortedLengths[0];
      const height = sortedLengths[sortedLengths.length - 1];
      return width * height;
    }

    return 0;
  };

  // Calculate total perimeter and area
  const totalPerimeter = wallMeasurements.reduce((sum, wall) => {
    const length = parseFloat(wall.length) || 0;
    return sum + length;
  }, 0);

  // Simple area calculation (assumes rectangular room)
  // For more complex shapes, this would need more sophisticated geometry
  const calculateArea = () => {
    if (wallMeasurements.length < 4) return 0;

    // Try to find pairs of opposite walls for width and height
    const lengths = wallMeasurements
      .map(w => parseFloat(w.length) || 0)
      .filter(l => l > 0);

    if (lengths.length >= 2) {
      // Simple approximation: use average of pairs
      const sortedLengths = [...lengths].sort((a, b) => a - b);
      const width = sortedLengths[0];
      const height = sortedLengths[sortedLengths.length - 1];
      return width * height;
    }

    return 0;
  };

  const totalArea = calculateArea();

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h3 className="font-semibold text-base md:text-lg">Draw your space layout</h3>
          <p className="text-xs md:text-sm text-muted-foreground">Draw walls or use shape templates below</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleUndo} variant="outline" size="sm">
            <Undo className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button onClick={addQuickRoom} variant="outline" size="sm">
            Quick Room
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            Clear
          </Button>
        </div>
      </div>

      {/* Shape Templates */}
      <div className="flex flex-wrap gap-2 p-1 md:p-4 bg-card border rounded-lg">
        <Label className="w-full text-xs md:text-sm font-medium mb-2">Shape Templates (click to add, then drag & resize)</Label>
        {shapeTemplates.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            size="sm"
            onClick={() => addShapeTemplate(template.id)}
            className="flex items-center gap-1 md:gap-2 hover:bg-primary hover:text-primary-foreground transition-colors text-xs md:text-sm"
          >
            <span className="text-lg md:text-xl">{template.icon}</span>
            <span>{template.label}</span>
          </Button>
        ))}
      </div>

      {/* Drawing Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 p-1 md:p-4 bg-muted rounded-lg">
        <div className="space-y-2">
          <Label>Tool</Label>
          <div className="flex gap-2">
            <Button
              variant={tool === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTool("draw");
                if (fabricCanvas) fabricCanvas.isDrawingMode = true;
              }}
              className="flex-1"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Draw
            </Button>
            <Button
              variant={tool === "erase" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTool("erase");
                if (fabricCanvas) fabricCanvas.isDrawingMode = true;
              }}
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
                className={`w-10 h-10 rounded-lg border-2 transition-all ${brushColor === color && tool === "draw"
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

      <div className="border-2 border-border rounded-lg shadow-lg overflow-auto bg-white" style={{ touchAction: 'none' }}>
        <canvas ref={canvasRef} className="touch-none" style={{ maxWidth: '100%', height: 'auto' }} />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs md:text-sm">
        <p className="text-muted-foreground">
          Walls drawn: {wallCount}
        </p>
        <p className="text-muted-foreground">
          {tool === "draw" ? "Drawing mode" : "Eraser mode"} - {isDrawing ? "Active" : "Click and drag"}
        </p>
      </div>

      {/* Wall Measurements Input */}
      {wallMeasurements.length > 0 && (
        <div className="space-y-3 md:space-y-4 p-1 md:p-4 bg-card rounded-lg border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4">
            <h4 className="font-semibold text-base md:text-lg">Enter wall lengths</h4>
            {totalPerimeter > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 text-xs md:text-sm w-full sm:w-auto">
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-muted-foreground">Total Perimeter</span>
                  <span className="font-semibold text-primary">{totalPerimeter.toFixed(2)} {unit}</span>
                </div>
                {totalArea > 0 && (
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-muted-foreground">Estimated Area</span>
                    <span className="font-semibold text-primary">{totalArea.toFixed(2)} {unit}²</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {wallMeasurements.map((wall, index) => (
              <div key={`${wall.label}-${index}`} className="space-y-2">
                <Label htmlFor={`wall-${wall.label}`} className="font-semibold">
                  Wall {wall.label} ({unit})
                </Label>
                <Input
                  id={`wall-${wall.label}`}
                  type="number"
                  placeholder={`Length (${unit})`}
                  value={wall.length}
                  onChange={(e) => handleMeasurementChange(index, e.target.value)}
                  min="0"
                  step="0.1"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};