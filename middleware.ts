import { NextRequest, NextResponse } from 'next/server';

const ROLE_PATHS: Record<string, string> = {
  admin: '/admin',
  volunteer: '/volunteer',
  participant: '/participant',
};

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  if (!session) {
    if (isAuthRoute) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify session via lightweight API call
  const verifyRes = await fetch(`${request.nextUrl.origin}/api/auth/verify`, {
    headers: { Cookie: `session=${session}` },
  });

  if (!verifyRes.ok) {
    // Session is invalid or expired
    if (isAuthRoute) {
      const resp = NextResponse.next();
      resp.cookies.delete('session');
      return resp;
    }
    const resp = NextResponse.redirect(new URL('/login', request.url));
    resp.cookies.delete('session');
    return resp;
  }

  const { role } = await verifyRes.json();
  const allowedPrefix = ROLE_PATHS[role];

  // If role is missing or invalid
  if (!allowedPrefix) {
    if (isAuthRoute) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

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
