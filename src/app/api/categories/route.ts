import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@/types/database';

const categoryCache = new Map<string, { data: any; expiry: number }>();

export function invalidateCategoryCache(canteenId?: string) {
  if (canteenId) categoryCache.delete(canteenId);
  else categoryCache.clear();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get('canteenId') || 'all';

    const cached = categoryCache.get(canteenId);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json(
        { categories: cached.data },
        { headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' } }
      );
    }

    const categories = await prisma.category.findMany({
      where: canteenId !== 'all' ? { canteenId } : {},
      include: {
        _count: { select: { menuItems: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    categoryCache.set(canteenId, { data: categories, expiry: Date.now() + 20000 });

    return NextResponse.json(
      { categories },
      { headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' } }
    );
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
