import { useState, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DrawingCanvas } from "./DrawingCanvas";
import { useLanguage } from "@/contexts/LanguageContext";
import { UploadedFile } from "@/pages/Wizard";

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
  formData: any;
  spaces: Space[];
  setSpaces: (spaces: Space[]) => void;
  files: UploadedFile[];
  setFiles: Dispatch<SetStateAction<UploadedFile[]>>;
  storagePriorities: string[];
  setStoragePriorities: (priorities: string[]) => void;
  additionalNotes: string;
  setAdditionalNotes: (notes: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepTwo = ({
  formData,
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
  const [unit, setUnit] = useState<"cm" | "in">("in");
  const [activeSpaceId, setActiveSpaceId] = useState<string>("");
  const { t } = useLanguage();

  const handleUnitChange = (newUnit: "cm" | "in") => {
    if (newUnit === unit) return;

    const conversionFactor = newUnit === "cm" ? 2.54 : 1 / 2.54;

    // Convert ceiling heights for all spaces
    setSpaces(spaces.map((space) => {
      const currentHeight = parseFloat(space.ceilingHeight) || 0;
      const convertedHeight = currentHeight * conversionFactor;
      return {
        ...space,
        ceilingHeight: convertedHeight > 0 ? Math.round(convertedHeight).toString() : (newUnit === "cm" ? "244" : "96")
      };
    }));

    setUnit(newUnit);
  };

  const addSpace = () => {
    const defaultCeiling = unit === "cm" ? "244" : "96";
    const newSpace: Space = {
      id: crypto.randomUUID(),
      name: `Space ${spaces.length + 1}`,
      type: "Walk-in Closet",
      ceilingHeight: defaultCeiling,
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

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    try {
      // Ensure bucket exists (public for now)
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.find(b => b.name === "images");

      if (!bucketExists) {
        await supabase.storage.createBucket("images", {
          public: true,
          fileSizeLimit: 20971520, // 20MB
          allowedMimeTypes: ["image/*", "video/*", "application/pdf"],
        });
      }

      // Safe filename handling
      const fileExt = file.name ? file.name.split(".").pop() : "bin";
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      // Use email or 'anonymous' if email is missing (shouldn't be reached if step 1 valid)
      const userEmail = formData.email || "anonymous";
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, "_"); // sanitize logic
      const filePath = `submissions/${safeEmail}/${fileName}`;

      const { error } = await supabase.storage.from("images").upload(filePath, file);

      if (error) throw error;
      return filePath;
    } catch (error: any) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newUploadedFiles: UploadedFile[] = newFiles.map(f => ({
        file: f,
        id: crypto.randomUUID(),
        preview: URL.createObjectURL(f),
        uploadStatus: "pending" as const
      }));

      // Add to state immediately
      // We pass the new array because setFiles might not update synchronously enough for the loop if we used functional update inside loop only
      const updatedFiles = [...files, ...newUploadedFiles];
      setFiles(updatedFiles);

      // Trigger uploads
      // Note: we can't use 'files' state here as it's stale. We use the local 'newUploadedFiles' and update state functionally.
      newUploadedFiles.forEach(async (uploadedFile) => {
        // Update status to uploading
        setFiles(prev => prev.map(f => f.id === uploadedFile.id ? { ...f, uploadStatus: "uploading" } : f));

        try {
          const filePath = await uploadFileToSupabase(uploadedFile.file);
          // Update status to success and save path
          setFiles(prev => prev.map(f => f.id === uploadedFile.id ? { ...f, uploadStatus: "success", filePath } : f));
        } catch (error) {
          // Update status to error
          toast.error(`Failed to upload ${uploadedFile.file.name}`);
          setFiles(prev => prev.map(f => f.id === uploadedFile.id ? { ...f, uploadStatus: "error" } : f));
        }
      });
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const togglePriority = (priority: string) => {
    const currentIndex = storagePriorities.indexOf(priority);

    if (currentIndex === -1) {
      setStoragePriorities([...storagePriorities, priority]);
    } else {
      setStoragePriorities(storagePriorities.filter((p) => p !== priority));
    }
  };

  const getPriorityColor = (priority: string) => {
    const index = storagePriorities.indexOf(priority);
    if (index === -1) return 'bg-red-500 hover:bg-red-600 text-white';
    if (index === 0) return 'bg-green-500 hover:bg-green-600 text-white';
    if (index === 1) return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    return 'bg-red-500 hover:bg-red-600 text-white';
  };

  const priorityKeys = ["hanging", "drawers", "shelves"];

  const isFormValid = () => {
    if (spaces.length === 0) return false;

    // Check if any files are still uploading
    if (files.some(f => f.uploadStatus === "uploading")) return false;

    for (const space of spaces) {
      if (!space.name || space.name.trim() === "") {
        return false;
      }

      const ceilingHeight = parseFloat(space.ceilingHeight);
      if (!ceilingHeight || ceilingHeight <= 0) {
        return false;
      }

      if (space.wallMeasurements && space.wallMeasurements.length > 0) {
        for (const wall of space.wallMeasurements) {
          const length = parseFloat(wall.length);
          if (!wall.length || wall.length.trim() === "" || !length || length <= 0) {
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (spaces.length === 0) {
      toast.error(t("step2.addAtLeastOne"));
      return;
    }

    if (files.some(f => f.uploadStatus === "uploading")) {
      toast.error("Please wait for files to finish uploading.");
      return;
    }

    for (const space of spaces) {
      if (!space.name || space.name.trim() === "") {
        toast.error(`${t("step2.enterName")} "${space.name || ''}"`);
        return;
      }

      const ceilingHeight = parseFloat(space.ceilingHeight);
      if (!ceilingHeight || ceilingHeight <= 0) {
        toast.error(`${t("step2.enterCeiling")} "${space.name}"`);
        return;
      }

      if (space.wallMeasurements && space.wallMeasurements.length > 0) {
        for (const wall of space.wallMeasurements) {
          const length = parseFloat(wall.length);
          if (!wall.length || wall.length.trim() === "" || !length || length <= 0) {
            toast.error(`${t("step2.fillWalls")} "${space.name}"`);
            return;
          }
        }
      }
    }

    onNext();
  };

  return (
    <div className="space-y-3 md:space-y-6 animate-in fade-in duration-500">
      {/* Add Spaces Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">{t("step2.title")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("step2.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("step2.units")}</span>
              <Select value={unit} onValueChange={(value: "cm" | "in") => handleUnitChange(value)}>
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
              {t("step2.addSpace")}
            </Button>
          </div>
        </div>

        {spaces.length === 0 ? (
          <Card className="p-6 md:p-8 text-center">
            <p className="text-muted-foreground text-sm md:text-base">
              {t("step2.noSpaces")} <span className="font-semibold">+ {t("step2.addSpace")}</span> {t("step2.toBegin")}
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {space.drawingData ? t("step2.drawingCompleted") : t("step2.noDrawing")}
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
              <h3 className="font-semibold text-base md:text-lg mb-4">{t("step2.spaceDetails")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label>{t("step2.spaceName")}</Label>
                  <Input
                    value={spaces.find(s => s.id === activeSpaceId)?.name || ""}
                    onChange={(e) => updateSpace(activeSpaceId, "name", e.target.value)}
                    placeholder="Space 1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("step2.ceilingHeight")} ({unit}) *</Label>
                  <Input
                    type="number"
                    value={spaces.find(s => s.id === activeSpaceId)?.ceilingHeight || ""}
                    onChange={(e) => {
                      const value = Math.max(0, parseFloat(e.target.value) || 0);
                      updateSpace(activeSpaceId, "ceilingHeight", value.toString());
                    }}
                    placeholder={unit === "cm" ? "244" : "96"}
                    min="0"
                    step="1"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {t("step2.activeSpace")}: {spaces.find(s => s.id === activeSpaceId)?.name || ""}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSpace(activeSpaceId)}
                  className="w-full md:w-auto text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("step2.deleteSpace")}
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
                <h3 className="font-semibold text-base md:text-lg mb-2">{t("step2.photosTitle")}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-4">
                  {t("step2.photosDesc")}
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
                    <p className="font-medium text-sm md:text-base">{t("step2.uploadClick")}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {t("step2.uploadSize")}
                    </p>
                  </div>
                </Label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{files.length} {t("step2.filesSelected")}</p>
                  {files.map((file, index) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {file.file.type.startsWith('image/') ? (
                            <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                            <span>•</span>
                            <span className={`capitalize ${file.uploadStatus === 'success' ? 'text-green-600' :
                              file.uploadStatus === 'error' ? 'text-red-600' :
                                'text-blue-600'
                              }`}>
                              {file.uploadStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.uploadStatus === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                        {file.uploadStatus === "success" && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {file.uploadStatus === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="ml-2 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2">{t("step2.storagePriorities")}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-4">
                  {t("step2.storageTap")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3">
                {priorityKeys.map((priority) => (
                  <Button
                    key={priority}
                    onClick={() => togglePriority(priority)}
                    type="button"
                    className={getPriorityColor(priority)}
                  >
                    {t(`step2.${priority}`)}
                    {storagePriorities.indexOf(priority) === 0 && " (1st)"}
                    {storagePriorities.indexOf(priority) === 1 && " (2nd)"}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("step2.additionalNotes")}</Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder={t("step2.notesPlaceholder")}
              rows={4}
            />
          </div>
        </>
      )}

      {/* Spacer for floating buttons */}
      <div className="h-20" />

      {/* Floating Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50">
        <div className="max-w-5xl mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
            className="animate-pulse"
          >
            {t("nav.back")}
          </Button>
          <Button
            onClick={handleNext}
            size="lg"
            className={`px-8 ${isFormValid() ? 'animate-pulse' : ''}`}
            disabled={!isFormValid()}
          >
            {t("nav.next")}
          </Button>
        </div>
      </div>
    </div>
  );
};
