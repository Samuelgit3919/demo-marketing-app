import { useState, useEffect } from "react";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { StepOne } from "@/components/wizard/StepOne";
import { StepTwo } from "@/components/wizard/StepTwo";
import { StepThree } from "@/components/wizard/StepThree";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-1 bg-muted rounded-full p-1">
      <Button
        variant={language === "en" ? "default" : "ghost"}
        size="sm"
        className="rounded-full px-3 h-7 text-xs font-semibold"
        onClick={() => setLanguage("en")}
      >
        EN
      </Button>
      <Button
        variant={language === "fr" ? "default" : "ghost"}
        size="sm"
        className="rounded-full px-3 h-7 text-xs font-semibold"
        onClick={() => setLanguage("fr")}
      >
        FR
      </Button>
    </div>
  );
};


export interface UploadedFile {
  file: File;
  id: string;
  preview: string;
  uploadStatus: "pending" | "uploading" | "success" | "error";
  filePath?: string;
}

const WizardContent = () => {
  const { t } = useLanguage();
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

  const [files, setFiles] = useState<UploadedFile[]>([]);

  const [storagePriorities, setStoragePriorities] = useState<string[]>(() => {
    const saved = localStorage.getItem("wizardPriorities");
    return saved ? JSON.parse(saved) : [];
  });

  const [additionalNotes, setAdditionalNotes] = useState(() => {
    const saved = localStorage.getItem("wizardNotes");
    return saved ? saved : "";
  });

  // Auto-save to localStorage
  useEffect(() => { localStorage.setItem("wizardStep", currentStep.toString()); }, [currentStep]);
  useEffect(() => { localStorage.setItem("wizardFormData", JSON.stringify(formData)); }, [formData]);
  useEffect(() => { localStorage.setItem("wizardSpaces", JSON.stringify(spaces)); }, [spaces]);
  useEffect(() => { localStorage.setItem("wizardPriorities", JSON.stringify(storagePriorities)); }, [storagePriorities]);
  useEffect(() => { localStorage.setItem("wizardNotes", additionalNotes); }, [additionalNotes]);

  const handleComplete = () => {
    localStorage.removeItem("wizardStep");
    localStorage.removeItem("wizardFormData");
    localStorage.removeItem("wizardSpaces");
    localStorage.removeItem("wizardPriorities");
    localStorage.removeItem("wizardNotes");
    window.location.href = "/";
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background py-2 md:py-8 px-1 md:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 md:mb-12 px-2">
            <div className="flex justify-end mb-4">
              <LanguageToggle />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">{t("wizard.title")}</h1>
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
                formData={formData}
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
      </div>
    </>
  );
};

const Wizard = () => (
  <LanguageProvider>
    <WizardContent />
  </LanguageProvider>
);

export default Wizard;
