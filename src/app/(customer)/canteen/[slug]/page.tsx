import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CanteenMenuClient from './CanteenMenuClient';

export const revalidate = 10; // Fresh menu items every 10s

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
    categories: canteen.categories.map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    })),
    pickupSlots: canteen.pickupSlots.map((slot) => ({
      ...slot,
      remainingCapacity: Math.max(0, slot.maxCapacity - slot.currentBookings),
      isFull: slot.currentBookings >= slot.maxCapacity,
    })),
  };

  return <CanteenMenuClient canteen={formattedCanteen} />;
}
