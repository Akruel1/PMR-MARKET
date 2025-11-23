import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add ngrok skip browser warning header to bypass ngrok warning page
  // This is needed for OAuth callbacks to work properly through ngrok
  if (request.headers.get('host')?.includes('ngrok-free.dev') || 
      request.headers.get('host')?.includes('ngrok.io')) {
    response.headers.set('ngrok-skip-browser-warning', 'true');
  }

  // Set cookies for session management and preferences
  // These are essential cookies that are set by NextAuth and the application
  const cookieConsent = request.cookies.get('cookieConsent')?.value;

  // Only set non-essential cookies if user has consented
  if (cookieConsent === 'accepted') {
    // Set analytics or preference cookies here if needed
    // For now, we're using NextAuth cookies which are essential
  }

  // Set SameSite attribute for cookies for better security
  // This is handled by NextAuth automatically, but we can add custom logic here

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






