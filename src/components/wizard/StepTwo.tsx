import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DrawingCanvas } from "./DrawingCanvas";

interface Space {
  id: string;
  name: string;
  type: string;
  ceilingHeight: string;
  drawingData?: string;
  wallMeasurements?: Array<{ label: string; length: string }>;
  unit?: "cm" | "in";
  totalPerimeter?: number;
  totalArea?: number;
}

interface StepTwoProps {
  spaces: Space[];
  setSpaces: (spaces: Space[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  storagePriorities: string[];
  setStoragePriorities: (priorities: string[]) => void;
  additionalNotes: string;
  setAdditionalNotes: (notes: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepTwo = ({
  spaces,
  setSpaces,
  files,
  setFiles,
  storagePriorities,
  setStoragePriorities,
  additionalNotes,
  setAdditionalNotes,
  onNext,
  onBack,
}: StepTwoProps) => {
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [activeSpaceId, setActiveSpaceId] = useState<string>("");

  const addSpace = () => {
    const newSpace: Space = {
      id: crypto.randomUUID(),
      name: `Space ${spaces.length + 1}`,
      type: "Walk-in Closet",
      ceilingHeight: "",
      drawingData: "",
    };
    setSpaces([...spaces, newSpace]);
    setActiveSpaceId(newSpace.id);
  };

  const updateSpace = (id: string, field: keyof Space, value: string) => {
    setSpaces(spaces.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleDrawingComplete = (
    spaceId: string,
    dataUrl: string,
    wallMeasurements: Array<{ label: string; length: string }>,
    totalPerimeter: number,
    totalArea: number
  ) => {
    const space = spaces.find(s => s.id === spaceId);
    if (space) {
      setSpaces(spaces.map((s) =>
        s.id === spaceId
          ? {
            ...s,
            drawingData: dataUrl,
            wallMeasurements,
            unit,
            totalPerimeter,
            totalArea
          }
          : s
      ));
    }
  };

  const removeSpace = (id: string) => {
    setSpaces(spaces.filter((s) => s.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const togglePriority = (priority: string) => {
    if (storagePriorities.includes(priority)) {
      setStoragePriorities(storagePriorities.filter((p) => p !== priority));
    } else {
      setStoragePriorities([...storagePriorities, priority]);
    }
  };

  const handleNext = () => {
    if (spaces.length === 0) {
      toast.error("Please add at least one space");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-3 md:space-y-6 animate-in fade-in duration-500">
      {/* Add Spaces Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold">Add your spaces</h2>
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Units</span>
              <Select value={unit} onValueChange={(value: "cm" | "in") => setUnit(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="in">in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addSpace} variant="default" size="sm" className="flex-1 md:flex-initial">
              <Plus className="w-4 h-4 mr-2" />
              Add space
            </Button>
          </div>
        </div>

        {spaces.length === 0 ? (
          <Card className="p-6 md:p-8 text-center">
            <p className="text-muted-foreground text-sm md:text-base">
              No spaces yet. Click <span className="font-semibold">+ Add space</span> to begin.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {spaces.map((space) => (
              <Card
                key={space.id}
                className={`p-4 cursor-pointer transition-all ${activeSpaceId === space.id
                  ? "ring-2 ring-primary"
                  : "hover:shadow-md"
                  }`}
                onClick={() => setActiveSpaceId(space.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{space.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSpace(space.id);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {space.drawingData ? "Drawing completed" : "No drawing yet"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Show all sections only when spaces exist */}
      {spaces.length > 0 && (
        <>
          {/* Space Details Section */}
          {activeSpaceId && (
            <Card className="p-4 md:p-6">
              <h3 className="font-semibold text-base md:text-lg mb-4">Space details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label>Space name</Label>
                  <Input
                    value={spaces.find(s => s.id === activeSpaceId)?.name || ""}
                    onChange={(e) => updateSpace(activeSpaceId, "name", e.target.value)}
                    placeholder="Space 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ceiling height ({unit})</Label>
                  <Input
                    type="number"
                    value={spaces.find(s => s.id === activeSpaceId)?.ceilingHeight || ""}
                    onChange={(e) => updateSpace(activeSpaceId, "ceilingHeight", e.target.value)}
                    placeholder={unit === "cm" ? "240" : "96"}
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  Active space: {spaces.find(s => s.id === activeSpaceId)?.name || ""}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSpace(activeSpaceId)}
                  className="w-full md:w-auto"
                >
                  Delete this space
                </Button>
              </div>
            </Card>
          )}

          {/* Drawing Canvas Section */}
          {activeSpaceId && (
            <Card className="p-3 md:p-6 overflow-x-auto">
              <DrawingCanvas
                spaceId={activeSpaceId}
                unit={unit}
                onDrawingComplete={(dataUrl, wallMeasurements, totalPerimeter, totalArea) =>
                  handleDrawingComplete(activeSpaceId, dataUrl, wallMeasurements, totalPerimeter, totalArea)
                }
              />
            </Card>
          )}

          <Card className="p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2">Photos & videos (optional)</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-4">
                  Photos and videos are optional, but the more info you share, the lower the chance of misfit or design errors.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center gap-2 md:gap-3 border-2 border-dashed rounded-lg p-6 md:p-12 cursor-pointer hover:bg-muted/50 transition-all hover:border-primary/50"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm md:text-base">Click to upload files</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Images and videos up to 20MB
                    </p>
                  </div>
                </Label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{files.length} file(s) selected</p>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Upload className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="ml-2 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2">Storage priorities</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-4">
                  Tap in order of most needed.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3">
                {["Hanging", "Drawers", "Shelves"].map((priority) => (
                  <Button
                    key={priority}
                    variant={storagePriorities.includes(priority) ? "default" : "outline"}
                    onClick={() => togglePriority(priority)}
                    type="button"
                  >
                    {priority}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional notes (optional)</Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any special requirements or preferences..."
              rows={4}
            />
          </div>
        </>
      )}

      <div className="flex justify-between gap-3 pt-6">
        <Button variant="outline" onClick={onBack} size="lg" className="flex-1 md:flex-initial">
          Back
        </Button>
        <Button onClick={handleNext} size="lg" className="flex-1 md:flex-initial md:px-8">
          Next
        </Button>
      </div>
    </div>
  );
};
