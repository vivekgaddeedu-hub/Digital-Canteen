import React from 'react';
import prisma from '@/lib/prisma';
import AdminInventoryClient from './AdminInventoryClient';

export const revalidate = 0;

export default async function AdminInventoryPage() {
  const records = await prisma.inventoryRecord.findMany({
    include: {
      menuItem: {
        include: {
          canteen: { select: { name: true } },
        },
      },
    },
    orderBy: { currentStock: 'asc' },
  });

  const formatted = records.map((r) => ({
    ...r,
    menuItem: {
      ...r.menuItem,
      price: Number(r.menuItem.price),
    },
  }));

  return <AdminInventoryClient initialInventory={formatted as any} />;
}
