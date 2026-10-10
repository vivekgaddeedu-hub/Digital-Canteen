import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resetPasswordSchema } from '@/lib/validations';
import { consumePasswordResetToken, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Verify and consume token (checks hash, expiration, single-use)
    const userId = await consumePasswordResetToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: 'This password reset link is invalid, expired, or has already been used.' },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again later.' },
      { status: 500 }
    );
  }
}
