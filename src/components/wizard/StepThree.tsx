"use client"; // Add this at the top if you're using Next.js App Router

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineWidget, useCalendlyEventListener } from "react-calendly";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Pencil, Check, X } from "lucide-react";

interface StepThreeProps {
  formData: any;
  spaces: any[];
  files: File[];
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
  }, []);

  // Listen to Calendly event (official & reliable way)
  useCalendlyEventListener({
    onEventScheduled: (e) => {
      setCalendlyEventScheduled(true);
      setCalendlyEventUrl(e.data.payload.event.uri);
      setCalendlyBookingTime(new Date().toISOString());
      toast.success("Meeting scheduled successfully!");
    },
  });

  const handleEdit = (field: string) => setEditingField(field);

  const handleSaveEdit = () => {
    Object.assign(formData, editedFormData);
    setEditingField(null);
    toast.success("Changes saved");
  };

  const handleCancelEdit = () => {
    setEditedFormData(formData);
    setEditingField(null);
  };

  const handleFinish = async () => {
    if (!calendlyEventScheduled) {
      toast.error("Please schedule a meeting before submitting");
      return;
    }

    setSubmitting(true);
    try {
      // Upload files
      const fileUrls: string[] = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${formData.email}/${fileName}`;

        const { error } = await supabase.storage
          .from('submission-files')
          .upload(filePath, file);

        if (error) throw error;
        fileUrls.push(filePath);
      }

      // Insert submission
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          full_name: editedFormData.fullName,
          email: editedFormData.email,
          phone: editedFormData.phone,
          postal_code: editedFormData.postalCode,
          spaces,
          storage_priorities: storagePriorities,
          additional_notes: additionalNotes,
          calendly_event_url: calendlyEventUrl,
          calendly_booking_time: calendlyBookingTime,
          file_paths: fileUrls,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Send emails
      await supabase.functions.invoke('send-submission-emails', {
        body: {
          clientEmail: editedFormData.email,
          clientName: editedFormData.fullName,
          adminEmail: 'admin@yourcompany.com',
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
          }
        }
      }).catch(() => {
        toast.warning("Submission saved, but email failed to send.");
      });

      toast.success("Submission complete! Check your email for confirmation.");
      onComplete();
    } catch (error) {
      console.error(error);
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Calendly URL with prefill
  const calendlyUrl = `https://calendly.com/saminew3919/30min`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Schedule Your Free Consultation</h2>
        <p className="text-muted-foreground">
          Book a convenient time for your design consultation below.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Choose Your Meeting Time</h3>

        {calendlyEventScheduled ? (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">Checkmark</div>
            <h4 className="font-semibold text-2xl text-green-900 dark:text-green-100 mb-3">
              Meeting Scheduled Successfully!
            </h4>
            <p className="text-green-800 dark:text-green-200 mb-6 max-w-md mx-auto">
              Your consultation has been booked. You can now submit your design request.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setCalendlyEventScheduled(false);
                setCalendlyEventUrl("");
                setCalendlyBookingTime("");
              }}
            >
              Reschedule Meeting
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
                    height: "680px",
                    width: "100%",
                  }}
                />
              </div>
            ) : (
              <div className="h-96 bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Loading calendar...</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-6 text-center">
              Please schedule a meeting above before submitting your request.
            </p>
          </>
        )}
      </Card>

      {/* Submission Summary Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Submission Summary</h3>
            <p className="text-sm text-muted-foreground">
              Review your details. You can edit any field before submitting.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
              <div>Field</div>
              <div className="col-span-2">Value</div>
            </div>

            {/* Repeat this pattern for editable fields */}
            {['fullName', 'email', 'phone', 'postalCode'].map((field) => (
              <div key={field} className="grid grid-cols-3 gap-4 items-center">
                <div className="text-sm font-medium capitalize">
                  {field === 'postalCode' ? 'Postal Code' : field.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                {editingField === field ? (
                  <div className="col-span-2 flex gap-2">
                    <Input
                      value={editedFormData[field]}
                      onChange={(e) => setEditedFormData({ ...editedFormData, [field]: e.target.value })}
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-sm">{editedFormData[field] || "—"}</div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(field)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm font-medium">Spaces</div>
              <div className="col-span-2 text-sm">{spaces.length} space(s)</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm font-medium">Storage Priorities</div>
              <div className="col-span-2 text-sm">
                {storagePriorities.length ? storagePriorities.join(", ") : "None"}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm font-medium">Files</div>
              <div className="col-span-2 text-sm">{files.length} file(s) uploaded</div>
            </div>
            {additionalNotes && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium">Notes</div>
                <div className="col-span-2 text-sm">{additionalNotes}</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-8">
        <Button variant="outline" onClick={onBack} size="lg" disabled={submitting}>
          Back
        </Button>
        <Button
          onClick={handleFinish}
          size="lg"
          className="px-10"
          disabled={submitting || !calendlyEventScheduled}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Request"
          )}
        </Button>
      </div>
    </div>
  );
};