export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  error?: string;
}

export function validatePhoneNumber(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required.' };
  }

  // Remove spaces, hyphens, and parenthesis
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Must begin with + and country code, then 7 to 15 digits (E.164 standard)
  const e164Regex = /^\+[1-9]\d{7,14}$/;

  if (!e164Regex.test(cleaned)) {
    return {
      isValid: false,
      error: `Invalid phone number format "${phone}". Must be in international E.164 format starting with '+' and country code (e.g. +917841070875 or +14155552671).`
    };
  }

  return {
    isValid: true,
    formatted: cleaned
  };
}
