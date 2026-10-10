import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { orderStatusUpdateSchema } from '@/lib/validations';
import { isValidStatusTransition } from '@/lib/order-utils';
import {
  sendOrderAcceptedEmail,
  sendOrderReadyEmail,
  sendOrderCancelledEmail,
  sendOrderStatusEmail,
} from '@/lib/email/email-service';
import { OrderStatus, PaymentStatus, Role } from '@/types/database';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, [Role.STAFF, Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = orderStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid status update', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { toStatus, reason, note } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        customer: true,
        canteen: true,
        pickupSlot: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prevent staff from managing orders belonging to another canteen
    if (auth.user.role === Role.STAFF && auth.user.assignedCanteenId !== order.canteenId) {
      return NextResponse.json(
        { error: 'Staff cannot manage orders outside their assigned canteen.' },
        { status: 403 }
      );
    }

    // Validate state transition on server
    if (!isValidStatusTransition(order.status, toStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from "${order.status}" to "${toStatus}".`,
        },
        { status: 400 }
      );
    }

    // If REJECTED, must have a reason
    if (toStatus === OrderStatus.REJECTED && (!reason || reason.trim().length === 0)) {
      return NextResponse.json(
        { error: 'A rejection reason is required when rejecting an order.' },
        { status: 400 }
      );
    }

    // Execute status transition in a database transaction
    const updated = await prisma.$transaction(async (tx) => {
      // If rejecting, restore inventory and slot capacity
      if (toStatus === OrderStatus.REJECTED) {
        for (const item of order.items) {
          await tx.inventoryRecord.updateMany({
            where: { menuItemId: item.menuItemId, isUnlimited: false },
            data: { currentStock: { increment: item.quantity } },
          });
        }

        await tx.pickupSlot.update({
          where: { id: order.pickupSlotId },
          data: { currentBookings: { decrement: 1 } },
        });

        if (order.payment && order.payment.status === PaymentStatus.COMPLETED) {
          await tx.payment.update({
            where: { orderId: order.id },
            data: { status: PaymentStatus.REFUNDED },
          });
        }
      }

      // If COLLECTED, update payment to COMPLETED if cash on pickup
      if (toStatus === OrderStatus.COLLECTED && order.payment && order.payment.status === PaymentStatus.PENDING) {
        await tx.payment.update({
          where: { orderId: order.id },
          data: { status: PaymentStatus.COMPLETED },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: toStatus,
          rejectionReason: toStatus === OrderStatus.REJECTED ? reason : order.rejectionReason,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus,
          note: note || (toStatus === OrderStatus.REJECTED ? `Rejected: ${reason}` : `Status changed to ${toStatus}`),
          changedByUserId: auth.user.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: 'ORDER_STATUS_CHANGED',
          entityType: 'Order',
          entityId: order.id,
          details: JSON.stringify({ from: order.status, to: toStatus, reason }),
        },
      });

      return updatedOrder;
    });

    // Prepare shared email data payload
    const emailPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      canteenName: order.canteen.name,
      canteenLocation: order.canteen.location,
      pickupSlot: order.pickupSlot ? `${order.pickupSlot.startTime} - ${order.pickupSlot.endTime}` : 'As Scheduled',
      pickupToken: order.pickupToken,
      items: order.items.map((i) => ({
        name: i.nameSnapshot,
        quantity: i.quantity,
        price: Number(i.unitPriceSnapshot),
        subtotal: Number(i.subtotal),
      })),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      convenienceFee: Number(order.convenienceFee),
      total: Number(order.total),
      status: toStatus,
      paymentStatus: order.payment?.status || 'UNPAID',
      cancellationReason: reason || note,
    };

    // Send email notifications to customer asynchronously
    if (toStatus === OrderStatus.ACCEPTED) {
      sendOrderAcceptedEmail(order.customer.email, emailPayload).catch((err) =>
        console.warn('Order accepted email error (non-fatal):', err)
      );
    } else if (toStatus === OrderStatus.READY) {
      sendOrderReadyEmail(order.customer.email, emailPayload).catch((err) =>
        console.warn('Order ready email error (non-fatal):', err)
      );
    } else if (toStatus === OrderStatus.CANCELLED || toStatus === OrderStatus.REJECTED) {
      sendOrderCancelledEmail(order.customer.email, emailPayload).catch((err) =>
        console.warn('Order cancelled email error (non-fatal):', err)
      );
    } else if (toStatus === OrderStatus.PREPARING) {
      sendOrderStatusEmail(order.customer.email, {
        ...emailPayload,
        statusMessage: 'The chefs are now actively preparing your meal in the kitchen.',
        reason: note,
      }).catch((err) => console.warn('Order preparing email error (non-fatal):', err));
    }

    return NextResponse.json({
      message: `Order status updated to ${toStatus}`,
      order: updated,
    });
  } catch (error: any) {
    console.error('Status transition error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status.' },
      { status: 500 }
    );
  }
}
