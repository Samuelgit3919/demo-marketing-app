import { useEffect, useRef, useState } from "react";
import {
  Canvas as FabricCanvas,
  Line,
  Rect,
  PencilBrush,
  Text as FabricText,
  Shadow,
  Circle,
  Path,
  Group,
} from "fabric";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Undo } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DrawingCanvasProps {
  onDrawingComplete: (
    dataUrl: string,
    wallMeasurements: WallMeasurement[],
    totalPerimeter: number,
    totalArea: number,
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
  const MAX_WALLS = 7;
  const { t } = useLanguage();

  // createLabel helper
  const createLabel = (text: string, offsetX: number, offsetY: number) => {
    return new FabricText(text, {
      originX: "center",
      originY: "center",
      left: offsetX,
      top: offsetY,
      fill: "#ef4444",
      fontSize: 20,
      fontWeight: "bold",
      selectable: false,
      evented: false,
    });
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const isMobile = window.innerWidth < 768;
    const canvasWidth = isMobile ? Math.min(window.innerWidth - 60, 600) : 800;
    const canvasHeight = isMobile ? 400 : 500;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#ffffff",
      selection: true,
    });

    const gridSize = 20;
    const gridLines: any[] = [];
    for (let i = 0; i < canvas.width! / gridSize; i++) {
      const line = new Line([i * gridSize, 0, i * gridSize, canvas.height!], { stroke: "#e5e7eb", strokeWidth: 1, selectable: false, evented: false });
      canvas.add(line);
      gridLines.push(line);
    }
    for (let i = 0; i < canvas.height! / gridSize; i++) {
      const line = new Line([0, i * gridSize, canvas.width!, i * gridSize], { stroke: "#e5e7eb", strokeWidth: 1, selectable: false, evented: false });
      canvas.add(line);
      gridLines.push(line);
    }

    gridLinesRef.current = gridLines;

    canvas.isDrawingMode = true;
    const pencilBrush = new PencilBrush(canvas);
    pencilBrush.color = "#1a1a1a";
    pencilBrush.width = 3;
    pencilBrush.shadow = new Shadow({ color: "rgba(0, 0, 0, 0.3)", blur: 8, offsetX: 2, offsetY: 2 });
    pencilBrush.decimate = 10;
    canvas.freeDrawingBrush = pencilBrush;

    canvasRef.current.style.touchAction = "none";

    setFabricCanvas(canvas);
    setHistory([]);
    setWallCount(0);
    setWallMeasurements([]);
    wallLabelsRef.current = [];

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const newWidth = isMobile ? Math.min(window.innerWidth - 60, 600) : 800;
      const newHeight = isMobile ? 400 : 500;
      canvas.setDimensions({ width: newWidth, height: newHeight });
      canvas.renderAll();
    };

    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); canvas.dispose(); };
  }, [spaceId]);

  useEffect(() => {
    if (previousUnitRef.current === unit) return;
    const conversionFactor = unit === "cm" ? 2.54 : 1 / 2.54;
    setWallMeasurements((prev) =>
      prev.map((wall) => {
        const currentValue = parseFloat(wall.length) || 0;
        const convertedValue = currentValue * conversionFactor;
        return { ...wall, length: convertedValue > 0 ? convertedValue.toFixed(2) : "" };
      }),
    );
    previousUnitRef.current = unit;
  }, [unit]);

  useEffect(() => {
    if (!fabricCanvas || isRestoringRef.current) return;

    const handlePathCreated = (e: any) => {
      if (wallMeasurements.length >= MAX_WALLS) {
        fabricCanvas.remove(e.path);
        toast.error(t("canvas.maxWalls").replace("{max}", MAX_WALLS.toString()));
        return;
      }

      const allObjects = fabricCanvas.getObjects();
      const drawingObjects = allObjects.filter(
        (obj) => !gridLinesRef.current.includes(obj) && !(obj instanceof FabricText),
      );

      if (e.path) {
        const path = e.path;
        const pathData = path.path;

        if (pathData && pathData.length >= 2) {
          const firstPoint = pathData[0];
          const lastPoint = pathData[pathData.length - 1];
          const startX = firstPoint[1];
          const startY = firstPoint[2];
          const endX = lastPoint[lastPoint.length - 2];
          const endY = lastPoint[lastPoint.length - 1];
          const dx = Math.abs(endX - startX);
          const dy = Math.abs(endY - startY);
          const totalLength = Math.sqrt(dx * dx + dy * dy);
          const isApproximatelyStraight = totalLength > 20;

          if (isApproximatelyStraight) {
            fabricCanvas.remove(path);
            const straightLine = new Line([startX, startY, endX, endY], {
              stroke: "#1a1a1a", strokeWidth: 3,
              shadow: new Shadow({ color: "rgba(0, 0, 0, 0.3)", blur: 8, offsetX: 2, offsetY: 2 }),
              selectable: true, hasControls: true, hasBorders: true, cornerSize: 10,
              transparentCorners: false, cornerColor: "#3b82f6", cornerStyle: "circle", lockRotation: false,
            });

            fabricCanvas.add(straightLine);
            const bounds = straightLine.getBoundingRect();
            const label = String.fromCharCode(65 + wallLabelsRef.current.length);
            const text = new FabricText(label, { left: bounds.left + bounds.width / 2, top: bounds.top + bounds.height / 2 - 10, fontSize: 20, fill: "#ef4444", fontWeight: "bold", selectable: false, evented: false });
            fabricCanvas.add(text);
            wallLabelsRef.current.push({ shape: straightLine, label: text });

            straightLine.on("moving", function () { const b = straightLine.getBoundingRect(); text.set({ left: b.left + b.width / 2, top: b.top + b.height / 2 - 10 }); fabricCanvas.renderAll(); });
            straightLine.on("scaling", function () { const b = straightLine.getBoundingRect(); text.set({ left: b.left + b.width / 2, top: b.top + b.height / 2 - 10 }); fabricCanvas.renderAll(); });
            straightLine.on("rotating", function () { const b = straightLine.getBoundingRect(); text.set({ left: b.left + b.width / 2, top: b.top + b.height / 2 - 10 }); fabricCanvas.renderAll(); });

            setWallMeasurements((prev) => [...prev, { label, length: "" }]);
            fabricCanvas.renderAll();

            const updatedObjects = fabricCanvas.getObjects().filter((obj) => !gridLinesRef.current.includes(obj) && !(obj instanceof FabricText));
            setWallCount(updatedObjects.length);

            const canvasState = fabricCanvas.toJSON();
            canvasState.objects = canvasState.objects.filter((obj: any) => !gridLinesRef.current.some((gridLine) => gridLine.toJSON().type === obj.type));
            setHistory((prev) => [...prev, JSON.stringify(canvasState)]);

            const dataUrl = fabricCanvas.toDataURL();
            const currentPerimeter = wallMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
            const currentArea = calculateArea();
            onDrawingComplete(dataUrl, wallMeasurements, currentPerimeter, currentArea);
            return;
          }
        }

        path.set({ selectable: true, hasControls: true, hasBorders: true, cornerSize: 10, transparentCorners: false, cornerColor: "#3b82f6", cornerStyle: "circle", lockRotation: false });
      }

      const path = e.path;
      const bounds = path.getBoundingRect();
      const label = String.fromCharCode(65 + wallLabelsRef.current.length);
      const text = new FabricText(label, { left: bounds.left + bounds.width / 2, top: bounds.top + bounds.height / 2, fontSize: 20, fill: "#ef4444", fontWeight: "bold", selectable: false, evented: false });
      fabricCanvas.add(text);
      wallLabelsRef.current.push({ shape: path, label: text });

      path.on("moving", function () { const b = path.getBoundingRect(); text.set({ left: b.left + b.width / 2, top: b.top + b.height / 2 }); fabricCanvas.renderAll(); });
      path.on("scaling", function () { const b = path.getBoundingRect(); text.set({ left: b.left + b.width / 2, top: b.top + b.height / 2 }); fabricCanvas.renderAll(); });
      path.on("rotating", function () { const b = path.getBoundingRect(); text.set({ left: b.left + b.width / 2, top: b.top + b.height / 2 }); fabricCanvas.renderAll(); });

      setWallMeasurements((prev) => [...prev, { label, length: "" }]);

      const updatedObjects = fabricCanvas.getObjects().filter((obj) => !gridLinesRef.current.includes(obj) && !(obj instanceof FabricText));
      setWallCount(updatedObjects.length);

      const canvasState = fabricCanvas.toJSON();
      canvasState.objects = canvasState.objects.filter((obj: any) => !gridLinesRef.current.some((gridLine) => gridLine.toJSON().type === obj.type && gridLine.toJSON().stroke === obj.stroke));
      setHistory((prev) => [...prev, JSON.stringify(canvasState)]);

      const dataUrl = fabricCanvas.toDataURL();
      const currentPerimeter = wallMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
      const currentArea = calculateArea();
      onDrawingComplete(dataUrl, wallMeasurements, currentPerimeter, currentArea);
    };

    fabricCanvas.on("path:created", handlePathCreated);
    return () => { fabricCanvas.off("path:created", handlePathCreated); };
  }, [fabricCanvas, onDrawingComplete]);

  const addShapeTemplate = (shapeType: string) => {
    if (!fabricCanvas) return;
    if (wallMeasurements.length >= MAX_WALLS) {
      toast.error(t("canvas.maxWalls").replace("{max}", MAX_WALLS.toString()));
      return;
    }

    const centerX = fabricCanvas.width! / 2;
    const centerY = fabricCanvas.height! / 2;
    const wallShadow = new Shadow({ color: "rgba(0, 0, 0, 0.3)", blur: 8, offsetX: 2, offsetY: 2 });

    let shapeObj: any;
    let labelObjects: FabricText[] = [];
    let wallLengths: string[] = [];
    const currentLabelIndex = wallLabelsRef.current.length;

    const makeLabel = (char: string, x: number, y: number) => {
      return new FabricText(char, { left: x, top: y, originX: "center", originY: "center", fill: "#ef4444", fontSize: 20, fontWeight: "bold", selectable: false, evented: false });
    };

    switch (shapeType) {
      case "rectangle":
        shapeObj = new Rect({ left: -75, top: -50, width: 150, height: 100, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["150", "100", "150", "100"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), 0, -58),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), 83, 0),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 0, 68),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), -93, 0),
        ];
        break;
      case "lshape-1":
        shapeObj = new Path("M 0,0 L 100,0 L 100,60 L 60,60 L 60,100 L 0,100 Z", { left: -50, top: -50, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["100", "60", "40", "40", "60", "100"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), 0, -60),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), 55, -20),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 35, 30),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), 5, 55),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 4), -25, 30),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 5), -60, 0),
        ];
        break;
      case "lshape-2":
        shapeObj = new Path("M 0,60 L 40,60 L 40,0 L 100,0 L 100,100 L 0,100 Z", { left: -50, top: -50, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["40", "60", "100", "100", "40", "60"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), -30, 5),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), -10, -20),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 20, -60),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), 55, 0),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 4), 0, 55),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 5), -30, 30),
        ];
        break;
      case "lshape-3":
        shapeObj = new Path("M 0,0 L 60,0 L 60,40 L 100,40 L 100,100 L 0,100 Z", { left: -50, top: -50, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["60", "40", "40", "60", "100", "100"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), -20, -60),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), 10, -30),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 35, -10),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), 55, 20),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 4), 0, 55),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 5), -60, 0),
        ];
        break;
      case "lshape-4":
        shapeObj = new Path("M 0,40 L 40,40 L 40,0 L 100,0 L 100,100 L 0,100 Z", { left: -50, top: -50, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["40", "40", "60", "100", "100", "60"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), -30, -10),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), -10, -30),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 20, -60),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), 55, 0),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 4), 0, 55),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 5), -30, 20),
        ];
        break;
      case "angle-1":
        shapeObj = new Path("M 0,100 L 0,20 L 20,0 L 100,0 L 100,100 Z", { left: -50, top: -50, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["80", "28", "80", "100", "100"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), -60, 5),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), -30, -40),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 10, -60),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), 55, 0),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 4), 0, 55),
        ];
        break;
      case "angle-2":
        shapeObj = new Path("M 0,0 L 0,80 L 20,100 L 100,100 L 100,0 Z", { left: -50, top: -50, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["80", "28", "80", "100", "100"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), -60, -5),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), -30, 40),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 10, 55),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), 55, 0),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 4), 0, -60),
        ];
        break;
      case "angle-3":
        shapeObj = new Path("M 0,0 L 80,0 L 100,20 L 100,100 L 0,100 Z", { left: -50, top: -50, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["80", "28", "80", "100", "100"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), -10, -60),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), 30, -40),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 55, 5),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), 0, 55),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 4), -60, 0),
        ];
        break;
      case "angle-4":
        shapeObj = new Path("M 0,0 L 100,0 L 100,80 L 80,100 L 0,100 Z", { left: -50, top: -50, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["100", "80", "28", "80", "100"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), 0, -60),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), 55, -5),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 30, 40),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), -10, 55),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 4), -60, 0),
        ];
        break;
      case "angle-5":
        shapeObj = new Path("M 0,0 L 80,0 L 100,20 L 100,100 L 0,100 Z", { left: -50, top: -50, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["80", "28", "80", "100", "100"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), -10, -60),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), 30, -40),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 55, 5),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), 0, 55),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 4), -60, 0),
        ];
        break;
      case "angle-6":
        shapeObj = new Path("M 0,0 L 0,80 L 20,100 L 100,100 L 100,0 Z", { left: -50, top: -50, stroke: "#1a1a1a", strokeWidth: 3, fill: "transparent", shadow: wallShadow });
        wallLengths = ["80", "28", "80", "100", "100"];
        labelObjects = [
          makeLabel(String.fromCharCode(65 + currentLabelIndex), -60, -5),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 1), -30, 40),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 2), 10, 55),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 3), 55, 0),
          makeLabel(String.fromCharCode(65 + currentLabelIndex + 4), 0, -60),
        ];
        break;
    }

    if (shapeObj && labelObjects.length > 0) {
      const shapeGroup = new Group([shapeObj, ...labelObjects], {
        left: centerX, top: centerY, originX: "center", originY: "center",
        selectable: true, hasControls: true, hasBorders: true, cornerSize: 10,
        transparentCorners: false, cornerColor: "#3b82f6", cornerStyle: "circle",
        lockRotation: false, subTargetCheck: false,
      });

      fabricCanvas.add(shapeGroup);
      labelObjects.forEach((label) => { wallLabelsRef.current.push({ shape: shapeGroup, label }); });

      const newMeasurements = wallLengths.map((length, index) => ({
        label: String.fromCharCode(65 + currentLabelIndex + index), length,
      }));
      setWallMeasurements((prev) => [...prev, ...newMeasurements]);

      fabricCanvas.setActiveObject(shapeGroup);
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.renderAll();

      const drawingObjects = fabricCanvas.getObjects().filter((obj) => !gridLinesRef.current.includes(obj) && !(obj instanceof FabricText) && !(obj instanceof Group && obj === shapeGroup));
      setWallCount(drawingObjects.length + 1);

      const canvasState = fabricCanvas.toJSON();
      canvasState.objects = canvasState.objects.filter((obj: any) => !gridLinesRef.current.some((gridLine) => gridLine.toJSON().type === obj.type));
      setHistory((prev) => [...prev, JSON.stringify(canvasState)]);

      const dataUrl = fabricCanvas.toDataURL();
      const currentPerimeter = wallMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
      const currentArea = calculateArea();
      onDrawingComplete(dataUrl, wallMeasurements, currentPerimeter, currentArea);
      toast.success(`${shapeType} ${t("canvas.templateAdded").replace("{count}", wallLengths.length.toString())}`);
    }
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;
    const allObjects = fabricCanvas.getObjects();
    const drawingObjects = allObjects.filter((obj) => !gridLinesRef.current.includes(obj) && !(obj instanceof FabricText));
    if (drawingObjects.length === 0) { toast.error(t("canvas.nothingToUndo")); return; }

    isRestoringRef.current = true;
    const lastObject = drawingObjects[drawingObjects.length - 1];
    let labelsToRemove = 0;
    if (lastObject instanceof Group) {
      labelsToRemove = wallLabelsRef.current.filter(item => item.shape === lastObject).length;
      wallLabelsRef.current = wallLabelsRef.current.filter(item => item.shape !== lastObject);
    } else {
      const labelEntry = wallLabelsRef.current.find(item => item.shape === lastObject);
      if (labelEntry) { fabricCanvas.remove(labelEntry.label); wallLabelsRef.current = wallLabelsRef.current.filter(item => item.shape !== lastObject); labelsToRemove = 1; }
    }
    fabricCanvas.remove(lastObject);
    if (labelsToRemove > 0) setWallMeasurements((prev) => prev.slice(0, -labelsToRemove));
    fabricCanvas.renderAll();

    const updatedDrawingObjects = fabricCanvas.getObjects().filter((obj) => !gridLinesRef.current.includes(obj) && !(obj instanceof FabricText));
    setWallCount(updatedDrawingObjects.length);

    const canvasState = fabricCanvas.toJSON();
    canvasState.objects = canvasState.objects.filter((obj: any) => !gridLinesRef.current.some((gridLine) => gridLine.toJSON().type === obj.type));
    setHistory((prev) => [...prev, JSON.stringify(canvasState)]);

    const dataUrl = fabricCanvas.toDataURL();
    const currentPerimeter = wallMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
    const currentArea = calculateArea();
    onDrawingComplete(dataUrl, wallMeasurements, currentPerimeter, currentArea);
    isRestoringRef.current = false;
    toast.success(t("canvas.undoSuccess"));
  };

  const handleReset = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    gridLinesRef.current.forEach((line) => fabricCanvas.add(line));
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    setWallCount(0);
    setWallMeasurements([]);
    wallLabelsRef.current = [];
    setHistory([]);
    onDrawingComplete("", [], 0, 0);
    toast.success(t("canvas.canvasCleared"));
  };

  const handleMeasurementChange = (index: number, value: string) => {
    setWallMeasurements((prev) => {
      const newMeasurements = [...prev];
      newMeasurements[index] = { ...newMeasurements[index], length: value };
      if (fabricCanvas) {
        const dataUrl = fabricCanvas.toDataURL();
        const currentPerimeter = newMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);
        const currentArea = calculateAreaFromMeasurements(newMeasurements);
        onDrawingComplete(dataUrl, newMeasurements, currentPerimeter, currentArea);
      }
      return newMeasurements;
    });
  };

  const calculateAreaFromMeasurements = (measurements: WallMeasurement[]) => {
    if (measurements.length < 4) return 0;
    const lengths = measurements.map((w) => parseFloat(w.length) || 0).filter((l) => l > 0);
    if (lengths.length >= 2) {
      const sortedLengths = [...lengths].sort((a, b) => a - b);
      return sortedLengths[0] * sortedLengths[sortedLengths.length - 1];
    }
    return 0;
  };

  const totalPerimeter = wallMeasurements.reduce((sum, wall) => sum + (parseFloat(wall.length) || 0), 0);

  const calculateArea = () => {
    if (wallMeasurements.length < 4) return 0;
    const lengths = wallMeasurements.map((w) => parseFloat(w.length) || 0).filter((l) => l > 0);
    if (lengths.length >= 2) {
      const sortedLengths = [...lengths].sort((a, b) => a - b);
      return sortedLengths[0] * sortedLengths[sortedLengths.length - 1];
    }
    return 0;
  };

  const totalArea = calculateArea();

  return (
    <div className="space-y-3 md:space-y-4">
      <div>
        <h3 className="font-semibold text-base md:text-lg">{t("canvas.title")}</h3>
        <p className="text-xs md:text-sm text-muted-foreground">{t("canvas.subtitle")}</p>
      </div>

      <div className="space-y-3">

        <div className="flex flex-wrap gap-2 p-3 md:p-4 bg-card border rounded-lg">

          <button onClick={() => addShapeTemplate("lshape-1")} className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale" title="L-Shape 1">
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none"><path d="M 2,2 L 38,2 L 38,20 L 20,20 L 20,38 L 2,38 Z" /></svg>
          </button>
          <button onClick={() => addShapeTemplate("lshape-2")} className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale" title="L-Shape 2">
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none"><path d="M 12,20 L 30,20 L 30,2 L 48,2 L 48,38 L 12,38 Z" /></svg>
          </button>
          <button onClick={() => addShapeTemplate("lshape-3")} className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale" title="L-Shape 3">
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none"><path d="M 2,2 L 20,2 L 20,20 L 48,20 L 48,38 L 2,38 Z" /></svg>
          </button>


          <button onClick={() => addShapeTemplate("angle-1")} className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale" title="Angle 1">
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none"><path d="M 6,34 L 6,14 L 14,6 L 44,6 L 44,34 Z" /></svg>
          </button>
          <button onClick={() => addShapeTemplate("angle-2")} className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale" title="Angle 2">
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none"><path d="M 6,6 L 6,26 L 14,34 L 44,34 L 44,6 Z" /></svg>
          </button>
          <button onClick={() => addShapeTemplate("angle-3")} className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale" title="Angle 3">
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none"><path d="M 6,6 L 36,6 L 44,14 L 44,34 L 6,34 Z" /></svg>
          </button>
          <button onClick={() => addShapeTemplate("angle-4")} className="p-3 md:p-4 border-2 border-border hover:border-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer hover-scale" title="Angle 4">
            <svg width="50" height="40" viewBox="0 0 50 40" className="stroke-current stroke-2 fill-none"><path d="M 6,6 L 44,6 L 44,26 L 36,34 L 6,34 Z" /></svg>
          </button>
        </div>
      </div>

      <div className="border-2 border-border rounded-lg shadow-lg overflow-hidden bg-white" style={{ touchAction: "none" }}>
        <div className="flex justify-end gap-2 p-2 bg-muted/50 border-b">
          <Button onClick={handleUndo} variant="outline" size="sm">
            <Undo className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">{t("canvas.undo")}</span>
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            {t("canvas.clear")}
          </Button>
        </div>
        <div className="overflow-auto">
          <canvas ref={canvasRef} className="touch-none" style={{ maxWidth: "100%", height: "auto" }} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs md:text-sm">
        <p className="text-muted-foreground">{t("canvas.wallsDrawn")}: {wallCount} / {MAX_WALLS}</p>
        <p className="text-muted-foreground">{t("canvas.drawingMode")}</p>
      </div>

      {wallMeasurements.length > 0 && (
        <div className="space-y-3 md:space-y-4 p-1 md:p-4 bg-card rounded-lg border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4">
            <h4 className="font-semibold text-base md:text-lg">{t("canvas.enterWallLengths")}</h4>
            {totalPerimeter > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 text-xs md:text-sm w-full sm:w-auto">
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-muted-foreground">{t("canvas.totalPerimeter")}</span>
                  <span className="font-semibold text-primary">{totalPerimeter.toFixed(2)} {unit}</span>
                </div>
                {totalArea > 0 && (
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-muted-foreground">{t("canvas.estimatedArea")}</span>
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
                  {t("step3.wall")} {wall.label} ({unit}) *
                </Label>
                <Input
                  id={`wall-${wall.label}`}
                  type="number"
                  placeholder={`${t("canvas.enterWallLengths")} (${unit})`}
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
