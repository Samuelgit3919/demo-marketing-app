import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InlineWidget } from "react-calendly";
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

  // Editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedFormData, setEditedFormData] = useState(formData);

  // Sync edited form data with original
  useEffect(() => {
    setEditedFormData(formData);
  }, [formData]);

  // Listen for Calendly events
  useEffect(() => {
    const handleCalendlyMessage = (e: MessageEvent) => {
      if (e.data.event && e.data.event === 'calendly.event_scheduled') {
        setCalendlyEventScheduled(true);
        setCalendlyEventUrl(e.data.payload.event.uri || "");
        setCalendlyBookingTime(new Date().toISOString());
        toast.success("Meeting scheduled successfully!");
      }
    };

    window.addEventListener('message', handleCalendlyMessage);
    return () => window.removeEventListener('message', handleCalendlyMessage);
  }, []);

  const handleEdit = (field: string) => {
    setEditingField(field);
  };

  const handleSaveEdit = () => {
    // Update the parent component's form data
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
      toast.error("Please schedule a meeting using Calendly before submitting");
      return;
    }

    setSubmitting(true);
    try {
      // Upload files to storage
      const fileUrls: string[] = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${formData.email}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('submission-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        fileUrls.push(filePath);
      }

      // Create submission record
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          full_name: editedFormData.fullName,
          email: editedFormData.email,
          phone: editedFormData.phone,
          postal_code: editedFormData.postalCode,
          spaces: spaces,
          storage_priorities: storagePriorities,
          additional_notes: additionalNotes,
          calendly_event_url: calendlyEventUrl,
          calendly_booking_time: calendlyBookingTime,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Send confirmation and notification emails
      try {
        const { error: emailError } = await supabase.functions.invoke('send-submission-emails', {
          body: {
            clientEmail: editedFormData.email,
            clientName: editedFormData.fullName,
            adminEmail: 'admin@yourcompany.com',
            submissionData: {
              fullName: editedFormData.fullName,
              email: editedFormData.email,
              phone: editedFormData.phone,
              postalCode: editedFormData.postalCode,
              spaces: spaces,
              storagePriorities: storagePriorities,
              additionalNotes: additionalNotes,
              calendlyEventUrl: calendlyEventUrl,
              calendlyBookingTime: calendlyBookingTime,
            }
          }
        });

        if (emailError) {
          console.error('Email sending error:', emailError);
          toast.warning("Submission saved, but email notifications failed.");
        } else {
          toast.success("Submission complete! Check your email for confirmation.");
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        toast.warning("Submission saved, but email notifications failed.");
      }

      onComplete();
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Schedule Your Free Consultation</h2>
        <p className="text-muted-foreground">
          Book a convenient time for your design consultation using Calendly below.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4">Choose Your Meeting Time</h3>
            {calendlyEventScheduled ? (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">✓</div>
                <h4 className="font-semibold text-lg text-green-900 dark:text-green-100 mb-2">
                  Meeting Scheduled Successfully!
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                  Your consultation has been booked. You can now proceed to submit your design request.
                </p>
                <Button
                  variant="outline"
                  size="sm"
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
              <div className="calendly-inline-widget-container">
                {/* Calendly Inline Embed */}
                <div
                  className="calendly-inline-widget"
                  data-url={`https://calendly.com/saminew3919/30min?email=${encodeURIComponent(
                    formData.email
                  )}&name=${encodeURIComponent(formData.fullName)}`}
                  style={{ minWidth: 320, height: 700 }}
                ></div>

                {/* Calendly Script */}
                <script
                  type="text/javascript"
                  src="https://assets.calendly.com/assets/external/widget.js"
                  async
                />

                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Please schedule a meeting above before proceeding to submit your request.
                </p>
              </div>
            )}

          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Submission Summary</h3>
            <p className="text-sm text-muted-foreground">
              Review your design request details before final submission.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-2 pb-2 border-b">
              <div className="text-sm font-medium text-muted-foreground">Field</div>
              <div className="col-span-2 text-sm font-medium text-muted-foreground">Value</div>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-sm font-medium">Full Name</div>
              {editingField === 'fullName' ? (
                <div className="col-span-2 flex gap-2">
                  <Input
                    value={editedFormData.fullName}
                    onChange={(e) => setEditedFormData({ ...editedFormData, fullName: e.target.value })}
                    className="flex-1"
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-sm">{editedFormData.fullName}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-fit ml-auto"
                    onClick={() => handleEdit('fullName')}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-sm font-medium">Email</div>
              {editingField === 'email' ? (
                <div className="col-span-2 flex gap-2">
                  <Input
                    type="email"
                    value={editedFormData.email}
                    onChange={(e) => setEditedFormData({ ...editedFormData, email: e.target.value })}
                    className="flex-1"
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-sm">{editedFormData.email}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-fit ml-auto"
                    onClick={() => handleEdit('email')}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-sm font-medium">Phone</div>
              {editingField === 'phone' ? (
                <div className="col-span-2 flex gap-2">
                  <Input
                    value={editedFormData.phone}
                    onChange={(e) => setEditedFormData({ ...editedFormData, phone: e.target.value })}
                    className="flex-1"
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-sm">{editedFormData.phone}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-fit ml-auto"
                    onClick={() => handleEdit('phone')}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-sm font-medium">Postal Code</div>
              {editingField === 'postalCode' ? (
                <div className="col-span-2 flex gap-2">
                  <Input
                    value={editedFormData.postalCode}
                    onChange={(e) => setEditedFormData({ ...editedFormData, postalCode: e.target.value })}
                    className="flex-1"
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-sm">{editedFormData.postalCode}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-fit ml-auto"
                    onClick={() => handleEdit('postalCode')}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium">Spaces</div>
              <div className="col-span-2 text-sm">{spaces.length} space(s) designed</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium">Storage Priorities</div>
              <div className="col-span-2 text-sm">
                {storagePriorities.length > 0 ? storagePriorities.join(", ") : "None specified"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium">Files Uploaded</div>
              <div className="col-span-2 text-sm">{files.length} file(s)</div>
            </div>

            {additionalNotes && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">Additional Notes</div>
                <div className="col-span-2 text-sm">{additionalNotes}</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack} size="lg" disabled={submitting}>
          Back
        </Button>
        <Button onClick={handleFinish} size="lg" className="px-8" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Finish"
          )}
        </Button>
      </div>
    </div>
  );
};
