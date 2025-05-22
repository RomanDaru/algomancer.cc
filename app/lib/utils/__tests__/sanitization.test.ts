import {
  escapeHtml,
  stripHtml,
  sanitizeEmail,
  sanitizeUsername,
  sanitizeName,
  sanitizeText,
  sanitizeUserRegistration,
  containsSuspiciousContent,
  safeSanitizeEmail,
  safeSanitizeUsername,
  safeSanitizeName
} from '../sanitization';

describe('HTML Escaping', () => {
  test('should escape HTML entities', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    expect(escapeHtml('Hello & goodbye')).toBe('Hello &amp; goodbye');
    expect(escapeHtml('5 > 3 & 2 < 4')).toBe('5 &gt; 3 &amp; 2 &lt; 4');
  });

  test('should handle empty input', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null as any)).toBe('');
  });
});

describe('HTML Stripping', () => {
  test('should remove HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    expect(stripHtml('<script>alert("xss")</script>Safe text')).toBe('Safe text');
    expect(stripHtml('No HTML here')).toBe('No HTML here');
  });

  test('should handle malformed HTML', () => {
    expect(stripHtml('<p>Unclosed tag')).toBe('Unclosed tag');
    expect(stripHtml('Text with < and > symbols')).toBe('Text with  symbols');
  });
});

describe('Email Sanitization', () => {
  test('should normalize email addresses', () => {
    expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    expect(sanitizeEmail('Test.Email@Domain.Co.UK')).toBe('test.email@domain.co.uk');
    expect(sanitizeEmail('user + spaces@domain.com')).toBe('user+spaces@domain.com');
  });

  test('should fix common email issues', () => {
    expect(sanitizeEmail('user..double@domain.com')).toBe('user.double@domain.com');
    expect(sanitizeEmail('user...triple@domain.com')).toBe('user.triple@domain.com');
  });

  test('should limit email length', () => {
    const longEmail = 'a'.repeat(250) + '@domain.com';
    const result = sanitizeEmail(longEmail);
    expect(result.length).toBeLessThanOrEqual(254);
  });

  test('should handle empty input', () => {
    expect(sanitizeEmail('')).toBe('');
    expect(sanitizeEmail(null as any)).toBe('');
  });
});

describe('Username Sanitization', () => {
  test('should clean usernames', () => {
    expect(sanitizeUsername('  user123  ')).toBe('user123');
    expect(sanitizeUsername('user@#$name')).toBe('username');
    expect(sanitizeUsername('___user___')).toBe('user');
    expect(sanitizeUsername('---user---')).toBe('user');
  });

  test('should handle consecutive special characters', () => {
    expect(sanitizeUsername('user__name')).toBe('user_name');
    expect(sanitizeUsername('user--name')).toBe('user_name');
    expect(sanitizeUsername('user_-_name')).toBe('user_name');
  });

  test('should limit username length', () => {
    const longUsername = 'a'.repeat(30);
    expect(sanitizeUsername(longUsername)).toHaveLength(20);
  });

  test('should handle empty input', () => {
    expect(sanitizeUsername('')).toBe('');
    expect(sanitizeUsername(null as any)).toBe('');
  });
});

describe('Name Sanitization', () => {
  test('should clean names properly', () => {
    expect(sanitizeName('  John Doe  ')).toBe('John Doe');
    expect(sanitizeName("John O'Connor")).toBe("John O'Connor");
    expect(sanitizeName('Mary-Jane Smith')).toBe('Mary-Jane Smith');
    expect(sanitizeName('John123@#$')).toBe('John');
  });

  test('should handle multiple spaces', () => {
    expect(sanitizeName('John    Doe')).toBe('John Doe');
    expect(sanitizeName('   John   Middle   Doe   ')).toBe('John Middle Doe');
  });

  test('should limit name length', () => {
    const longName = 'a'.repeat(150);
    expect(sanitizeName(longName)).toHaveLength(100);
  });
});

describe('Text Sanitization', () => {
  test('should clean general text', () => {
    expect(sanitizeText('<p>Hello world</p>')).toBe('Hello world');
    expect(sanitizeText('  Multiple   spaces  ')).toBe('Multiple spaces');
  });

  test('should respect max length', () => {
    const longText = 'a'.repeat(2000);
    expect(sanitizeText(longText, 500)).toHaveLength(500);
  });
});

describe('User Registration Sanitization', () => {
  test('should sanitize all user fields', () => {
    const input = {
      name: '  John Doe  ',
      username: '  john_doe123  ',
      email: '  JOHN@EXAMPLE.COM  '
    };

    const result = sanitizeUserRegistration(input);

    expect(result.name).toBe('John Doe');
    expect(result.username).toBe('john_doe123');
    expect(result.email).toBe('john@example.com');
  });

  test('should handle missing fields', () => {
    const result = sanitizeUserRegistration({});
    expect(result.name).toBe('');
    expect(result.username).toBe('');
    expect(result.email).toBe('');
  });
});

describe('Suspicious Content Detection', () => {
  test('should detect script tags', () => {
    expect(containsSuspiciousContent('<script>alert("xss")</script>')).toBe(true);
    expect(containsSuspiciousContent('<SCRIPT>alert("xss")</SCRIPT>')).toBe(true);
  });

  test('should detect javascript protocols', () => {
    expect(containsSuspiciousContent('javascript:alert("xss")')).toBe(true);
    expect(containsSuspiciousContent('JAVASCRIPT:alert("xss")')).toBe(true);
  });

  test('should detect event handlers', () => {
    expect(containsSuspiciousContent('onclick=alert("xss")')).toBe(true);
    expect(containsSuspiciousContent('onload = alert("xss")')).toBe(true);
  });

  test('should detect other suspicious patterns', () => {
    expect(containsSuspiciousContent('data:text/html,<script>alert("xss")</script>')).toBe(true);
    expect(containsSuspiciousContent('vbscript:msgbox("xss")')).toBe(true);
    expect(containsSuspiciousContent('expression(alert("xss"))')).toBe(true);
  });

  test('should not flag safe content', () => {
    expect(containsSuspiciousContent('John Doe')).toBe(false);
    expect(containsSuspiciousContent('user@example.com')).toBe(false);
    expect(containsSuspiciousContent('This is safe text')).toBe(false);
  });
});

describe('Safe Sanitization', () => {
  test('should validate email sanitization', () => {
    const result = safeSanitizeEmail('user@example.com');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('user@example.com');
  });

  test('should detect invalid email changes', () => {
    const result = safeSanitizeEmail('user@#$%@domain.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should validate username sanitization', () => {
    const result = safeSanitizeUsername('valid_user123');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('valid_user123');
  });

  test('should detect invalid username changes', () => {
    const result = safeSanitizeUsername('user@#$%name');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should validate name sanitization', () => {
    const result = safeSanitizeName('John Doe');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('John Doe');
  });
});
