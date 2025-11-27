import { useState } from "react";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { StepOne } from "@/components/wizard/StepOne";
import { StepTwo } from "@/components/wizard/StepTwo";
import { StepThree } from "@/components/wizard/StepThree";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";

const Wizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    postalCode: "",
  });
  const [spaces, setSpaces] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [storagePriorities, setStoragePriorities] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const handleComplete = () => {
    window.location.href = "/";
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#F3F5F7] py-8 px-1 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">Design & Supply — 3 steps Measurement Wizard</h1>
          </div>

          <ProgressBar currentStep={currentStep} totalSteps={3} />

          <Card className="p-4 md:p-12 shadow-card">
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
      </div>
    </>
  );
};

export default Wizard;
