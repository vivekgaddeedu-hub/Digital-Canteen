import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { userPreferenceSchema } from '@/lib/validations';
import { Role } from '@/types/database';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [Role.CUSTOMER, Role.STAFF, Role.ADMIN]);
  if ('error' in auth) return auth.error;

  const pref = await prisma.userPreference.findUnique({
    where: { userId: auth.user.userId },
  });

  return NextResponse.json({
    dietaryPreference: pref?.dietaryPreference || 'ANY',
    favoriteCanteenId: pref?.favoriteCanteenId || null,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [Role.CUSTOMER, Role.STAFF, Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = userPreferenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid preference values', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { dietaryPreference, favoriteCanteenId } = parsed.data;

    const pref = await prisma.userPreference.upsert({
      where: { userId: auth.user.userId },
      update: {
        dietaryPreference,
        favoriteCanteenId: favoriteCanteenId || null,
      },
      create: {
        userId: auth.user.userId,
        dietaryPreference,
        favoriteCanteenId: favoriteCanteenId || null,
      },
    });

    return NextResponse.json({ success: true, preference: pref });
  } catch (error) {
    console.error('Error updating user preference:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences.' },
      { status: 500 }
    );
  }
}
