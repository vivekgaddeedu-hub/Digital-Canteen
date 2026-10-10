import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { canteenSchema } from '@/lib/validations';
import { Role } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const todayStr = new Date().toISOString().split('T')[0];

    const canteen = await prisma.canteen.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }],
      },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              where: { isAvailable: true },
              include: { inventory: true },
              orderBy: { name: 'asc' },
            },
          },
        },
        pickupSlots: {
          where: {
            date: todayStr,
            isActive: true,
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!canteen) {
      return NextResponse.json({ error: 'Canteen not found' }, { status: 404 });
    }

    // Attach remaining capacity to slots
    const slotsWithAvailability = canteen.pickupSlots.map((slot) => ({
      ...slot,
      remainingCapacity: Math.max(0, slot.maxCapacity - slot.currentBookings),
      isFull: slot.currentBookings >= slot.maxCapacity,
    }));

    return NextResponse.json({
      canteen: {
        ...canteen,
        pickupSlots: slotsWithAvailability,
      },
    });
  } catch (error) {
    console.error('Fetch canteen error:', error);
    return NextResponse.json({ error: 'Failed to fetch canteen' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = canteenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const canteen = await prisma.canteen.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: 'CANTEEN_UPDATED',
        entityType: 'Canteen',
        entityId: canteen.id,
        details: JSON.stringify(parsed.data),
      },
    });

    return NextResponse.json({ canteen });
  } catch (error) {
    console.error('Update canteen error:', error);
    return NextResponse.json({ error: 'Failed to update canteen' }, { status: 500 });
  }
}
