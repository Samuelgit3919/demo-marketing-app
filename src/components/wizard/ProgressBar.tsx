import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const getStepColor = (index: number) => {
    switch (index) {
      case 0: return "bg-red-500";
      case 1: return "bg-yellow-500";
      case 2: return "bg-green-500";
      default: return "bg-primary";
    }
  };

  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between mb-4 gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "flex-1 h-2 rounded-full transition-all duration-500",
              index <= currentStep ? getStepColor(index) : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};
