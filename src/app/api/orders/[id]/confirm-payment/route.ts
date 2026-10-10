import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { PaymentMethod, PaymentStatus, Role } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, [Role.STAFF, Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const method = (body.paymentMethod as PaymentMethod) || PaymentMethod.CASH_AT_COUNTER;
    const notes = body.notes ? String(body.notes).slice(0, 200) : 'In-person collection confirmed by staff';

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
        canteen: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Check staff canteen assignment
    if (auth.user.role === Role.STAFF && auth.user.assignedCanteenId !== order.canteenId) {
      return NextResponse.json(
        { error: 'Staff cannot verify payments outside their assigned canteen.' },
        { status: 403 }
      );
    }

    // Validate current payment status: Prevent duplicate confirmation
    if (order.payment?.status === PaymentStatus.PAID || order.payment?.status === PaymentStatus.COMPLETED) {
      return NextResponse.json(
        {
          error: 'Payment has already been collected and verified for this order.',
          payment: order.payment,
        },
        { status: 409 }
      );
    }

    const now = new Date();

    // Execute payment confirmation transactionally
    const updated = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.upsert({
        where: { orderId: order.id },
        update: {
          status: PaymentStatus.PAID,
          method,
          verifiedByStaffId: auth.user.userId,
          verifiedAt: now,
          notes,
        },
        create: {
          orderId: order.id,
          amount: order.total,
          currency: 'INR',
          method,
          status: PaymentStatus.PAID,
          verifiedByStaffId: auth.user.userId,
          verifiedAt: now,
          notes,
          isSimulated: false,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentCollectionConfirmedAt: now,
          paymentConfirmedByStaffId: auth.user.userId,
        },
        include: {
          payment: true,
          items: true,
          canteen: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: 'PAYMENT_COLLECTED_AND_VERIFIED',
          entityType: 'Order',
          entityId: order.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            amount: Number(order.total),
            method,
            staffId: auth.user.userId,
            staffName: auth.user.name,
          }),
        },
      });

      return { order: updatedOrder, payment: updatedPayment };
    });

    return NextResponse.json({
      message: 'Payment collection verified and confirmed successfully.',
      order: updated.order,
      payment: updated.payment,
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment collection.' },
      { status: 500 }
    );
  }
}
