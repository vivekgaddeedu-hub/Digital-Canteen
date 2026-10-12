import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendOrderReceivedEmail } from '@/lib/email/email-service';
import { Role } from '@/types/database';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, [Role.STAFF, Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;

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
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Check staff canteen assignment
    if (auth.user.role === Role.STAFF && auth.user.assignedCanteenId !== order.canteenId) {
      return NextResponse.json(
        { error: 'Staff cannot acknowledge orders outside their assigned canteen.' },
        { status: 403 }
      );
    }

    // Record acknowledgement in OrderStatusHistory and AuditLog
    await prisma.$transaction(async (tx) => {
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          note: `Canteen staff (${auth.user.name}) acknowledged receipt of order ticket.`,
          changedByUserId: auth.user.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: 'ORDER_ACKNOWLEDGED_BY_CANTEEN',
          entityType: 'Order',
          entityId: order.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            canteenId: order.canteenId,
            staffName: auth.user.name,
          }),
        },
      });
    });

    // Send "Order Received" email to customer
    if (order.customer?.email) {
      sendOrderReceivedEmail(order.customer.email, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer.name || 'Customer',
        canteenName: order.canteen?.name || 'QuickBite Canteen',
        canteenLocation: order.canteen?.location || 'Campus Counter',
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
        status: order.status,
        paymentStatus: order.payment?.status || 'UNPAID',
      }).catch((err) => {
        console.warn('Order received email failed (non-fatal):', err);
      });
    }

    return NextResponse.json({
      message: 'Order ticket receipt acknowledged by kitchen staff.',
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error('Order acknowledge error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to acknowledge order receipt.' },
      { status: 500 }
    );
  }
}
