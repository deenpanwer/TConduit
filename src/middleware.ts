import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://www.traconomics.com'
    ];
    
    const requestOrigin = request.headers.get('origin');
    const isAllowedOrigin = requestOrigin && allowedOrigins.includes(requestOrigin);

    // Handle preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? requestOrigin : '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Max-Age', '86400');
      return response;
    }
  }

  const session = request.cookies.get('trac_auth_session');
  const { search } = request.nextUrl;

  // 1. Only protect the dashboard root and its sub-pages
  // We explicitly EXCLUDE login and signup from protection
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/forgot-password') || pathname.startsWith('/api/employee/analyze');  
  const isScannerPage = pathname.includes('/pos/remote-scan');
  const isProtectedPage = (pathname.startsWith('/ems') || pathname.startsWith('/crm') || pathname.startsWith('/pos') || pathname.startsWith('/tasks') || pathname === '/dashboard') && !isScannerPage;

  if (isProtectedPage && !isAuthPage) {
    if (!session || !session.value) {
      const loginUrl = new URL('/ems/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Add CORS headers to API responses
  if (pathname.startsWith('/api/')) {
    const requestOrigin = request.headers.get('origin');
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://www.traconomics.com'
    ];
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  // 2. Kill cache ONLY for protected pages
  if (isProtectedPage && !isAuthPage) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/ems/:path*', 
    '/crm/:path*', 
    '/pos/:path*', 
    '/tasks/:path*', 
    '/dashboard', 
    '/yc'
  ],
};