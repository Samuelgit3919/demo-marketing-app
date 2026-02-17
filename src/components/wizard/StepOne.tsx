import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

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

  // Validate name: at least 2 letters
  const validateName = (name: string) => {
    return name.trim().length >= 3 && /^[a-zA-Z\s]+$/.test(name);
  };

  // Validate email: must have @ and a valid domain extension
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
  };

  // Check if form is valid (phone is optional but if provided must be 10 digits)
  const isFormValid = () => {
    const phoneValid = formData.phone.trim() === '' || validatePhone(formData.phone);
    return (
      validateName(formData.fullName) &&
      validateEmail(formData.email) &&
      phoneValid &&
      validatePostalCode(formData.postalCode)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!validateName(formData.fullName)) {
      newErrors.fullName = t("step1.nameError");
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = t("step1.emailError");
    }
    if (formData.phone.trim() !== '' && !validatePhone(formData.phone)) {
      newErrors.phone = t("step1.phoneError");
    }
    if (!validatePostalCode(formData.postalCode)) {
      newErrors.postalCode = t("step1.postalError");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onNext();
  };

  // Validate on change and show inline errors
  const handleInputChange = (field: string, value: string) => {
    // For phone, only allow numbers and limit to 10 digits
    if (field === 'phone') {
      const numbersOnly = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData({ ...formData, [field]: numbersOnly });

      // Inline validation
      const newErrors = { ...errors };
      newErrors.phone = numbersOnly.length > 0 && numbersOnly.length !== 10 ? t("step1.phoneError") : "";
      setErrors(newErrors);
      return;
    }

    setFormData({ ...formData, [field]: value });
    const newErrors = { ...errors };
    if (field === 'fullName') {
      newErrors.fullName = value.trim().length > 0 && !validateName(value) ? t("step1.nameError") : "";
    } else if (field === 'email') {
      newErrors.email = value.trim().length > 0 && !validateEmail(value) ? t("step1.emailError") : "";
    }
    setErrors(newErrors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">{t("step1.title")}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("step1.name")}</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            required
            placeholder={t("step1.namePlaceholder")}
            className={`h-12 ${errors.fullName ? 'border-red-500' : ''}`}
          />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("step1.email")}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            placeholder={t("step1.emailPlaceholder")}
            className={`h-12 ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("step1.phone")}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder={t("step1.phonePlaceholder")}
            className={`h-12 ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">{t("step1.postal")}</Label>
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
                  : t("step1.postalError"),
              });
            }}
            required
            placeholder={t("step1.postalPlaceholder")}
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
            {t("nav.next")}
          </Button>
        </div>
      </div>
    </form>
  );
};
