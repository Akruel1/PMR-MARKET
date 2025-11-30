import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { setSecurityHeaders, detectSuspiciousActivity, logSuspiciousActivity } from './lib/security';
import { rateLimitConfigs, createRateLimitMiddleware } from './lib/rate-limit';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Проверка на подозрительную активность
  const suspiciousCheck = detectSuspiciousActivity(request);
  if (suspiciousCheck.suspicious) {
    logSuspiciousActivity(request, suspiciousCheck.reasons);
    
    // Блокируем явно вредоносные запросы
    const criticalPatterns = ['union select', 'drop table', '<script'];
    const hasCriticalPattern = suspiciousCheck.reasons.some(reason =>
      criticalPatterns.some(pattern => reason.toLowerCase().includes(pattern))
    );
    
    if (hasCriticalPattern) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  // Rate limiting для API маршрутов
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Более строгие лимиты для аутентификации
    if (request.nextUrl.pathname.includes('/auth/') || 
        request.nextUrl.pathname.includes('/login')) {
      const rateLimitResponse = createRateLimitMiddleware(rateLimitConfigs.auth, 5)(request);
      if (rateLimitResponse) return rateLimitResponse;
    }
    
    // Лимиты для создания контента
    else if (request.method === 'POST' && 
             (request.nextUrl.pathname.includes('/ads') || 
              request.nextUrl.pathname.includes('/messages') ||
              request.nextUrl.pathname.includes('/reports'))) {
      const rateLimitResponse = createRateLimitMiddleware(rateLimitConfigs.create, 10)(request);
      if (rateLimitResponse) return rateLimitResponse;
    }
    
    // Лимиты для загрузки файлов
    else if (request.nextUrl.pathname.includes('/upload')) {
      const rateLimitResponse = createRateLimitMiddleware(rateLimitConfigs.upload, 20)(request);
      if (rateLimitResponse) return rateLimitResponse;
    }
    
    // Общие лимиты для API
    else {
      const rateLimitResponse = createRateLimitMiddleware(rateLimitConfigs.api, 60)(request);
      if (rateLimitResponse) return rateLimitResponse;
    }
  }

  // Add ngrok skip browser warning header to bypass ngrok warning page
  if (request.headers.get('host')?.includes('ngrok-free.dev') || 
      request.headers.get('host')?.includes('ngrok.io')) {
    response.headers.set('ngrok-skip-browser-warning', 'true');
  }

  // Установка безопасных заголовков (включая Permissions Policy)
  setSecurityHeaders(response);

  // Set cookies for session management and preferences
  const cookieConsent = request.cookies.get('cookieConsent')?.value;

  // Only set non-essential cookies if user has consented
  if (cookieConsent === 'accepted') {
    // Set analytics or preference cookies here if needed
  }

  // CSRF токен для форм (кроме GET запросов)
  if (request.method !== 'GET' && !request.nextUrl.pathname.startsWith('/api/auth/')) {
    const csrfToken = request.headers.get('x-csrf-token');
    const cookieToken = request.cookies.get('csrf-token')?.value;
    
    // Для API запросов проверяем CSRF токен
    if (request.nextUrl.pathname.startsWith('/api/') && 
        request.method !== 'GET' && 
        (!csrfToken || csrfToken !== cookieToken)) {
      
      // Исключения для webhook'ов и OAuth
      const exceptions = ['/api/auth/', '/api/telegram/webhook'];
      const isException = exceptions.some(path => request.nextUrl.pathname.startsWith(path));
      
      if (!isException) {
        return new Response(
          JSON.stringify({ error: 'CSRF token missing or invalid' }), 
          { 
            status: 403, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
  // Exclude API routes from middleware
  // This ensures webhook endpoints are not processed by middleware
};






