import React from 'react';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import OrderTrackingClient from './OrderTrackingClient';
import { Role } from '@/types/database';

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      canteen: { select: { name: true, location: true } },
      pickupSlot: { select: { startTime: true, endTime: true, date: true } },
      items: true,
      payment: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) {
    notFound();
  }

  // IDOR Protection: Customers can ONLY view their own orders!
  if (session.role === Role.CUSTOMER && order.customerId !== session.userId) {
    redirect('/orders');
  }

  // Convert Decimals to numbers and Dates to strings for safe Client Component serialization
  const formattedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    convenienceFee: Number(order.convenienceFee),
    discount: Number(order.discount || 0),
    total: Number(order.total),
    pickupToken: order.pickupToken,
    specialInstructions: order.specialInstructions,
    rejectionReason: order.rejectionReason,
    cancellationReason: order.cancellationReason,
    createdAt: order.createdAt.toISOString(),
    canteen: {
      name: order.canteen?.name || 'QuickBite Canteen',
      location: order.canteen?.location || 'Campus Counter',
    },
    pickupSlot: order.pickupSlot
      ? {
          startTime: order.pickupSlot.startTime,
          endTime: order.pickupSlot.endTime,
          date: order.pickupSlot.date,
        }
      : {
          startTime: '12:00',
          endTime: '12:15',
          date: 'Today',
        },
    payment: order.payment
      ? {
          method: order.payment.method,
          status: order.payment.status,
          transactionRef: order.payment.transactionRef,
          isSimulated: order.payment.isSimulated,
        }
      : null,
    items: (order.items || []).map((i: any) => ({
      id: i.id,
      nameSnapshot: i.nameSnapshot,
      unitPriceSnapshot: Number(i.unitPriceSnapshot),
      quantity: i.quantity,
      subtotal: Number(i.subtotal),
      notes: i.notes || null,
    })),
    statusHistory: (order.statusHistory || []).map((h: any) => ({
      id: h.id,
      toStatus: h.toStatus,
      note: h.note || null,
      createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : String(h.createdAt),
    })),
  };

  return <OrderTrackingClient initialOrder={formattedOrder as any} />;
}
