import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface StepOneProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    postalCode: string;
  };
  setFormData: (data: any) => void;
  onNext: () => void;
}

export const StepOne = ({ formData, setFormData, onNext }: StepOneProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Tell us about you</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            placeholder="John Smith"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="john@example.com"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal/ZIP *</Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            required
            placeholder="12345"
            className="h-12"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 md:pt-6">
        <Button type="submit" size="lg" className="w-full sm:w-auto sm:px-8">
          Next
        </Button>
      </div>
    </form>
  );
};
