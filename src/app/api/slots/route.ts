import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { pickupSlotSchema } from '@/lib/validations';
import { Role } from '@/types/database';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get('canteenId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!canteenId) {
      return NextResponse.json({ error: 'Canteen ID is required' }, { status: 400 });
    }

    const slots = await prisma.pickupSlot.findMany({
      where: {
        canteenId,
        date,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    });

    const enriched = slots.map((slot) => ({
      ...slot,
      remainingCapacity: Math.max(0, slot.maxCapacity - slot.currentBookings),
      isFull: slot.currentBookings >= slot.maxCapacity,
    }));

    return NextResponse.json({ slots: enriched });
  } catch (error) {
    console.error('Fetch slots error:', error);
    return NextResponse.json({ error: 'Failed to fetch pickup slots' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = pickupSlotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const slot = await prisma.pickupSlot.create({
      data: parsed.data,
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    console.error('Create slot error:', error);
    return NextResponse.json({ error: 'Failed to create pickup slot' }, { status: 500 });
  }
}
