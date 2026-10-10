import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@/types/database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        canteen: true,
        inventory: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Fetch menu item error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu item' }, { status: 500 });
  }
}

// Quick toggle or update item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, [Role.STAFF, Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: { inventory: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    if (auth.user.role === Role.STAFF && auth.user.assignedCanteenId !== existing.canteenId) {
      return NextResponse.json(
        { error: 'Unauthorized to modify items for this canteen' },
        { status: 403 }
      );
    }

    const { isAvailable, currentStock, price } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (typeof isAvailable === 'boolean') updateData.isAvailable = isAvailable;
      if (typeof price === 'number') updateData.price = price;

      const item = await tx.menuItem.update({
        where: { id },
        data: updateData,
      });

      if (typeof currentStock === 'number') {
        await tx.inventoryRecord.upsert({
          where: { menuItemId: id },
          update: { currentStock },
          create: { menuItemId: id, currentStock },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: 'MENU_ITEM_TOGGLE_OR_UPDATE',
          entityType: 'MenuItem',
          entityId: id,
          details: JSON.stringify(body),
        },
      });

      return item;
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Update menu item error:', error);
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    await prisma.menuItem.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: 'MENU_ITEM_DELETED',
        entityType: 'MenuItem',
        entityId: id,
      },
    });

    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}
