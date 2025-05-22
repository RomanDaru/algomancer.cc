/**
 * Input sanitization utilities for security and data consistency
 */

// HTML entities to escape for XSS prevention
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
  "=": "&#x3D;",
};

// Characters that should be removed from usernames
const USERNAME_FORBIDDEN_CHARS = /[^a-zA-Z0-9_-]/g;

// Characters that should be removed from names (allow letters, spaces, hyphens, apostrophes)
const NAME_ALLOWED_CHARS = /[^a-zA-Z\s\-']/g;

/**
 * Escape HTML entities to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  if (!text) return "";

  return text.replace(/[&<>"'`=/]/g, (match) => HTML_ENTITIES[match] || match);
}

/**
 * Remove HTML tags from input
 */
export function stripHtml(text: string): string {
  if (!text) return "";

  // Remove script tags and their content first
  let result = text.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove all other HTML tags
  result = result.replace(/<[^>]*>/g, "");

  return result;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  return email
    .trim() // Remove whitespace
    .toLowerCase() // Normalize case
    .replace(/\s+/g, "") // Remove any internal spaces
    .replace(/\.{2,}/g, ".") // Replace multiple dots with single dot
    .substring(0, 254); // Limit length
}

/**
 * Sanitize username input
 */
export function sanitizeUsername(username: string): string {
  if (!username) return "";

  return username
    .trim() // Remove whitespace
    .replace(USERNAME_FORBIDDEN_CHARS, "") // Remove forbidden characters
    .replace(/^[-_]+|[-_]+$/g, "") // Remove leading/trailing hyphens and underscores
    .replace(/[-_]{2,}/g, "_") // Replace multiple consecutive hyphens/underscores with single underscore
    .substring(0, 20); // Limit length
}

/**
 * Sanitize name input (first name, last name, display name)
 */
export function sanitizeName(name: string): string {
  if (!name) return "";

  return name
    .trim() // Remove whitespace
    .replace(NAME_ALLOWED_CHARS, "") // Remove forbidden characters
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/^[-'\s]+|[-'\s]+$/g, "") // Remove leading/trailing special chars
    .substring(0, 100); // Limit length
}

/**
 * Sanitize general text input (descriptions, etc.)
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text) return "";

  return stripHtml(text)
    .trim() // Remove whitespace
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .substring(0, maxLength); // Limit length
}

/**
 * Comprehensive input sanitization for user registration
 */
export interface SanitizedUserInput {
  name: string;
  username: string;
  email: string;
  // Note: passwords should NOT be sanitized as it changes the user's intended input
}

export function sanitizeUserRegistration(input: {
  name?: string;
  username?: string;
  email?: string;
}): SanitizedUserInput {
  return {
    name: sanitizeName(input.name || ""),
    username: sanitizeUsername(input.username || ""),
    email: sanitizeEmail(input.email || ""),
  };
}

/**
 * Validate that sanitized input is still valid after cleaning
 */
export function validateSanitizedInput(
  original: string,
  sanitized: string
): {
  isValid: boolean;
  error?: string;
} {
  // Check if sanitization removed too much content
  if (original.trim() && !sanitized) {
    return {
      isValid: false,
      error: "Input contains invalid characters and cannot be processed",
    };
  }

  // Check if sanitization significantly changed the input
  const originalCleaned = original.trim().toLowerCase().replace(/\s+/g, "");
  const sanitizedCleaned = sanitized.toLowerCase().replace(/\s+/g, "");

  // For emails, be very strict about changes
  if (originalCleaned.includes("@")) {
    // Check if the email structure was significantly altered
    const originalParts = originalCleaned.split("@");
    const sanitizedParts = sanitizedCleaned.split("@");

    if (originalParts.length !== 2 || sanitizedParts.length !== 2) {
      return {
        isValid: false,
        error: "Invalid email format",
      };
    }

    // Check if sanitization removed important characters
    if (
      originalCleaned.includes("#") ||
      originalCleaned.includes("$") ||
      originalCleaned.includes("%") ||
      originalCleaned.includes("&")
    ) {
      return {
        isValid: false,
        error: "Email contains invalid characters",
      };
    }
  }

  // For usernames, be strict about changes
  if (
    originalCleaned.match(/^[a-zA-Z0-9_-]+$/) &&
    originalCleaned !== sanitizedCleaned
  ) {
    return {
      isValid: false,
      error: "Input contains invalid characters",
    };
  }

  return { isValid: true };
}

/**
 * Safe sanitization that returns validation errors if input is too modified
 */
export function safeSanitizeEmail(email: string): {
  sanitized: string;
  isValid: boolean;
  error?: string;
} {
  const sanitized = sanitizeEmail(email);
  const validation = validateSanitizedInput(email, sanitized);

  return {
    sanitized,
    isValid: validation.isValid,
    error: validation.error,
  };
}

export function safeSanitizeUsername(username: string): {
  sanitized: string;
  isValid: boolean;
  error?: string;
} {
  const sanitized = sanitizeUsername(username);
  const validation = validateSanitizedInput(username, sanitized);

  return {
    sanitized,
    isValid: validation.isValid,
    error: validation.error,
  };
}

export function safeSanitizeName(name: string): {
  sanitized: string;
  isValid: boolean;
  error?: string;
} {
  const sanitized = sanitizeName(name);
  const validation = validateSanitizedInput(name, sanitized);

  return {
    sanitized,
    isValid: validation.isValid,
    error: validation.error,
  };
}

/**
 * Utility to check if a string contains potentially dangerous content
 */
export function containsSuspiciousContent(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i, // Script tags
    /javascript:/i, // JavaScript protocol
    /on\w+\s*=/i, // Event handlers
    /data:text\/html/i, // Data URLs
    /vbscript:/i, // VBScript
    /expression\s*\(/i, // CSS expressions
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}
