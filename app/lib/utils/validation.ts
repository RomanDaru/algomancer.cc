// Password validation utility
export interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-4 (weak to strong)
  feedback: string[];
  strength: "weak" | "fair" | "good" | "strong";
}

export interface EmailValidation {
  isValid: boolean;
  error?: string;
}

export interface UsernameValidation {
  isValid: boolean;
  error?: string;
}

// Common weak passwords to avoid
const COMMON_PASSWORDS = [
  "password",
  "123456",
  "123456789",
  "qwerty",
  "abc123",
  "password123",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "1234567890",
  "password1",
  "qwerty123",
  "welcome123",
  "admin123",
  "user",
  "guest",
  "test",
  "weak",
];

// Reserved usernames that shouldn't be allowed
const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "root",
  "user",
  "guest",
  "test",
  "api",
  "www",
  "mail",
  "email",
  "support",
  "help",
  "info",
  "contact",
  "about",
  "blog",
  "news",
  "forum",
  "shop",
  "store",
  "app",
  "mobile",
  "web",
  "site",
  "algomancer",
  "algomancy",
  "moderator",
  "mod",
  "staff",
  "team",
];

export function validatePassword(password: string): PasswordValidation {
  const feedback: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < 8) {
    feedback.push("Password must be at least 8 characters long");
  } else {
    score += 1;
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    feedback.push("Password must contain at least one uppercase letter");
  } else {
    score += 1;
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    feedback.push("Password must contain at least one lowercase letter");
  } else {
    score += 1;
  }

  // Check for number
  if (!/\d/.test(password)) {
    feedback.push("Password must contain at least one number");
  } else {
    score += 1;
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    feedback.push("This password is too common, please choose a different one");
    score = 0; // Set score to 0 for common passwords
  }

  // Bonus points for length
  if (password.length >= 12 && score > 0) {
    score += 1;
  }

  // Determine strength
  let strength: "weak" | "fair" | "good" | "strong";
  if (score <= 1) {
    strength = "weak";
  } else if (score <= 2) {
    strength = "fair";
  } else if (score <= 3) {
    strength = "good";
  } else {
    strength = "strong";
  }

  return {
    isValid: feedback.length === 0,
    score: Math.min(4, score),
    feedback,
    strength,
  };
}

export function validateEmail(email: string): EmailValidation {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return { isValid: false, error: "Email is required" };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  // Check email length
  if (email.length > 254) {
    return { isValid: false, error: "Email address is too long" };
  }

  // Check for valid domain format
  const domain = email.split("@")[1];
  if (!domain || domain.length < 2) {
    return { isValid: false, error: "Please enter a valid email domain" };
  }

  // Check for consecutive dots
  if (email.includes("..")) {
    return {
      isValid: false,
      error: "Email address cannot contain consecutive dots",
    };
  }

  return { isValid: true };
}

export function validateUsername(username: string): UsernameValidation {
  if (!username) {
    return { isValid: true }; // Username is optional
  }

  // Check length
  if (username.length < 3) {
    return {
      isValid: false,
      error: "Username must be at least 3 characters long",
    };
  }

  if (username.length > 20) {
    return {
      isValid: false,
      error: "Username must be no more than 20 characters long",
    };
  }

  // Check format (alphanumeric, underscore, hyphen only)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      error:
        "Username can only contain letters, numbers, underscores, and hyphens",
    };
  }

  // Check if it starts/ends with underscore or hyphen
  if (
    username.startsWith("_") ||
    username.startsWith("-") ||
    username.endsWith("_") ||
    username.endsWith("-")
  ) {
    return {
      isValid: false,
      error: "Username cannot start or end with underscore or hyphen",
    };
  }

  // Check against reserved usernames
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return {
      isValid: false,
      error: "This username is reserved, please choose another",
    };
  }

  return { isValid: true };
}

// Utility function to get password strength color
export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case "weak":
      return "text-red-500";
    case "fair":
      return "text-yellow-500";
    case "good":
      return "text-blue-500";
    case "strong":
      return "text-green-500";
    default:
      return "text-gray-500";
  }
}

// Utility function to get password strength background color for progress bar
export function getPasswordStrengthBgColor(strength: string): string {
  switch (strength) {
    case "weak":
      return "bg-red-500";
    case "fair":
      return "bg-yellow-500";
    case "good":
      return "bg-blue-500";
    case "strong":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}
