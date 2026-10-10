import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { canteenSchema } from '@/lib/validations';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const canteens = await prisma.canteen.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: {
            menuItems: { where: { isAvailable: true } },
            categories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ canteens });
  } catch (error) {
    console.error('Fetch canteens error:', error);
    return NextResponse.json({ error: 'Failed to fetch canteens' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = canteenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description, location, openingTime, closingTime, imageUrl, isActive } = parsed.data;

    const existing = await prisma.canteen.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'A canteen with this slug already exists' }, { status: 409 });
    }

    const canteen = await prisma.canteen.create({
      data: {
        name,
        slug,
        description,
        location,
        openingTime,
        closingTime,
        imageUrl: imageUrl || null,
        isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: 'CANTEEN_CREATED',
        entityType: 'Canteen',
        entityId: canteen.id,
        details: JSON.stringify({ name: canteen.name, slug: canteen.slug }),
      },
    });

    return NextResponse.json({ canteen }, { status: 201 });
  } catch (error) {
    console.error('Create canteen error:', error);
    return NextResponse.json({ error: 'Failed to create canteen' }, { status: 500 });
  }
}
