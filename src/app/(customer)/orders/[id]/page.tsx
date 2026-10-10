import React from 'react';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import OrderTrackingClient from './OrderTrackingClient';
import { Role } from '@prisma/client';

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

  // Convert Decimals to string/number for client component serialization
  const formattedOrder = {
    ...order,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    convenienceFee: Number(order.convenienceFee),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => ({
      ...i,
      unitPriceSnapshot: Number(i.unitPriceSnapshot),
      subtotal: Number(i.subtotal),
    })),
    statusHistory: order.statusHistory.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
  };

  return <OrderTrackingClient initialOrder={formattedOrder as any} />;
}
