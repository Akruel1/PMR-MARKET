/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  
  // Remove HTML tags and dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')
    .trim()
    .slice(0, 10000); // Ограничение длины
}

/**
 * Sanitizes search query - removes HTML but keeps search functionality
 * Allows normal text, numbers, spaces, and common punctuation
 */
export function sanitizeSearchQuery(input: string | undefined | null): string {
  if (!input) return '';
  
  // Remove script tags and other dangerous content
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
  
  // Trim and limit length
  sanitized = sanitized.trim().slice(0, 200);
  
  return sanitized;
}

/**
 * Sanitizes URL parameter - removes dangerous characters
 */
export function sanitizeUrlParam(input: string | undefined | null): string {
  if (!input) return '';
  
  // Only allow alphanumeric, dashes, underscores, and basic punctuation
  return input.replace(/[^a-zA-Z0-9\-_.,]/g, '').slice(0, 100);
}

/**
 * Проверка на SQL инъекции
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /('|(\\')|(;)|(--)|(\|)|(\*)|(%)|(\+)|(=))/,
    /(UNION\s+(ALL\s+)?SELECT)/i,
    /(DROP\s+TABLE)/i,
    /(INSERT\s+INTO)/i,
    /(DELETE\s+FROM)/i,
    /(UPDATE\s+\w+\s+SET)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Проверка на XSS атаки
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi,
    /<[^>]*\s(onerror|onload|onclick|onmouseover)\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Комплексная проверка безопасности ввода
 */
export function validateInputSecurity(input: string): {
  safe: boolean;
  threats: string[];
} {
  const threats: string[] = [];
  
  if (detectSQLInjection(input)) {
    threats.push('SQL Injection');
  }
  
  if (detectXSS(input)) {
    threats.push('XSS');
  }
  
  // Проверка на попытки path traversal
  if (/\.\.[\/\\]/.test(input)) {
    threats.push('Path Traversal');
  }
  
  // Проверка на LDAP инъекции
  if (/[()&|!*]/.test(input) && /[=<>]/.test(input)) {
    threats.push('LDAP Injection');
  }
  
  return {
    safe: threats.length === 0,
    threats
  };
}

/**
 * Безопасная санитизация для поиска
 */
export function sanitizeSearchInput(input: string | undefined | null): string {
  if (!input) return '';
  
  const security = validateInputSecurity(input);
  if (!security.safe) {
    // Если обнаружены угрозы, возвращаем пустую строку
    return '';
  }
  
  return sanitizeSearchQuery(input);
}

