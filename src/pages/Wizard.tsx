import { useState, useEffect } from "react";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { StepOne } from "@/components/wizard/StepOne";
import { StepTwo } from "@/components/wizard/StepTwo";
import { StepThree } from "@/components/wizard/StepThree";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Wizard = () => {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem("wizardStep");
    return saved ? parseInt(saved) : 0;
  });

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("wizardFormData");
    return saved ? JSON.parse(saved) : {
      fullName: "",
      email: "",
      phone: "",
      postalCode: "",
    };
  });

  const [spaces, setSpaces] = useState<any[]>(() => {
    const saved = localStorage.getItem("wizardSpaces");
    return saved ? JSON.parse(saved) : [];
  });

  const [files, setFiles] = useState<File[]>([]);

  const [storagePriorities, setStoragePriorities] = useState<string[]>(() => {
    const saved = localStorage.getItem("wizardPriorities");
    return saved ? JSON.parse(saved) : [];
  });

  const [additionalNotes, setAdditionalNotes] = useState(() => {
    const saved = localStorage.getItem("wizardNotes");
    return saved ? saved : "";
  });

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem("wizardStep", currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem("wizardFormData", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem("wizardSpaces", JSON.stringify(spaces));
  }, [spaces]);

  useEffect(() => {
    localStorage.setItem("wizardPriorities", JSON.stringify(storagePriorities));
  }, [storagePriorities]);

  useEffect(() => {
    localStorage.setItem("wizardNotes", additionalNotes);
  }, [additionalNotes]);

  const handleComplete = () => {
    // Clear localStorage on completion
    localStorage.removeItem("wizardStep");
    localStorage.removeItem("wizardFormData");
    localStorage.removeItem("wizardSpaces");
    localStorage.removeItem("wizardPriorities");
    localStorage.removeItem("wizardNotes");
    window.location.href = "/";
  };

  const canGoNext = () => {
    if (currentStep === 0) {
      // Validate Step 1: all fields required with proper format
      const phoneDigits = formData.phone.replace(/[\s-]/g, '');
      const validPhone = phoneDigits.length === 10 && /^\d+$/.test(phoneDigits);
      const validPostal = formData.postalCode.length >= 5 && formData.postalCode.length <= 6;
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      return formData.fullName.trim() && validEmail && validPhone && validPostal;
    }
    if (currentStep === 1) {
      // Validate Step 2: at least one space with required fields filled
      if (spaces.length === 0) return false;

      // Check each space has name, ceiling height, and all wall measurements
      return spaces.every(space => {
        const hasBasicInfo = space.name && space.ceilingHeight && parseFloat(space.ceilingHeight) > 0;
        const hasWallMeasurements = space.wallMeasurements &&
          space.wallMeasurements.length > 0 &&
          space.wallMeasurements.every((wall: any) => wall.length && parseFloat(wall.length) > 0);
        return hasBasicInfo && hasWallMeasurements;
      });
    }
    return true;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background py-2 md:py-8 px-1 md:px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 md:mb-12 px-2">
            <h1 className="text-2xl md:text-4xl font-bold mb-2">Design & Supply — 3 steps Measurement Wizard</h1>
          </div>

          <ProgressBar currentStep={currentStep} totalSteps={3} />

          <Card className="p-2 md:p-8 lg:p-12 shadow-card">
            {currentStep === 0 && (
              <StepOne
                formData={formData}
                setFormData={setFormData}
                onNext={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 1 && (
              <StepTwo
                spaces={spaces}
                setSpaces={setSpaces}
                files={files}
                setFiles={setFiles}
                storagePriorities={storagePriorities}
                setStoragePriorities={setStoragePriorities}
                additionalNotes={additionalNotes}
                setAdditionalNotes={setAdditionalNotes}
                onNext={() => setCurrentStep(2)}
                onBack={() => setCurrentStep(0)}
              />
            )}

            {currentStep === 2 && (
              <StepThree
                formData={formData}
                spaces={spaces}
                files={files}
                storagePriorities={storagePriorities}
                additionalNotes={additionalNotes}
                onBack={() => setCurrentStep(1)}
                onComplete={handleComplete}
              />
            )}
          </Card>
        </div>

        {/* Floating Navigation Buttons */}
        {/* <div className="fixed bottom-0 left-0 right-0 bg-background/95 border-t shadow-lg backdrop-blur-sm z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="animate-pulse"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div className="flex-1" />
            {currentStep < 2 && (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canGoNext()}
                className={canGoNext() ? "animate-pulse" : ""}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div> */}
      </div>
    </>
  );
};

export default Wizard;
