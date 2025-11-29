import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate phone: exactly 10 digits (ignoring spaces/hyphens)
  const validatePhone = (phone: string) => {
    const digitsOnly = phone.replace(/[\s\-]/g, '');
    return digitsOnly.length === 10 && /^\d+$/.test(digitsOnly);
  };

  // Validate postal/zip: 5-6 characters, alphanumeric
  const validatePostalCode = (code: string) => {
    const trimmed = code.replace(/\s/g, '');
    return trimmed.length >= 5 && trimmed.length <= 6 && /^[A-Za-z0-9]+$/.test(trimmed);
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.fullName.trim() !== '' &&
      formData.email.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      validatePhone(formData.phone) &&
      validatePostalCode(formData.postalCode)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Name is required";
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Phone must contain exactly 10 digits";
    }
    if (!validatePostalCode(formData.postalCode)) {
      newErrors.postalCode = "Postal/ZIP must be 5-6 alphanumeric characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onNext();
  };

  // Clear error when user starts typing
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Tell us about you</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            required
            placeholder="John Smith"
            className={`h-12 ${errors.fullName ? 'border-red-500' : ''}`}
          />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            placeholder="john@example.com"
            className={`h-12 ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            required
            placeholder="5551234567"
            className={`h-12 ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        </div>

       {/* Postal Code */}
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal/ZIP *</Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\s|-/g, "").toUpperCase();
              setFormData({ ...formData, postalCode: cleaned });
              setErrors({
                ...errors,
                postal: validatePostal(cleaned)
                  ? ""
                  : "Enter a valid US or Canadian postal code",
              });
            }}
            required
            placeholder="12345 or H4W2H8"
            className={`h-12 ${errors.postal ? "border-red-500" : ""}`}
          />
          {errors.postal && (
            <p className="text-red-500 text-sm">{errors.postal}</p>
          )}
        </div>
      </div>

      {/* Navigation Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          size="lg"
          className={`px-8 ${isFormValid() ? 'animate-pulse' : ''}`}
          disabled={!isFormValid()}
        >
          Next
        </Button>
      </div>
    </form>
  );
};
