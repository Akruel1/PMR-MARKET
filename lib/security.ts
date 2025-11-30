import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from './sanitize';

/**
 * Генерация CSRF токена
 */
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Проверка CSRF токена
 */
export function verifyCSRFToken(request: NextRequest, sessionToken?: string): boolean {
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf-token')?.value;
  
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  return headerToken === cookieToken;
}

/**
 * Установка безопасных заголовков
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com https://accounts.google.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Другие безопасные заголовки
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy - разрешаем микрофон и камеру для звонков
  response.headers.set('Permissions-Policy', 'microphone=(self "*"), camera=(self "*"), geolocation=()');
  
  // HSTS (только для HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}

/**
 * Валидация и санитизация входных данных
 */
export function validateAndSanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return sanitizeInput(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => validateAndSanitizeInput(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = validateAndSanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Проверка подозрительных паттернов в запросе
 */
export function detectSuspiciousActivity(request: NextRequest): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const url = request.url.toLowerCase();
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  
  // Проверка на SQL инъекции в URL
  const sqlPatterns = [
    'union select', 'drop table', 'insert into', 'delete from',
    'update set', 'exec(', 'execute(', 'sp_', 'xp_'
  ];
  
  for (const pattern of sqlPatterns) {
    if (url.includes(pattern)) {
      reasons.push(`SQL injection pattern detected: ${pattern}`);
    }
  }
  
  // Проверка на XSS в URL
  const xssPatterns = [
    '<script', 'javascript:', 'onerror=', 'onload=', 'eval('
  ];
  
  for (const pattern of xssPatterns) {
    if (url.includes(pattern)) {
      reasons.push(`XSS pattern detected: ${pattern}`);
    }
  }
  
  // Проверка на подозрительные User-Agent
  const suspiciousUAPatterns = [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'nessus', 'openvas'
  ];
  
  for (const pattern of suspiciousUAPatterns) {
    if (userAgent.includes(pattern)) {
      reasons.push(`Suspicious user agent: ${pattern}`);
    }
  }
  
  // Проверка на попытки доступа к системным файлам
  const pathTraversalPatterns = [
    '../', '..\\', '/etc/', '/proc/', '/sys/', 'c:\\windows'
  ];
  
  for (const pattern of pathTraversalPatterns) {
    if (url.includes(pattern)) {
      reasons.push(`Path traversal attempt: ${pattern}`);
    }
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons
  };
}

/**
 * Логирование подозрительной активности
 */
export function logSuspiciousActivity(
  request: NextRequest, 
  reasons: string[], 
  additionalInfo?: any
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    ip: request.headers.get('x-forwarded-for') || request.ip,
    userAgent: request.headers.get('user-agent'),
    url: request.url,
    method: request.method,
    reasons,
    additionalInfo,
  };
  
  // В production следует использовать профессиональную систему логирования
  console.warn('🚨 SUSPICIOUS ACTIVITY DETECTED:', JSON.stringify(logData, null, 2));
  
  // Здесь можно добавить отправку в систему мониторинга (Sentry, LogRocket и т.д.)
}

/**
 * Проверка силы пароля (если будет добавлена регистрация по email)
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать строчные буквы');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать заглавные буквы');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать цифры');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Пароль должен содержать специальные символы');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Проверка валидности email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Экранирование HTML для предотвращения XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


