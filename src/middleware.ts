import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const isAuthPage = 
    pathname.includes('/login') || 
    pathname.includes('/signup') || 
    pathname.includes('/forgot-password') || 
    pathname.startsWith('/api/employee/analyze');  

  const isProtectedPage = 
    pathname.startsWith('/ems') || 
    pathname.startsWith('/crm') || 
    pathname.startsWith('/pos') || 
    pathname.startsWith('/tasks') || 
    pathname === '/dashboard';

  // Only run auth logic if NOT in demo mode
  if (!isDemoMode && isProtectedPage && !isAuthPage) {
    const session = request.cookies.get('trac_auth_session');
    if (!session || !session.value) {
      const loginUrl = new URL('/ems/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  if (isProtectedPage && !isAuthPage) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: ['/ems/:path*', '/crm/:path*', '/pos/:path*', '/tasks/:path*', '/dashboard', '/yc'],
};
