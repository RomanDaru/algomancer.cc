import {
  validatePassword,
  validateEmail,
  validateUsername,
} from "../validation";

describe("Password Validation", () => {
  test("should accept strong passwords", () => {
    const strongPasswords = [
      "MyPassword123",
      "SecurePass1",
      "GoodPassword2024",
      "AlgomancerRocks1",
    ];

    strongPasswords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(true);
      expect(result.feedback).toHaveLength(0);
      expect(["good", "strong"]).toContain(result.strength);
    });
  });

  test("should reject weak passwords", () => {
    const weakPasswords = [
      "short", // Too short
      "nouppercase1", // No uppercase
      "NOLOWERCASE1", // No lowercase
      "NoNumbers", // No numbers
      "password", // Common password
      "123456", // Common password
      "Password", // Missing number
    ];

    weakPasswords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });

  test("should provide helpful feedback", () => {
    const result = validatePassword("weak");
    expect(result.feedback).toContain(
      "Password must be at least 8 characters long"
    );
    expect(result.feedback).toContain(
      "Password must contain at least one uppercase letter"
    );
    expect(result.feedback).toContain(
      "Password must contain at least one number"
    );
  });

  test("should detect common passwords", () => {
    const result = validatePassword("password123");
    expect(result.isValid).toBe(false);
    expect(result.feedback.some((msg) => msg.includes("too common"))).toBe(
      true
    );
  });

  test("should give bonus for long passwords", () => {
    const shortGood = validatePassword("Password1");
    const longGood = validatePassword("MyVeryLongPassword123");

    expect(longGood.score).toBeGreaterThan(shortGood.score);
  });
});

describe("Email Validation", () => {
  test("should accept valid emails", () => {
    const validEmails = [
      "user@example.com",
      "test.email@domain.co.uk",
      "user+tag@example.org",
      "firstname.lastname@company.com",
      "user123@test-domain.com",
    ];

    validEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  test("should reject invalid emails", () => {
    const invalidEmails = [
      "", // Empty
      "notanemail", // No @ symbol
      "@domain.com", // No local part
      "user@", // No domain
      "user@domain", // No TLD
      "user..double@domain.com", // Consecutive dots
      "user@domain..com", // Consecutive dots in domain
      "a".repeat(255) + "@domain.com", // Too long
    ];

    invalidEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  test("should provide specific error messages", () => {
    expect(validateEmail("").error).toBe("Email is required");
    expect(validateEmail("invalid").error).toBe(
      "Please enter a valid email address"
    );
    expect(validateEmail("user..double@domain.com").error).toBe(
      "Email address cannot contain consecutive dots"
    );
  });
});

describe("Username Validation", () => {
  test("should accept valid usernames", () => {
    const validUsernames = [
      "user123",
      "test_user",
      "my-username",
      "Player1",
      "algomancer_pro",
    ];

    validUsernames.forEach((username) => {
      const result = validateUsername(username);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  test("should accept empty username (optional field)", () => {
    const result = validateUsername("");
    expect(result.isValid).toBe(true);
  });

  test("should reject invalid usernames", () => {
    const invalidUsernames = [
      "ab", // Too short
      "a".repeat(21), // Too long
      "user@name", // Invalid character
      "user name", // Space not allowed
      "user!", // Special character
      "_username", // Starts with underscore
      "username_", // Ends with underscore
      "-username", // Starts with hyphen
      "username-", // Ends with hyphen
      "admin", // Reserved username
      "moderator", // Reserved username
      "algomancer", // Reserved username
    ];

    invalidUsernames.forEach((username) => {
      const result = validateUsername(username);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  test("should provide specific error messages", () => {
    expect(validateUsername("ab").error).toBe(
      "Username must be at least 3 characters long"
    );
    expect(validateUsername("a".repeat(21)).error).toBe(
      "Username must be no more than 20 characters long"
    );
    expect(validateUsername("user@name").error).toBe(
      "Username can only contain letters, numbers, underscores, and hyphens"
    );
    expect(validateUsername("_username").error).toBe(
      "Username cannot start or end with underscore or hyphen"
    );
    expect(validateUsername("admin").error).toBe(
      "This username is reserved, please choose another"
    );
  });
});

describe("Password Strength Scoring", () => {
  test("should score passwords correctly", () => {
    expect(validatePassword("weak").score).toBe(0);
    expect(validatePassword("Secure").score).toBe(2);
    expect(validatePassword("Secure1").score).toBe(3);
    expect(validatePassword("MyLongSecure123").score).toBe(4);
  });

  test("should categorize strength correctly", () => {
    expect(validatePassword("weak").strength).toBe("weak");
    expect(validatePassword("Secure").strength).toBe("fair");
    expect(validatePassword("Secure1").strength).toBe("good");
    expect(validatePassword("MyLongSecure123").strength).toBe("strong");
  });
});
