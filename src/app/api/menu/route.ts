import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { menuItemSchema } from '@/lib/validations';
import { Role } from '@/types/database';

const menuCache = new Map<string, { data: any; expiry: number }>();

export function invalidateMenuCache() {
  menuCache.clear();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get('canteenId');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const isVeg = searchParams.get('isVeg');
    const availableOnly = searchParams.get('availableOnly') !== 'false';

    const cacheKey = !search ? `${canteenId || 'all'}:${categoryId || 'all'}:${isVeg || 'all'}:${availableOnly}` : null;
    if (cacheKey) {
      const cached = menuCache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        return NextResponse.json(
          { items: cached.data },
          { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45' } }
        );
      }
    }

    const where: any = {};
    if (canteenId) where.canteenId = canteenId;
    if (categoryId) where.categoryId = categoryId;
    if (isVeg !== null && isVeg !== undefined && isVeg !== '') {
      where.isVeg = isVeg === 'true';
    }
    if (availableOnly) {
      where.isAvailable = true;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        canteen: { select: { id: true, name: true, slug: true } },
        inventory: true,
      },
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
    });

    if (cacheKey) {
      menuCache.set(cacheKey, { data: items, expiry: Date.now() + 15000 });
    }

    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45' } }
    );
  } catch (error) {
    console.error('Fetch menu items error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [Role.STAFF, Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = menuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If STAFF, verify canteen assignment
    if (auth.user.role === Role.STAFF && auth.user.assignedCanteenId !== data.canteenId) {
      return NextResponse.json(
        { error: 'Staff can only manage menu items for their assigned canteen.' },
        { status: 403 }
      );
    }

    const item = await prisma.$transaction(async (tx) => {
      const createdItem = await tx.menuItem.create({
        data: {
          canteenId: data.canteenId,
          categoryId: data.categoryId,
          name: data.name,
          description: data.description || null,
          price: data.price,
          imageUrl: data.imageUrl || null,
          isVeg: data.isVeg,
          isAvailable: data.isAvailable,
          preparationTimeMinutes: data.preparationTimeMinutes,
        },
      });

      await tx.inventoryRecord.create({
        data: {
          menuItemId: createdItem.id,
          currentStock: data.stock,
          lowStockAlert: 10,
          isUnlimited: false,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: 'MENU_ITEM_CREATED',
          entityType: 'MenuItem',
          entityId: createdItem.id,
          details: JSON.stringify({ name: createdItem.name, price: data.price }),
        },
      });

      return createdItem;
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Create menu item error:', error);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
