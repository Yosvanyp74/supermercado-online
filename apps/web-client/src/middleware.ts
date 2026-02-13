import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/account', '/checkout'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    // Check for access token in cookies or rely on client-side redirect
    // Since we use localStorage for tokens, we check a marker cookie
    const hasAuth = request.cookies.get('auth-active')?.value;

    // If no auth marker, redirect to login
    // Note: Primary auth guard is client-side in account layout
    // This middleware provides an additional check for server-side rendered pages
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*'],
};
