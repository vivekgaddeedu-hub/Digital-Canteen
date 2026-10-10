import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie, getDashboardRouteForRole } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { sendWelcomeEmail } from '@/lib/email/email-service';
import { Role } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || 'Validation failed';
      return NextResponse.json(
        { error: firstError, details: fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Enforce CUSTOMER role strictly on public registration
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone?.trim() || null,
        role: Role.CUSTOMER,
      },
    });

    // Send welcome email asynchronously without blocking registration response
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.warn('Welcome email error (non-fatal):', err);
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const redirectUrl = getDashboardRouteForRole(user.role);

    const res = NextResponse.json(
      {
        message: 'Account registered successfully',
        redirectUrl,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );

    setAuthCookie(res, token);
    return res;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again later.' },
      { status: 500 }
    );
  }
}
