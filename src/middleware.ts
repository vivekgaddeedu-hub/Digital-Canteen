import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'quickbite_super_secure_jwt_token_secret_campus_digital_canteen_2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const TOKEN_COOKIE_NAME = 'qb_auth_token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  let user: { role: string; userId: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      user = {
        role: payload.role as string,
        userId: payload.userId as string,
      };
    } catch {
      // Invalid or expired token
      user = null;
    }
  }

  // 1. Legacy / convenience shortcuts
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  if (pathname === '/staff') {
    return NextResponse.redirect(new URL('/staff/dashboard', request.url));
  }

  // 2. Auth pages (/login, /register) are always accessible (allows account switching and test sign-in)
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next();
  }

  // 3. Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'ADMIN') {
      const target = user.role === 'STAFF' ? '/staff/dashboard' : '/customer/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 4. Staff routes protection
  if (pathname.startsWith('/staff')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/customer/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 5. Customer routes protection
  if (pathname.startsWith('/customer')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/staff',
    '/staff/:path*',
    '/customer/:path*',
    '/login',
    '/register',
  ],
};
