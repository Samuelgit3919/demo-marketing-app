"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineWidget, useCalendlyEventListener } from "react-calendly";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Pencil, Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StepThreeProps {
  formData: any;
  spaces: any[];
  files: any[]; // UploadedFile[]
  storagePriorities: string[];
  additionalNotes: string;
  onBack: () => void;
  onComplete: () => void;
}

export const StepThree = ({
  formData,
  spaces,
  files,
  storagePriorities,
  additionalNotes,
  onBack,
  onComplete,
}: StepThreeProps) => {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [calendlyEventScheduled, setCalendlyEventScheduled] = useState(false);
  const [calendlyEventUrl, setCalendlyEventUrl] = useState("");
  const [calendlyBookingTime, setCalendlyBookingTime] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedFormData, setEditedFormData] = useState(formData);

  // Sync edited form data
  useEffect(() => {
    setEditedFormData(formData);
  }, [formData]);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Listen to Calendly event (official & reliable way)
  useCalendlyEventListener({
    onEventScheduled: (e) => {
      setCalendlyEventScheduled(true);
      setCalendlyEventUrl(e.data.payload.event.uri);
      setCalendlyBookingTime(new Date().toISOString());
      toast.success(t("step3.meetingScheduledToast"));
    },
  });

  const handleEdit = (field: string) => setEditingField(field);

  const handleSaveEdit = () => {
    Object.assign(formData, editedFormData);
    setEditingField(null);
    toast.success(t("step3.changesSaved"));
  };

  const handleCancelEdit = () => {
    setEditedFormData(formData);
    setEditingField(null);
  };

  const handleFinish = async () => {
    if (!calendlyEventScheduled) {
      toast.error(t("step3.scheduleMeetingFirst"));
      return;
    }

    setSubmitting(true);
    try {
      // Ensure bucket exists (best effort - may fail without admin rights)
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.find(b => b.name === "images");

      if (!bucketExists) {
        await supabase.storage.createBucket("images", {
          public: true, // Assuming public for admin access/images
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ["image/png", "image/jpeg", "application/pdf"],
        }).catch(err => console.warn("Bucket creation failed (likely permissions):", err));
      }

      // Files are already uploaded in Step 2
      const fileUrls: string[] = files
        .filter((f: any) => f.uploadStatus === 'success' && f.filePath)
        .map((f: any) => f.filePath);

      // Insert submission
      const { error: insertError } = await supabase.from("submissions").insert({
        full_name: editedFormData.fullName,
        email: editedFormData.email,
        phone: editedFormData.phone,
        postal_code: editedFormData.postalCode,
        spaces,
        storage_priorities: storagePriorities,
        additional_notes: additionalNotes,
        meeting_link: calendlyEventUrl,
        meeting_date: calendlyBookingTime,
        meeting_platform: "Calendly",
        file_paths: fileUrls,
        status: "pending",
      });

      if (insertError) throw insertError;

      // Send emails
      await supabase.functions
        .invoke("send-submission-emails", {
          body: {
            clientEmail: editedFormData.email,
            clientName: editedFormData.fullName,
            adminEmail: "saminew3919@gmail.com",
            submissionData: {
              fullName: editedFormData.fullName,
              email: editedFormData.email,
              phone: editedFormData.phone,
              postalCode: editedFormData.postalCode,
              spaces,
              storagePriorities,
              additionalNotes,
              calendlyEventUrl,
              calendlyBookingTime: new Date(calendlyBookingTime).toLocaleString(),
            },
          },
        })
        .catch(() => {
          toast.warning(t("step3.emailFailed"));
        });

      toast.success(t("step3.submissionComplete"));
      onComplete();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t("step3.submissionFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // Calendly URL with prefill
  const calendlyUrl = `https://calendly.com/samishambu39/30min`;

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
      <div className="px-1">
        <h2 className="text-xl md:text-2xl font-semibold mb-1 md:mb-2">{t("step3.title")}</h2>
        <p className="text-sm md:text-base text-muted-foreground">{t("step3.subtitle")}</p>
      </div>

      <Card className="p-3 md:p-4">
        <h3 className="font-semibold text-base md:text-lg mb-4 md:mb-6">{t("step3.meetingTitle")}</h3>

        {calendlyEventScheduled ? (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 md:p-8 text-center">
            <div className="text-4xl md:text-6xl mb-3 md:mb-4">✓</div>
            <h4 className="font-semibold text-lg md:text-2xl text-green-900 dark:text-green-100 mb-2 md:mb-3">
              {t("step3.meetingScheduled")}
            </h4>
            <p className="text-sm md:text-base text-green-800 dark:text-green-200 mb-4 md:mb-6 max-w-md mx-auto">
              {t("step3.meetingDesc")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCalendlyEventScheduled(false);
                setCalendlyEventUrl("");
                setCalendlyBookingTime("");
              }}
              className="md:size-default"
            >
              {t("step3.reschedule")}
            </Button>
          </div>
        ) : (
          <>
            {isClient ? (
              <div className="rounded-lg overflow-hidden border">
                <InlineWidget
                  url={calendlyUrl}
                  prefill={{
                    email: formData.email,
                    name: formData.fullName,
                  }}
                  styles={{
                    height: window.innerWidth < 768 ? "500px" : "680px",
                    width: "100%",
                  }}
                />
              </div>
            ) : (
              <div className="h-64 md:h-96 bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center">
                <p className="text-sm md:text-base text-muted-foreground">{t("step3.loadingCalendar")}</p>
              </div>
            )}

            <p className="text-xs md:text-sm text-muted-foreground mt-4 md:mt-6 text-center px-2">
              {t("step3.scheduleBefore")}
            </p>
          </>
        )}
      </Card>

      {/* Submission Summary Card */}
      <Card className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div>
            <h3 className="font-semibold text-lg md:text-xl">{t("step3.summaryTitle")}</h3>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {t("step3.summaryDesc")}
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="hidden md:grid grid-cols-3 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
              <div>{t("step3.field")}</div>
              <div className="col-span-2">{t("step3.value")}</div>
            </div>

            {/* Repeat this pattern for editable fields */}
            {["fullName", "email", "phone", "postalCode"].map((field) => (
              <div key={field} className="flex flex-col md:grid md:grid-cols-3 gap-2 md:gap-4 items-start md:items-center pb-3 md:pb-0 border-b md:border-b-0">
                <div className="text-sm md:text-base font-semibold md:font-medium capitalize text-foreground">
                  {field === "postalCode" ? t("step3.postalCode") :
                    field === "fullName" ? t("step3.fullName") :
                      field === "email" ? t("step3.email") :
                        field === "phone" ? t("step3.phone") : field}
                </div>
                {editingField === field ? (
                  <div className="w-full md:col-span-2 flex gap-2">
                    <Input
                      value={editedFormData[field]}
                      onChange={(e) => setEditedFormData({ ...editedFormData, [field]: e.target.value })}
                      className="text-sm md:text-base"
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="shrink-0 h-9 w-9 md:h-10 md:w-10">
                      <Check className="w-5 h-5 md:w-4 md:h-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="shrink-0 h-9 w-9 md:h-10 md:w-10">
                      <X className="w-5 h-5 md:w-4 md:h-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full md:col-span-2 flex justify-between items-center gap-3">
                    <div className="text-sm md:text-base text-foreground break-all">{editedFormData[field] || "—"}</div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(field)}
                      className="shrink-0 h-8 w-8 md:h-9 md:w-9 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-col md:grid md:grid-cols-3 gap-2 md:gap-4 pt-2">
              <div className="text-sm md:text-base font-semibold md:font-medium text-foreground">{t("step3.spaces")}</div>
              <div className="md:col-span-2 text-sm md:text-base text-foreground">{spaces.length} {t("step3.spaceCount")}</div>
            </div>

            {/* Space Details with Wall Measurements */}
            {spaces.length > 0 && (
              <div className="flex flex-col gap-4 pt-2 border-t">
                <div className="text-sm md:text-base font-semibold text-foreground">{t("step3.spaceDetails")}</div>
                {spaces.map((space, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-muted/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm md:text-base text-foreground">
                          {space.name || `Space ${index + 1}`}
                        </h4>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {space.type} • Ceiling: {space.ceilingHeight || 'N/A'} {space.unit || 'cm'}
                        </p>
                      </div>
                    </div>

                    {/* Space Drawing */}
                    {space.drawingData && (
                      <div className="pt-2 border-t">
                        <p className="text-xs md:text-sm font-semibold text-foreground mb-2">
                          {t("step3.spaceDrawing")}
                        </p>
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <img
                            src={space.drawingData}
                            alt={`Drawing for ${space.name}`}
                            className="w-full h-auto max-h-64 object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* Wall Measurements */}
                    {space.wallMeasurements && space.wallMeasurements.length > 0 && (
                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-xs md:text-sm font-semibold text-foreground">
                          {t("step3.wallMeasurements")} ({space.unit || 'in'})
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {space.wallMeasurements.map((wall: any, wallIndex: number) => (
                            <div key={wallIndex} className="flex items-center gap-1 text-xs md:text-sm">
                              <span className="font-semibold text-primary">{t("step3.wall")} {wall.label}:</span>
                              <span className="text-foreground">{wall.length || '—'} {space.unit || 'in'}</span>
                            </div>
                          ))}
                        </div>

                        {/* Total Perimeter and Area */}
                        {space.totalPerimeter > 0 && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t">
                            <div className="flex items-center gap-1 text-xs md:text-sm">
                              <span className="font-semibold text-muted-foreground">{t("step3.totalPerimeter")}:</span>
                              <span className="font-bold text-primary">
                                {space.totalPerimeter.toFixed(2)} {space.unit || 'in'}
                              </span>
                            </div>
                            {space.totalArea > 0 && (
                              <div className="flex items-center gap-1 text-xs md:text-sm">
                                <span className="font-semibold text-muted-foreground">{t("step3.estimatedArea")}:</span>
                                <span className="font-bold text-primary">
                                  {space.totalArea.toFixed(2)} {space.unit || 'in'}²
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col md:grid md:grid-cols-3 gap-2 md:gap-4">
              <div className="text-sm md:text-base font-semibold md:font-medium text-foreground">{t("step3.storagePriorities")}</div>
              <div className="md:col-span-2 text-sm md:text-base text-foreground">
                {storagePriorities.length ? storagePriorities.map(p => t(`step2.${p.toLowerCase()}`) || p).join(", ") : t("step3.none")}
              </div>
            </div>
            <div className="flex flex-col md:grid md:grid-cols-3 gap-2 md:gap-4">
              <div className="text-sm md:text-base font-semibold md:font-medium text-foreground">{t("step3.files")}</div>
              <div className="md:col-span-2 text-sm md:text-base text-foreground">{files.length} {t("step3.filesUploaded")}</div>
            </div>
            {additionalNotes && (
              <div className="flex flex-col md:grid md:grid-cols-3 gap-2 md:gap-4">
                <div className="text-sm md:text-base font-semibold md:font-medium text-foreground">{t("step3.notes")}</div>
                <div className="md:col-span-2 text-sm md:text-base text-foreground break-words">{additionalNotes}</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Spacer for floating buttons */}
      <div className="h-20" />

      {/* Floating Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50">
        <div className="max-w-5xl mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
            disabled={submitting}
            className="animate-pulse"
          >
            {t("nav.back")}
          </Button>
          <Button
            onClick={handleFinish}
            size="lg"
            className={`px-10 ${calendlyEventScheduled && !submitting ? 'animate-pulse' : ''}`}
            disabled={submitting || !calendlyEventScheduled}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("step3.submitting")}
              </>
            ) : (
              t("step3.submitRequest")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};