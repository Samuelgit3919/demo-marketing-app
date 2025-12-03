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

  // Validate postal/zip: US (5 digits) or Canadian (A1A1A1 format)
  const validatePostalCode = (code: string) => {
    const cleaned = code.replace(/\s|-/g, '').toUpperCase();
    // US ZIP: exactly 5 digits
    const usZip = /^\d{5}$/;
    // Canadian postal: exactly 6 chars in format LETTER-DIGIT-LETTER-DIGIT-LETTER-DIGIT (e.g., H4W2H8)
    const canadianPostal = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
    return usZip.test(cleaned) || canadianPostal.test(cleaned);
  };

  // Check if form is valid (phone is optional)
  const isFormValid = () => {
    const phoneValid = formData.phone.trim() === '' || validatePhone(formData.phone);
    return (
      formData.fullName.trim() !== '' &&
      formData.email.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      phoneValid &&
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
    if (formData.phone.trim() !== '' && !validatePhone(formData.phone)) {
      newErrors.phone = "Phone must contain exactly 10 digits";
    }
    if (!validatePostalCode(formData.postalCode)) {
      newErrors.postalCode = "Enter a valid US or Canadian postal code";
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
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="5551234567"
            className={`h-12 ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        </div>

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
                postalCode: validatePostalCode(cleaned)
                  ? ""
                  : "Enter a valid US or Canadian postal code",
              });
            }}
            required
            placeholder="12345 or H4W2H8"
            className={`h-12 ${errors.postalCode ? 'border-red-500' : ''}`}
            maxLength={6}
          />
          {errors.postalCode && <p className="text-xs text-red-500">{errors.postalCode}</p>}
        </div>
      </div>

      {/* Spacer for floating button */}
      <div className="h-20" />

      {/* Floating Navigation Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50">
        <div className="max-w-5xl mx-auto flex justify-end">
          <Button
            type="submit"
            size="lg"
            className={`px-8 ${isFormValid() ? 'animate-pulse' : ''}`}
            disabled={!isFormValid()}
          >
            Next
          </Button>
        </div>
      </div>
    </form>
  );
};
