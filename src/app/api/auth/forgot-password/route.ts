import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validations';
import { createPasswordResetToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email/email-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // To prevent user enumeration attacks, always return success even if user not found
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate single-use reset token and store hash
    const resetToken = await createPasswordResetToken(user.id);

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Unable to process password reset request. Please try again later.' },
      { status: 500 }
    );
  }
}
