import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { cancelOrderSchema } from '@/lib/validations';
import { OrderStatus, PaymentStatus, Role } from '@/types/database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: {
              select: { imageUrl: true, isVeg: true },
            },
          },
        },
        payment: true,
        canteen: true,
        pickupSlot: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            changedByUser: { select: { name: true, role: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Role-based authorization & IDOR prevention:
    if (auth.user.role === Role.CUSTOMER && order.customerId !== auth.user.userId) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to view this order.' },
        { status: 403 }
      );
    }

    if (auth.user.role === Role.STAFF && order.canteenId !== auth.user.assignedCanteenId) {
      return NextResponse.json(
        { error: 'Forbidden. Staff can only access orders for their assigned canteen.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Fetch order error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

// Cancel order endpoint
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, [Role.CUSTOMER, Role.STAFF, Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = cancelOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid cancellation request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { reason } = parsed.data;

    // Fetch order first to check ownership and status
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Customer can only cancel their own order
    if (auth.user.role === Role.CUSTOMER && order.customerId !== auth.user.userId) {
      return NextResponse.json({ error: 'Forbidden. You cannot cancel this order.' }, { status: 403 });
    }

    // Cancellation eligibility rule: Can only cancel if PLACED or ACCEPTED
    if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.ACCEPTED) {
      return NextResponse.json(
        {
          error: `Order cannot be cancelled in "${order.status}" status. The kitchen is already preparing or it has been collected.`,
        },
        { status: 400 }
      );
    }

    // Execute atomic cancellation, inventory restoration, and slot capacity decrement
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Restore inventory
      for (const item of order.items) {
        await tx.inventoryRecord.updateMany({
          where: { menuItemId: item.menuItemId, isUnlimited: false },
          data: { currentStock: { increment: item.quantity } },
        });
      }

      // 2. Decrement slot bookings
      await tx.pickupSlot.update({
        where: { id: order.pickupSlotId },
        data: { currentBookings: { decrement: 1 } },
      });

      // 3. Mark payment refunded if completed
      if (order.payment && order.payment.status === PaymentStatus.COMPLETED) {
        await tx.payment.update({
          where: { orderId: order.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }

      // 4. Update order status
      const cancelled = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancellationReason: reason,
        },
      });

      // 5. Add status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.CANCELLED,
          note: `Cancelled: ${reason}`,
          changedByUserId: auth.user.userId,
        },
      });

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: 'ORDER_CANCELLED',
          entityType: 'Order',
          entityId: order.id,
          details: JSON.stringify({ reason, previousStatus: order.status }),
        },
      });

      return cancelled;
    });

    return NextResponse.json({
      message: 'Order cancelled successfully and inventory restored.',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel order.' },
      { status: 500 }
    );
  }
}
