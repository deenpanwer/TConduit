import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We ignore the session check for the demo branch
  // const session = request.cookies.get('trac_auth_session');
  const { pathname } = request.nextUrl;

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

  // REDIRECT BYPASS: Logic commented out to prevent redirection to login
  /*
  if (isProtectedPage && !isAuthPage) {
    if (!session || !session.value) {
      const loginUrl = new URL('/ems/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }
  */

  const response = NextResponse.next();

  // Keep cache killing for consistency in the UI
  if (isProtectedPage && !isAuthPage) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: ['/ems/:path*', '/crm/:path*', '/pos/:path*', '/tasks/:path*', '/dashboard', '/yc'],
};
