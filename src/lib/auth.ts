import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'quickbite_super_secure_jwt_token_secret_campus_digital_canteen_2026';
export const TOKEN_COOKIE_NAME = 'qb_auth_token';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  assignedCanteenId?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getSessionUser(req?: NextRequest): Promise<TokenPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    // If called from Server Components / Server Actions
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  }

  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;

  // Verify user still exists in database and has current role
  const dbUser = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { staffAssignments: true },
  });

  if (!dbUser) return null;

  return {
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    assignedCanteenId: dbUser.staffAssignments?.[0]?.canteenId || null,
  };
}

export async function requireAuth(req: NextRequest, allowedRoles?: Role[]): Promise<{ user: TokenPayload } | { error: NextResponse }> {
  const user = await getSessionUser(req);
  if (!user) {
    const errorRes = NextResponse.json(
      { error: 'Authentication required. Please log in.' },
      { status: 401 }
    );
    clearAuthCookie(errorRes);
    return {
      error: errorRes,
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      error: NextResponse.json(
        { error: `Forbidden. You do not have permissions for this action. Required: ${allowedRoles.join(', ')}` },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * Maps authenticated user roles to their primary production dashboard routes.
 */
export function getDashboardRouteForRole(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return '/admin/dashboard';
    case Role.STAFF:
      return '/staff/dashboard';
    case Role.CUSTOMER:
    default:
      return '/customer/dashboard';
  }
}

/**
 * Validates target redirect URLs to prevent Open Redirect vulnerabilities.
 * Ensures relative paths and checks role-level permissions for protected sections.
 */
export function getSafeRedirectUrl(targetUrl: string | null | undefined, role: Role): string {
  const fallback = getDashboardRouteForRole(role);
  if (!targetUrl || typeof targetUrl !== 'string') return fallback;

  const trimmed = targetUrl.trim();
  // Reject protocol-relative URLs (//evil.com), full URLs (http:), or javascript: URIs
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Prevent customers from being redirected to privileged areas
  if (trimmed.startsWith('/admin') && role !== Role.ADMIN) {
    return fallback;
  }
  if (trimmed.startsWith('/staff') && role !== Role.STAFF && role !== Role.ADMIN) {
    return fallback;
  }

  return trimmed;
}

/**
 * Generates a cryptographically secure, single-use password reset token.
 * Stores only the SHA-256 hash in the database for security.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const crypto = await import('crypto');
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

  // Invalidate any existing unused reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      used: false,
    },
  });

  return rawToken;
}

/**
 * Verifies and consumes a password reset token.
 * Returns the userId if valid and not expired; null otherwise.
 */
export async function consumePasswordResetToken(rawToken: string): Promise<string | null> {
  const crypto = await import('crypto');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!tokenRecord) return null;
  if (tokenRecord.used) return null;
  if (new Date() > tokenRecord.expiresAt) return null;

  // Mark token as used immediately (single-use)
  await prisma.passwordResetToken.update({
    where: { id: tokenRecord.id },
    data: { used: true },
  });

  return tokenRecord.userId;
}

