import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { verifyPickupSchema } from '@/lib/validations';
import { OrderStatus, PaymentStatus, Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [Role.STAFF, Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = verifyPickupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid pickup token', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { pickupToken } = parsed.data;
    const cleanToken = pickupToken.trim().toUpperCase();

    // Find order by pickupToken or orderNumber
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { pickupToken: cleanToken },
          { orderNumber: cleanToken },
        ],
      },
      include: {
        items: true,
        customer: { select: { name: true, phone: true } },
        payment: true,
        canteen: { select: { id: true, name: true, paymentPolicy: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'No order found with the provided pickup token or order number.' },
        { status: 404 }
      );
    }

    // Check staff canteen assignment
    if (auth.user.role === Role.STAFF && auth.user.assignedCanteenId !== order.canteenId) {
      return NextResponse.json(
        { error: 'This order belongs to a different canteen.' },
        { status: 403 }
      );
    }

    // Check if already collected
    if (order.status === OrderStatus.COLLECTED) {
      return NextResponse.json(
        {
          error: 'This order has already been collected! Duplicate pickup completion is prohibited.',
          order,
        },
        { status: 409 }
      );
    }

    // Order must be ready
    if (order.status !== OrderStatus.READY) {
      return NextResponse.json(
        {
          error: `Order is currently in "${order.status}" status. It must be marked "READY" before handover.`,
          order,
        },
        { status: 400 }
      );
    }

    // Enforce canteen payment policy before handover
    const isPaid = order.payment && (order.payment.status === PaymentStatus.PAID || order.payment.status === PaymentStatus.COMPLETED);
    const requiresPaymentFirst = (order.canteen?.paymentPolicy ?? 'PAY_BEFORE_PICKUP') === 'PAY_BEFORE_PICKUP';

    if (requiresPaymentFirst && !isPaid) {
      return NextResponse.json(
        {
          error: 'Payment must be collected and verified before completing pickup, according to the configured canteen policy.',
          requiresPayment: true,
          orderNumber: order.orderNumber,
          amountDue: Number(order.total),
          paymentStatus: order.payment?.status || PaymentStatus.UNPAID,
        },
        { status: 400 }
      );
    }

    // Mark as collected atomically
    const completed = await prisma.$transaction(async (tx) => {
      // If payment was pending/unpaid and policy allows cash on pickup without prior check
      if (order.payment && (order.payment.status === PaymentStatus.PENDING || order.payment.status === PaymentStatus.UNPAID)) {
        await tx.payment.update({
          where: { orderId: order.id },
          data: {
            status: PaymentStatus.PAID,
            verifiedAt: new Date(),
            verifiedByStaffId: auth.user.userId,
            notes: `Auto-verified on pickup completion by staff ${auth.user.userId}`,
          },
        });
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COLLECTED,
          pickupVerifiedAt: new Date(),
          pickupVerifiedByStaffId: auth.user.userId,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.READY,
          toStatus: OrderStatus.COLLECTED,
          note: `Verified pickup code ${cleanToken} at counter by staff ${auth.user.name || auth.user.userId}. Handed to customer.`,
          changedByUserId: auth.user.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: 'ORDER_PICKUP_VERIFIED',
          entityType: 'Order',
          entityId: order.id,
          details: JSON.stringify({
            token: cleanToken,
            customerName: order.customer.name,
            pickupVerifiedAt: new Date().toISOString(),
            paymentStatus: isPaid ? 'ALREADY_PAID' : 'CONFIRMED_ON_PICKUP',
          }),
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: 'Pickup verified! Order marked as COLLECTED.',
      order: {
        ...completed,
        customerName: order.customer.name,
      },
    });
  } catch (error: any) {
    console.error('Pickup verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}
