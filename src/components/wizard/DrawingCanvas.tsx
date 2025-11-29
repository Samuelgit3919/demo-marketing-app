import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Line, Rect, PencilBrush, Text as FabricText, Shadow, Circle, Path, Group } from "fabric";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Undo } from "lucide-react";

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
  const [history, setHistory] = useState<string[]>([]);
  const [wallMeasurements, setWallMeasurements] = useState<WallMeasurement[]>([]);
  const gridLinesRef = useRef<any[]>([]);
  const isRestoringRef = useRef(false);
  const wallLabelsRef = useRef<any[]>([]);
  const previousUnitRef = useRef<"cm" | "in">(unit);
  const MAX_WALLS = 6;

  // Helper functions to update label positions
  const updateShapeLabels = (shape: any, labels: FabricText[]) => {
    if (!fabricCanvas) return;
    const bounds = shape.getBoundingRect();
    const width = bounds.width;
    const height = bounds.height;

    // For rectangles: top, right, bottom, left
    if (labels.length === 4) {
      labels[0].set({ left: bounds.left + width / 2, top: bounds.top - 15 }); // top
      labels[1].set({ left: bounds.left + width + 10, top: bounds.top + height / 2 }); // right
      labels[2].set({ left: bounds.left + width / 2, top: bounds.top + height + 10 }); // bottom
      labels[3].set({ left: bounds.left - 20, top: bounds.top + height / 2 }); // left
    }
    fabricCanvas.renderAll();
  };

  const updateLShapeLabels = (shape: any, labels: FabricText[], shapeType: string) => {
    if (!fabricCanvas) return;
    const bounds = shape.getBoundingRect();
    const width = bounds.width;
    const height = bounds.height;

    // Different positioning for each L-shape variant
    switch (shapeType) {
      case 'lshape-1': // ┌
        labels[0]?.set({ left: bounds.left + width / 2, top: bounds.top - 10 });
        labels[1]?.set({ left: bounds.left + width + 5, top: bounds.top + height * 0.3 });
        labels[2]?.set({ left: bounds.left + width * 0.8, top: bounds.top + height * 0.6 });
        labels[3]?.set({ left: bounds.left + width * 0.5, top: bounds.top + height + 5 });
        labels[4]?.set({ left: bounds.left + width * 0.25, top: bounds.top + height * 0.6 });
        labels[5]?.set({ left: bounds.left - 10, top: bounds.top + height / 2 });
        break;
      case 'lshape-2': // ┐
        labels[0]?.set({ left: bounds.left + width * 0.25, top: bounds.top + height * 0.6 });
        labels[1]?.set({ left: bounds.left + width * 0.4, top: bounds.top + height * 0.3 });
        labels[2]?.set({ left: bounds.left + width * 0.4, top: bounds.top - 10 });
        labels[3]?.set({ left: bounds.left + width + 5, top: bounds.top + height / 2 });
        labels[4]?.set({ left: bounds.left + width / 2, top: bounds.top + height + 5 });
        labels[5]?.set({ left: bounds.left - 10, top: bounds.top + height * 0.8 });
        break;
      case 'lshape-3': // └
        labels[0]?.set({ left: bounds.left - 10, top: bounds.top + height / 2 });
        labels[1]?.set({ left: bounds.left + width * 0.25, top: bounds.top + height * 0.4 });
        labels[2]?.set({ left: bounds.left + width * 0.5, top: bounds.top - 10 });
        labels[3]?.set({ left: bounds.left + width * 0.8, top: bounds.top + height * 0.4 });
        labels[4]?.set({ left: bounds.left + width + 5, top: bounds.top + height * 0.7 });
        labels[5]?.set({ left: bounds.left + width / 2, top: bounds.top + height + 5 });
        break;
      case 'lshape-4': // ┘
        labels[0]?.set({ left: bounds.left + width / 2, top: bounds.top - 10 });
        labels[1]?.set({ left: bounds.left + width + 5, top: bounds.top + height * 0.2 });
        labels[2]?.set({ left: bounds.left + width * 0.75, top: bounds.top + height * 0.4 });
        labels[3]?.set({ left: bounds.left + width * 0.6, top: bounds.top + height * 0.6 });
        labels[4]?.set({ left: bounds.left + width * 0.6, top: bounds.top + height + 5 });
        labels[5]?.set({ left: bounds.left - 10, top: bounds.top + height / 2 });
        break;
    }
    fabricCanvas.renderAll();
  };

  const updateAngleLabels = (shape: any, labels: FabricText[], shapeType: string) => {
    if (!fabricCanvas) return;
    const bounds = shape.getBoundingRect();
    const width = bounds.width;
    const height = bounds.height;

    // Different positioning for each angle variant (5-wall chamfered shapes)
    switch (shapeType) {
      case 'angle-1': // top-right chamfer
        labels[0]?.set({ left: bounds.left + width * 0.4, top: bounds.top - 10 });
        labels[1]?.set({ left: bounds.left + width * 0.85, top: bounds.top + height * 0.15 });
        labels[2]?.set({ left: bounds.left + width + 5, top: bounds.top + height * 0.6 });
        labels[3]?.set({ left: bounds.left + width / 2, top: bounds.top + height + 5 });
        labels[4]?.set({ left: bounds.left - 10, top: bounds.top + height / 2 });
        break;
      case 'angle-2': // top-left chamfer
        labels[0]?.set({ left: bounds.left + width * 0.6, top: bounds.top - 10 });
        labels[1]?.set({ left: bounds.left + width + 5, top: bounds.top + height / 2 });
        labels[2]?.set({ left: bounds.left + width / 2, top: bounds.top + height + 5 });
        labels[3]?.set({ left: bounds.left - 10, top: bounds.top + height * 0.6 });
        labels[4]?.set({ left: bounds.left + width * 0.15, top: bounds.top + height * 0.15 });
        break;
      case 'angle-3': // bottom-left chamfer
        labels[0]?.set({ left: bounds.left + width / 2, top: bounds.top - 10 });
        labels[1]?.set({ left: bounds.left + width + 5, top: bounds.top + height / 2 });
        labels[2]?.set({ left: bounds.left + width * 0.6, top: bounds.top + height + 5 });
        labels[3]?.set({ left: bounds.left + width * 0.15, top: bounds.top + height * 0.85 });
        labels[4]?.set({ left: bounds.left - 10, top: bounds.top + height * 0.4 });
        break;
      case 'angle-4': // bottom-right chamfer
        labels[0]?.set({ left: bounds.left + width / 2, top: bounds.top - 10 });
        labels[1]?.set({ left: bounds.left + width + 5, top: bounds.top + height * 0.4 });
        labels[2]?.set({ left: bounds.left + width * 0.85, top: bounds.top + height * 0.85 });
        labels[3]?.set({ left: bounds.left + width * 0.4, top: bounds.top + height + 5 });
        labels[4]?.set({ left: bounds.left - 10, top: bounds.top + height / 2 });
        break;
      case 'angle-5': // right-side chamfer
        labels[0]?.set({ left: bounds.left + width / 2, top: bounds.top - 10 });
        labels[1]?.set({ left: bounds.left + width + 5, top: bounds.top + height * 0.25 });
        labels[2]?.set({ left: bounds.left + width * 0.85, top: bounds.top + height * 0.5 });
        labels[3]?.set({ left: bounds.left + width / 2, top: bounds.top + height + 5 });
        labels[4]?.set({ left: bounds.left - 10, top: bounds.top + height / 2 });
        break;
      case 'angle-6': // left-side chamfer
        labels[0]?.set({ left: bounds.left + width / 2, top: bounds.top - 10 });
        labels[1]?.set({ left: bounds.left + width + 5, top: bounds.top + height / 2 });
        labels[2]?.set({ left: bounds.left + width / 2, top: bounds.top + height + 5 });
        labels[3]?.set({ left: bounds.left - 10, top: bounds.top + height * 0.75 });
        labels[4]?.set({ left: bounds.left + width * 0.15, top: bounds.top + height * 0.5 });
        break;
    }
    fabricCanvas.renderAll();
  };

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
    pencilBrush.color = "#1a1a1a";
    pencilBrush.width = 3;
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
      // Check if max walls reached
      if (wallMeasurements.length >= MAX_WALLS) {
        fabricCanvas.remove(e.path);
        toast.error(`Maximum ${MAX_WALLS} walls allowed per space`);
        return;
      }

      // Remove grid lines before saving to history
      const allObjects = fabricCanvas.getObjects();
      const drawingObjects = allObjects.filter(obj =>
        !gridLinesRef.current.includes(obj) &&
        !(obj instanceof FabricText)
      );

      // Auto-straighten lines for draw tool
      if (e.path) {
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
              stroke: "#1a1a1a",
              strokeWidth: 3,
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
  }, [fabricCanvas, onDrawingComplete]);

  const addShapeTemplate = (shapeType: string) => {
    if (!fabricCanvas) return;

    // Check max walls limit
    if (wallMeasurements.length >= MAX_WALLS) {
      toast.error(`Maximum ${MAX_WALLS} walls allowed per space`);
      return;
    }

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
      case "rectangle":
        shape = new Rect({
          left: centerX - 75,
          top: centerY - 50,
          width: 150,
          height: 100,
          stroke: "#1a1a1a",
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
        wallLengths = ['150', '100', '150', '100'];
        const topLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex), {
          left: centerX, top: centerY - 65, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
        });
        const rightLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
          left: centerX + 85, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
        });
        const bottomLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
          left: centerX, top: centerY + 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
        });
        const leftLabel = new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
          left: centerX - 95, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
        });
        labels.push(topLabel, rightLabel, bottomLabel, leftLabel);

        // Add event listeners to update label positions
        shape.on('moving', () => updateShapeLabels(shape, [topLabel, rightLabel, bottomLabel, leftLabel]));
        shape.on('scaling', () => updateShapeLabels(shape, [topLabel, rightLabel, bottomLabel, leftLabel]));
        shape.on('rotating', () => updateShapeLabels(shape, [topLabel, rightLabel, bottomLabel, leftLabel]));
        shape.on('modified', () => updateShapeLabels(shape, [topLabel, rightLabel, bottomLabel, leftLabel]));
        break;

      case "lshape-1":
        // L-shape bottom-right: ┌
        const lPath1 = "M 0,0 L 100,0 L 100,60 L 60,60 L 60,100 L 0,100 Z";
        shape = new Path(lPath1, {
          left: centerX - 50, top: centerY - 50, stroke: "#1a1a1a", strokeWidth: 3, fill: '', shadow: wallShadow,
          selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false,
          cornerColor: '#3b82f6', cornerStyle: 'circle', lockRotation: false,
        });
        wallLengths = ['100', '60', '40', '40', '60', '100'];
        // Labels positioned near each wall: top, right-top, right-bottom, bottom-right, bottom-left, left
        labels.push(
          new FabricText(String.fromCharCode(65 + currentLabelIndex), {
            left: centerX, top: centerY - 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
            left: centerX + 55, top: centerY - 20, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
            left: centerX + 35, top: centerY + 30, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
            left: centerX + 5, top: centerY + 55, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 4), {
            left: centerX - 25, top: centerY + 30, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 5), {
            left: centerX - 60, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          })
        );

        // Add event listeners to update label positions
        shape.on('moving', () => updateLShapeLabels(shape, labels, 'lshape-1'));
        shape.on('scaling', () => updateLShapeLabels(shape, labels, 'lshape-1'));
        shape.on('rotating', () => updateLShapeLabels(shape, labels, 'lshape-1'));
        shape.on('modified', () => updateLShapeLabels(shape, labels, 'lshape-1'));
        break;

      case "lshape-2":
        // L-shape bottom-left: ┐
        const lPath2 = "M 0,60 L 40,60 L 40,0 L 100,0 L 100,100 L 0,100 Z";
        shape = new Path(lPath2, {
          left: centerX - 50, top: centerY - 50, stroke: "#1a1a1a", strokeWidth: 3, fill: '', shadow: wallShadow,
          selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false,
          cornerColor: '#3b82f6', cornerStyle: 'circle', lockRotation: false,
        });
        wallLengths = ['40', '60', '100', '100', '40', '60'];
        labels.push(
          new FabricText(String.fromCharCode(65 + currentLabelIndex), {
            left: centerX - 30, top: centerY + 5, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
            left: centerX - 10, top: centerY - 20, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
            left: centerX + 20, top: centerY - 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
            left: centerX + 55, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 4), {
            left: centerX, top: centerY + 55, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 5), {
            left: centerX - 30, top: centerY + 30, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          })
        );

        // Add event listeners to update label positions
        shape.on('moving', () => updateLShapeLabels(shape, labels, 'lshape-2'));
        shape.on('scaling', () => updateLShapeLabels(shape, labels, 'lshape-2'));
        shape.on('rotating', () => updateLShapeLabels(shape, labels, 'lshape-2'));
        shape.on('modified', () => updateLShapeLabels(shape, labels, 'lshape-2'));
        break;

      case "lshape-3":
        // L-shape top-right: └
        const lPath3 = "M 0,0 L 60,0 L 60,40 L 100,40 L 100,100 L 0,100 Z";
        shape = new Path(lPath3, {
          left: centerX - 50, top: centerY - 50, stroke: "#1a1a1a", strokeWidth: 3, fill: '', shadow: wallShadow,
          selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false,
          cornerColor: '#3b82f6', cornerStyle: 'circle', lockRotation: false,
        });
        wallLengths = ['60', '40', '40', '60', '100', '100'];
        labels.push(
          new FabricText(String.fromCharCode(65 + currentLabelIndex), {
            left: centerX - 20, top: centerY - 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
            left: centerX + 10, top: centerY - 30, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
            left: centerX + 35, top: centerY - 10, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
            left: centerX + 55, top: centerY + 20, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 4), {
            left: centerX, top: centerY + 55, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 5), {
            left: centerX - 60, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          })
        );

        // Add event listeners to update label positions
        shape.on('moving', () => updateLShapeLabels(shape, labels, 'lshape-3'));
        shape.on('scaling', () => updateLShapeLabels(shape, labels, 'lshape-3'));
        shape.on('rotating', () => updateLShapeLabels(shape, labels, 'lshape-3'));
        shape.on('modified', () => updateLShapeLabels(shape, labels, 'lshape-3'));
        break;

      case "lshape-4":
        // L-shape top-left: ┘
        const lPath4 = "M 0,40 L 40,40 L 40,0 L 100,0 L 100,100 L 0,100 Z";
        shape = new Path(lPath4, {
          left: centerX - 50, top: centerY - 50, stroke: "#1a1a1a", strokeWidth: 3, fill: '', shadow: wallShadow,
          selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false,
          cornerColor: '#3b82f6', cornerStyle: 'circle', lockRotation: false,
        });
        wallLengths = ['40', '40', '60', '100', '100', '60'];
        labels.push(
          new FabricText(String.fromCharCode(65 + currentLabelIndex), {
            left: centerX - 30, top: centerY - 10, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
            left: centerX - 10, top: centerY - 30, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
            left: centerX + 20, top: centerY - 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
            left: centerX + 55, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 4), {
            left: centerX, top: centerY + 55, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 5), {
            left: centerX - 30, top: centerY + 20, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          })
        );

        // Add event listeners to update label positions
        shape.on('moving', () => updateLShapeLabels(shape, labels, 'lshape-4'));
        shape.on('scaling', () => updateLShapeLabels(shape, labels, 'lshape-4'));
        shape.on('rotating', () => updateLShapeLabels(shape, labels, 'lshape-4'));
        shape.on('modified', () => updateLShapeLabels(shape, labels, 'lshape-4'));
        break;

      case "angle-1":
        // Rectangle with top-left corner chamfered (5 walls)
        const anglePath1 = "M 0,100 L 0,20 L 20,0 L 100,0 L 100,100 Z";
        shape = new Path(anglePath1, {
          left: centerX - 50, top: centerY - 50, stroke: "#1a1a1a", strokeWidth: 3, fill: '', shadow: wallShadow,
          selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false,
          cornerColor: '#3b82f6', cornerStyle: 'circle', lockRotation: false,
        });
        wallLengths = ['80', '28', '80', '100', '100'];
        // Labels: left wall, diagonal, top wall, right wall, bottom wall
        labels.push(
          new FabricText(String.fromCharCode(65 + currentLabelIndex), {
            left: centerX - 60, top: centerY + 5, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
            left: centerX - 30, top: centerY - 40, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
            left: centerX + 10, top: centerY - 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
            left: centerX + 55, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 4), {
            left: centerX, top: centerY + 55, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          })
        );

        // Add event listeners to update label positions
        shape.on('moving', () => updateAngleLabels(shape, labels, 'angle-1'));
        shape.on('scaling', () => updateAngleLabels(shape, labels, 'angle-1'));
        shape.on('rotating', () => updateAngleLabels(shape, labels, 'angle-1'));
        shape.on('modified', () => updateAngleLabels(shape, labels, 'angle-1'));
        break;

      case "angle-2":
        // Rectangle with bottom-left corner chamfered (5 walls)
        const anglePath2 = "M 0,0 L 0,80 L 20,100 L 100,100 L 100,0 Z";
        shape = new Path(anglePath2, {
          left: centerX - 50, top: centerY - 50, stroke: "#1a1a1a", strokeWidth: 3, fill: '', shadow: wallShadow,
          selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false,
          cornerColor: '#3b82f6', cornerStyle: 'circle', lockRotation: false,
        });
        wallLengths = ['80', '28', '80', '100', '100'];
        labels.push(
          new FabricText(String.fromCharCode(65 + currentLabelIndex), {
            left: centerX - 60, top: centerY - 5, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
            left: centerX - 30, top: centerY + 40, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
            left: centerX + 10, top: centerY + 55, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
            left: centerX + 55, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 4), {
            left: centerX, top: centerY - 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          })
        );

        // Add event listeners to update label positions
        shape.on('moving', () => updateAngleLabels(shape, labels, 'angle-2'));
        shape.on('scaling', () => updateAngleLabels(shape, labels, 'angle-2'));
        shape.on('rotating', () => updateAngleLabels(shape, labels, 'angle-2'));
        shape.on('modified', () => updateAngleLabels(shape, labels, 'angle-2'));
        break;

      case "angle-3":
        // Rectangle with top-right corner chamfered (5 walls)
        const anglePath3 = "M 0,0 L 80,0 L 100,20 L 100,100 L 0,100 Z";
        shape = new Path(anglePath3, {
          left: centerX - 50, top: centerY - 50, stroke: "#1a1a1a", strokeWidth: 3, fill: '', shadow: wallShadow,
          selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false,
          cornerColor: '#3b82f6', cornerStyle: 'circle', lockRotation: false,
        });
        wallLengths = ['80', '28', '80', '100', '100'];
        labels.push(
          new FabricText(String.fromCharCode(65 + currentLabelIndex), {
            left: centerX - 10, top: centerY - 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
            left: centerX + 30, top: centerY - 40, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
            left: centerX + 55, top: centerY + 5, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
            left: centerX, top: centerY + 55, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 4), {
            left: centerX - 60, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          })
        );

        // Add event listeners to update label positions
        shape.on('moving', () => updateAngleLabels(shape, labels, 'angle-3'));
        shape.on('scaling', () => updateAngleLabels(shape, labels, 'angle-3'));
        shape.on('rotating', () => updateAngleLabels(shape, labels, 'angle-3'));
        shape.on('modified', () => updateAngleLabels(shape, labels, 'angle-3'));
        break;

      case "angle-4":
        // Rectangle with bottom-right corner chamfered (5 walls)
        const anglePath4 = "M 0,0 L 100,0 L 100,80 L 80,100 L 0,100 Z";
        shape = new Path(anglePath4, {
          left: centerX - 50, top: centerY - 50, stroke: "#1a1a1a", strokeWidth: 3, fill: '', shadow: wallShadow,
          selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false,
          cornerColor: '#3b82f6', cornerStyle: 'circle', lockRotation: false,
        });
        wallLengths = ['100', '80', '28', '80', '100'];
        labels.push(
          new FabricText(String.fromCharCode(65 + currentLabelIndex), {
            left: centerX, top: centerY - 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
            left: centerX + 55, top: centerY - 5, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
            left: centerX + 30, top: centerY + 40, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
            left: centerX - 10, top: centerY + 55, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 4), {
            left: centerX - 60, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          })
        );

        // Add event listeners to update label positions
        shape.on('moving', () => updateAngleLabels(shape, labels, 'angle-4'));
        shape.on('scaling', () => updateAngleLabels(shape, labels, 'angle-4'));
        shape.on('rotating', () => updateAngleLabels(shape, labels, 'angle-4'));
        shape.on('modified', () => updateAngleLabels(shape, labels, 'angle-4'));
        break;

      case "angle-5":
        // Rectangle with top-right corner chamfered variation (5 walls)
        const anglePath5 = "M 0,0 L 80,0 L 100,20 L 100,100 L 0,100 Z";
        shape = new Path(anglePath5, {
          left: centerX - 50, top: centerY - 50, stroke: "#1a1a1a", strokeWidth: 3, fill: '', shadow: wallShadow,
          selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false,
          cornerColor: '#3b82f6', cornerStyle: 'circle', lockRotation: false,
        });
        wallLengths = ['80', '28', '80', '100', '100'];
        labels.push(
          new FabricText(String.fromCharCode(65 + currentLabelIndex), {
            left: centerX - 10, top: centerY - 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
            left: centerX + 30, top: centerY - 40, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
            left: centerX + 55, top: centerY + 5, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
            left: centerX, top: centerY + 55, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 4), {
            left: centerX - 60, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          })
        );

        // Add event listeners to update label positions
        shape.on('moving', () => updateAngleLabels(shape, labels, 'angle-5'));
        shape.on('scaling', () => updateAngleLabels(shape, labels, 'angle-5'));
        shape.on('rotating', () => updateAngleLabels(shape, labels, 'angle-5'));
        shape.on('modified', () => updateAngleLabels(shape, labels, 'angle-5'));
        break;

      case "angle-6":
        // Rectangle with bottom-left corner chamfered variation (5 walls)
        const anglePath6 = "M 0,0 L 0,80 L 20,100 L 100,100 L 100,0 Z";
        shape = new Path(anglePath6, {
          left: centerX - 50, top: centerY - 50, stroke: "#1a1a1a", strokeWidth: 3, fill: '', shadow: wallShadow,
          selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false,
          cornerColor: '#3b82f6', cornerStyle: 'circle', lockRotation: false,
        });
        wallLengths = ['80', '28', '80', '100', '100'];
        labels.push(
          new FabricText(String.fromCharCode(65 + currentLabelIndex), {
            left: centerX - 60, top: centerY - 5, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 1), {
            left: centerX - 30, top: centerY + 40, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 2), {
            left: centerX + 10, top: centerY + 55, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 3), {
            left: centerX + 55, top: centerY, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          }),
          new FabricText(String.fromCharCode(65 + currentLabelIndex + 4), {
            left: centerX, top: centerY - 60, fill: '#ef4444', fontSize: 20, fontWeight: 'bold', selectable: false, evented: false,
          })
        );

        // Add event listeners to update label positions
        shape.on('moving', () => updateAngleLabels(shape, labels, 'angle-6'));
        shape.on('scaling', () => updateAngleLabels(shape, labels, 'angle-6'));
        shape.on('rotating', () => updateAngleLabels(shape, labels, 'angle-6'));
        shape.on('modified', () => updateAngleLabels(shape, labels, 'angle-6'));
        break;
    }

    if (shape) {
      fabricCanvas.add(shape);
      labels.forEach(label => {
        fabricCanvas.add(label);
        wallLabelsRef.current.push({ shape, label });
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
          <p className="text-xs md:text-sm text-muted-foreground">Draw walls BIRDS EYE VIEW or use ROOM TEMPLATES below</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleUndo} variant="outline" size="sm" className="animate-pulse">
            <Undo className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm" className="animate-pulse">
            Clear
          </Button>
        </div>
      </div>

      {/* Shape Templates */}
      <div className="space-y-3">
        <Label className="text-xs md:text-sm font-medium">Rectangle</Label>
        <div className="flex flex-wrap gap-2 p-3 md:p-4 bg-card border rounded-lg">
          <button
            onClick={() => addShapeTemplate('rectangle')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
            title="Rectangle"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <rect x="2" y="2" width="46" height="36" />
            </svg>
          </button>
        </div>

        <Label className="text-xs md:text-sm font-medium">L-Shape</Label>
        <div className="flex flex-wrap gap-2 p-3 md:p-4 bg-card border rounded-lg">
          <button
            onClick={() => addShapeTemplate('lshape-1')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale"
            title="L-Shape 1"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <path d="M 2,2 L 38,2 L 38,20 L 20,20 L 20,38 L 2,38 Z" />
            </svg>
          </button>
          <button
            onClick={() => addShapeTemplate('lshape-2')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale"
            title="L-Shape 2"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <path d="M 12,20 L 30,20 L 30,2 L 48,2 L 48,38 L 12,38 Z" />
            </svg>
          </button>
          <button
            onClick={() => addShapeTemplate('lshape-3')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale"
            title="L-Shape 3"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <path d="M 2,2 L 20,2 L 20,20 L 48,20 L 48,38 L 2,38 Z" />
            </svg>
          </button>
          <button
            onClick={() => addShapeTemplate('lshape-4')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale"
            title="L-Shape 4"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <path d="M 12,20 L 30,20 L 30,2 L 48,2 L 48,38 L 12,38 Z" />
            </svg>
          </button>
        </div>

        <Label className="text-xs md:text-sm font-medium">Angle</Label>
        <div className="flex flex-wrap gap-2 p-3 md:p-4 bg-card border rounded-lg">
          <button
            onClick={() => addShapeTemplate('angle-1')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale"
            title="Rectangle with Top-Left Chamfer"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <path d="M 6,34 L 6,14 L 14,6 L 44,6 L 44,34 Z" />
            </svg>
          </button>
          <button
            onClick={() => addShapeTemplate('angle-2')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale"
            title="Rectangle with Bottom-Left Chamfer"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <path d="M 6,6 L 6,26 L 14,34 L 44,34 L 44,6 Z" />
            </svg>
          </button>
          <button
            onClick={() => addShapeTemplate('angle-3')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale"
            title="Rectangle with Top-Right Chamfer"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <path d="M 6,6 L 36,6 L 44,14 L 44,34 L 6,34 Z" />
            </svg>
          </button>
          <button
            onClick={() => addShapeTemplate('angle-4')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale"
            title="Rectangle with Bottom-Right Chamfer"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <path d="M 6,6 L 44,6 L 44,26 L 36,34 L 6,34 Z" />
            </svg>
          </button>
          <button
            onClick={() => addShapeTemplate('angle-5')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale"
            title="Rectangle with Top-Right Chamfer Alt"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <path d="M 6,6 L 36,6 L 44,14 L 44,34 L 6,34 Z" />
            </svg>
          </button>
          <button
            onClick={() => addShapeTemplate('angle-6')}
            className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale"
            title="Rectangle with Bottom-Left Chamfer Alt"
          >
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none">
              <path d="M 6,6 L 6,26 L 14,34 L 44,34 L 44,6 Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="border-2 border-border rounded-lg shadow-lg overflow-auto bg-white" style={{ touchAction: 'none' }}>
        <canvas ref={canvasRef} className="touch-none" style={{ maxWidth: '100%', height: 'auto' }} />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs md:text-sm">
        <p className="text-muted-foreground">
          Walls drawn: {wallCount} / {MAX_WALLS}
        </p>
        <p className="text-muted-foreground">
          Drawing mode - Click and drag to draw walls
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
                  Wall {wall.label} ({unit}) *
                </Label>
                <Input
                  id={`wall-${wall.label}`}
                  type="number"
                  placeholder={`Length (${unit})`}
                  value={wall.length}
                  onChange={(e) => handleMeasurementChange(index, Math.max(0, parseFloat(e.target.value) || 0).toString())}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};