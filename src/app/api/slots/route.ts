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

    let slots = await prisma.pickupSlot.findMany({
      where: {
        canteenId,
        date,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    });

    if (slots.length === 0) {
      const canteen = await prisma.canteen.findUnique({
        where: { id: canteenId },
        select: { id: true, isActive: true },
      });

      if (canteen && canteen.isActive) {
        const DEFAULT_SCHEDULE = [
          { startTime: '11:30', endTime: '11:45', maxCapacity: 15 },
          { startTime: '11:45', endTime: '12:00', maxCapacity: 15 },
          { startTime: '12:00', endTime: '12:15', maxCapacity: 20 },
          { startTime: '12:15', endTime: '12:30', maxCapacity: 20 },
          { startTime: '12:30', endTime: '12:45', maxCapacity: 20 },
          { startTime: '12:45', endTime: '13:00', maxCapacity: 20 },
          { startTime: '13:00', endTime: '13:15', maxCapacity: 20 },
          { startTime: '13:15', endTime: '13:30', maxCapacity: 20 },
          { startTime: '13:30', endTime: '13:45', maxCapacity: 15 },
          { startTime: '13:45', endTime: '14:00', maxCapacity: 15 },
          { startTime: '18:00', endTime: '18:30', maxCapacity: 20 },
          { startTime: '18:30', endTime: '19:00', maxCapacity: 20 },
        ];

        for (const item of DEFAULT_SCHEDULE) {
          try {
            await prisma.pickupSlot.create({
              data: {
                canteenId,
                date,
                startTime: item.startTime,
                endTime: item.endTime,
                maxCapacity: item.maxCapacity,
                currentBookings: 0,
                isActive: true,
              },
            });
          } catch {
            // Ignore race condition insert collisions
          }
        }

        slots = await prisma.pickupSlot.findMany({
          where: {
            canteenId,
            date,
            isActive: true,
          },
          orderBy: { startTime: 'asc' },
        });
      }
    }

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
