import { NextRequest, NextResponse } from 'next/server';

const ROLE_PATHS: Record<string, string> = {
  admin: '/admin',
  volunteer: '/volunteer',
  participant: '/participant',
};

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const role = request.cookies.get('user-role')?.value;
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // No session cookie → public user
  if (!session) {
    if (isAuthRoute) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Session exists but role cookie is missing or empty → clear and redirect
  if (!role || !ROLE_PATHS[role]) {
    if (isAuthRoute) return NextResponse.next();
    // Role cookie missing — could be corrupted state; let the user re-login
    const resp = NextResponse.redirect(new URL('/login', request.url));
    resp.cookies.delete('session');
    resp.cookies.delete('user-role');
    return resp;
  }

  const allowedPrefix = ROLE_PATHS[role];

  // If logged in user tries to visit login/register, push them to dashboard
  if (isAuthRoute) {
    return NextResponse.redirect(new URL(`${allowedPrefix}/dashboard`, request.url));
  }

  // Redirect if accessing wrong role's section
  if (!pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL(`${allowedPrefix}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/volunteer/:path*', '/participant/:path*', '/login', '/register'],
};
