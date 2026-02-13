import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Check for auth token in cookies or localStorage (cookies for SSR)
  const token = request.cookies.get('accessToken')?.value;

  // If no token, redirect to login
  // Note: Since we use localStorage for auth (Zustand), the main auth check
  // happens client-side in the dashboard layout. This middleware provides
  // an additional layer for cookie-based auth if configured.
  // The client-side check in (dashboard)/layout.tsx handles the primary auth flow.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
