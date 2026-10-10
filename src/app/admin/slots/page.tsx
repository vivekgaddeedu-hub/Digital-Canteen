import React from 'react';
import prisma from '@/lib/prisma';
import AdminSlotsClient from './AdminSlotsClient';

export const revalidate = 0;

export default async function AdminSlotsPage() {
  const slots = await prisma.pickupSlot.findMany({
    include: {
      canteen: { select: { name: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  const canteens = await prisma.canteen.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return <AdminSlotsClient initialSlots={slots as any} canteens={canteens} />;
}
