import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('trac_auth_session');
  const { pathname, search } = request.nextUrl;

  // 1. Only protect the dashboard root and its sub-pages
  // We explicitly EXCLUDE login and signup from protection
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/forgot-password') || pathname.startsWith('/api/employee/analyze');  
  const isProtectedPage = false;

  if (isProtectedPage && !isAuthPage) {
    if (!session || !session.value) {
      const loginUrl = new URL('/ems/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // 2. Kill cache ONLY for protected pages
  if (isProtectedPage && !isAuthPage) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: ['/ems/:path*', '/crm/:path*', '/pos/:path*', '/tasks/:path*', '/dashboard', '/yc'],
};