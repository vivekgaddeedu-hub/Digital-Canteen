import React from 'react';
import prisma from '@/lib/prisma';
import AdminMenuClient from './AdminMenuClient';

export const revalidate = 0;

export default async function AdminMenuPage() {
  const items = await prisma.menuItem.findMany({
    include: {
      category: { select: { id: true, name: true } },
      canteen: { select: { id: true, name: true } },
      inventory: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const canteens = await prisma.canteen.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const categories = await prisma.category.findMany({
    select: { id: true, canteenId: true, name: true },
    orderBy: { sortOrder: 'asc' },
  });

  const formattedItems = (items || []).map((i: any) => ({
    ...i,
    price: Number(i.price),
  }));

  return (
    <AdminMenuClient
      initialItems={formattedItems as any}
      canteens={canteens as any}
      categories={categories as any}
    />
  );
}
