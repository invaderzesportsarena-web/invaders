/**
 * Enhanced security validation utilities
 * Provides client-side validation with security-focused checks
 */

// Enhanced phone number validation for Pakistani numbers
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces and special characters except + and digits
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Pakistani phone number formats
  const patterns = [
    /^\+92[0-9]{10}$/,     // +92XXXXXXXXXX
    /^0[0-9]{10}$/,        // 0XXXXXXXXXX
    /^03[0-9]{9}$/,        // 03XXXXXXXXX (mobile)
  ];

  const isValid = patterns.some(pattern => pattern.test(cleanPhone));
  
  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Invalid phone number. Use Pakistani format: +92XXXXXXXXXX or 03XXXXXXXXX' 
    };
  }

  return { isValid: true };
};

// Enhanced financial amount validation
export const validateFinancialAmount = (
  amount: string | number, 
  type: 'zcreds' | 'pkr',
  min?: number,
  max?: number
): { isValid: boolean; error?: string } => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (numAmount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }

  // Check decimal places (max 2)
  const decimalPlaces = amount.toString().split('.')[1]?.length || 0;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Amount cannot have more than 2 decimal places' };
  }

  // No maximum limits enforced

  // Custom min/max validation
  if (min !== undefined && numAmount < min) {
    return { isValid: false, error: `Minimum amount is ${min}` };
  }

  if (max !== undefined && numAmount > max) {
    return { isValid: false, error: `Maximum amount is ${max}` };
  }

  return { isValid: true };
};

// Username validation with security considerations
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username || username.trim() === '') {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmed = username.trim().toLowerCase();

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: 'Username cannot exceed 30 characters' };
  }

  // Only alphanumeric and underscore allowed
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  // Check for reserved/inappropriate usernames
  const reservedUsernames = [
    'admin', 'administrator', 'root', 'system', 'null', 'undefined',
    'api', 'www', 'ftp', 'mail', 'email', 'support', 'help',
    'test', 'guest', 'user', 'demo', 'sample'
  ];

  if (reservedUsernames.includes(trimmed)) {
    return { isValid: false, error: 'This username is reserved. Please choose another one.' };
  }

  return { isValid: true };
};

// Text input sanitization and validation
export const validateAndSanitizeText = (
  text: string, 
  fieldName: string,
  minLength: number = 0,
  maxLength: number = 500
): { isValid: boolean; sanitized: string; error?: string } => {
  if (!text) {
    return { 
      isValid: minLength === 0, 
      sanitized: '', 
      error: minLength > 0 ? `${fieldName} is required` : undefined 
    };
  }

  // Remove potential XSS characters
  let sanitized = text
    .replace(/[<>\"';&]/g, '')  // Remove XSS chars
    .replace(/\s+/g, ' ')       // Normalize whitespace
    .trim();

  if (sanitized.length < minLength) {
    return { 
      isValid: false, 
      sanitized, 
      error: `${fieldName} must be at least ${minLength} characters long` 
    };
  }

  if (sanitized.length > maxLength) {
    return { 
      isValid: false, 
      sanitized: sanitized.substring(0, maxLength), 
      error: `${fieldName} cannot exceed ${maxLength} characters` 
    };
  }

  return { isValid: true, sanitized };
};

// Account number validation (basic format check)
export const validateAccountNumber = (accountNumber: string): { isValid: boolean; error?: string } => {
  if (!accountNumber || accountNumber.trim() === '') {
    return { isValid: false, error: 'Account number is required' };
  }

  const cleaned = accountNumber.replace(/[\s\-]/g, '');

  if (!/^[0-9]+$/.test(cleaned)) {
    return { isValid: false, error: 'Account number can only contain digits' };
  }

  if (cleaned.length < 8 || cleaned.length > 20) {
    return { isValid: false, error: 'Account number must be between 8 and 20 digits' };
  }

  return { isValid: true };
};

// IBAN validation (basic Pakistani format)
export const validateIBAN = (iban: string): { isValid: boolean; error?: string } => {
  if (!iban || iban.trim() === '') {
    return { isValid: true }; // IBAN is optional
  }

  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Basic Pakistani IBAN format: PK followed by 22 characters
  if (!/^PK[0-9]{2}[A-Z0-9]{4}[0-9]{16}$/.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'Invalid IBAN format. Pakistani IBAN should be: PK##BANK################' 
    };
  }

  return { isValid: true };
};

// Password strength validation
export const validatePasswordStrength = (password: string): { 
  isValid: boolean; 
  score: number; 
  feedback: string[];
  error?: string;
} => {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { isValid: false, score: 0, feedback: [], error: 'Password is required' };
  }

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers');
  } else {
    score += 1;
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Add special characters (!@#$%^&*)');
  } else {
    score += 1;
  }

  const isValid = score >= 3 && password.length >= 8;

  return {
    isValid,
    score,
    feedback,
    error: !isValid ? 'Password does not meet security requirements' : undefined
  };
};

// Rate limiting check (client-side helper)
export const checkRateLimit = (key: string, maxAttempts: number, windowMs: number): boolean => {
  const now = Date.now();
  const storageKey = `rateLimit_${key}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      localStorage.setItem(storageKey, JSON.stringify({ attempts: 1, firstAttempt: now }));
      return true;
    }

    const data = JSON.parse(stored);
    
    // Reset if window has passed
    if (now - data.firstAttempt > windowMs) {
      localStorage.setItem(storageKey, JSON.stringify({ attempts: 1, firstAttempt: now }));
      return true;
    }

    // Check if limit exceeded
    if (data.attempts >= maxAttempts) {
      return false;
    }

    // Increment attempts
    localStorage.setItem(storageKey, JSON.stringify({ 
      attempts: data.attempts + 1, 
      firstAttempt: data.firstAttempt 
    }));
    return true;
  } catch {
    // If localStorage fails, allow the action
    return true;
  }
};