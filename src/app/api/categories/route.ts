import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@/types/database';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get('canteenId');

    const categories = await prisma.category.findMany({
      where: canteenId ? { canteenId } : {},
      include: {
        _count: { select: { menuItems: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN, Role.STAFF]);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { canteenId, name, sortOrder } = body;

    if (!canteenId || !name) {
      return NextResponse.json({ error: 'Canteen ID and name are required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        canteenId,
        name,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
