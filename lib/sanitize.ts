/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  
  // Remove HTML tags
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
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

