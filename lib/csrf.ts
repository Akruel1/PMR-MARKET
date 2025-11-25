import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from './security';

/**
 * Middleware для установки CSRF токена
 */
export function setCSRFToken(response: NextResponse): NextResponse {
  const token = generateCSRFToken();
  
  response.cookies.set('csrf-token', token, {
    httpOnly: false, // Нужно для доступа из JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 часа
  });
  
  // Также добавляем в заголовок для удобства
  response.headers.set('X-CSRF-Token', token);
  
  return response;
}

/**
 * Проверка CSRF токена в API запросах
 */
export function validateCSRFToken(request: NextRequest): boolean {
  // GET запросы не требуют CSRF токена
  if (request.method === 'GET') {
    return true;
  }
  
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf-token')?.value;
  
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  return headerToken === cookieToken;
}

/**
 * Компонент для получения CSRF токена на клиенте
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => 
    cookie.trim().startsWith('csrf-token=')
  );
  
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}


