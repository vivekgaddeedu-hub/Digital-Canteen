import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CanteenMenuClient from './CanteenMenuClient';

export const dynamic = 'force-dynamic';

export default async function CanteenMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const todayStr = new Date().toISOString().split('T')[0];

  const canteen = await prisma.canteen.findFirst({
    where: {
      OR: [{ slug: slug }, { id: slug }],
      isActive: true,
    },
    include: {
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: {
          menuItems: {
            where: { isAvailable: true },
            include: { inventory: true },
            orderBy: { name: 'asc' },
          },
        },
      },
      pickupSlots: {
        where: {
          date: todayStr,
          isActive: true,
        },
        orderBy: { startTime: 'asc' },
      },
    },
  });

  if (!canteen) {
    notFound();
  }

  // Format decimal prices to numbers for client components
  const formattedCanteen = {
    ...canteen,
    categories: (canteen.categories || []).map((cat: any) => ({
      ...cat,
      menuItems: (cat.menuItems || []).map((item: any) => ({
        ...item,
        price: Number(item.price),
      })),
    })),
    pickupSlots: (canteen.pickupSlots || []).map((slot: any) => ({
      ...slot,
      remainingCapacity: Math.max(0, (slot.maxCapacity || 0) - (slot.currentBookings || 0)),
      isFull: (slot.currentBookings || 0) >= (slot.maxCapacity || 1),
    })),
  };

  return <CanteenMenuClient canteen={formattedCanteen} />;
}
