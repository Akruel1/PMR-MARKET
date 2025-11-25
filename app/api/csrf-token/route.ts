import { NextRequest, NextResponse } from 'next/server';
import { setCSRFToken } from '@/lib/csrf';

/**
 * Endpoint для получения CSRF токена
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ 
    message: 'CSRF token set',
    token: 'check-cookie' 
  });
  
  return setCSRFToken(response);
}


