import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signToken, setAuthCookie, getSafeRedirectUrl } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        staffAssignments: {
          include: { canteen: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const assignedCanteenId = user.staffAssignments[0]?.canteenId || null;

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedCanteenId,
    });

    // Check for target redirect in request url query parameters or body
    const searchParams = req.nextUrl.searchParams;
    const requestedRedirect = searchParams.get('redirect') || (body as { redirect?: string }).redirect;
    const safeRedirectUrl = getSafeRedirectUrl(requestedRedirect, user.role);

    const res = NextResponse.json({
      message: 'Logged in successfully',
      redirectUrl: safeRedirectUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedCanteen: user.staffAssignments[0]?.canteen || null,
      },
    });

    setAuthCookie(res, token);
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login.' },
      { status: 500 }
    );
  }
}
