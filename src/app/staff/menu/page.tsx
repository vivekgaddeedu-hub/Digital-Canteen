import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import StaffMenuClient from './StaffMenuClient';
import { Role } from '@/types/database';

export default async function StaffMenuPage() {
  const session = await getSessionUser();
  if (!session || (session.role !== Role.STAFF && session.role !== Role.ADMIN)) {
    redirect('/login');
  }

  let canteenId = session.assignedCanteenId;
  if (!canteenId) {
    const first = await prisma.canteen.findFirst({ where: { isActive: true } });
    canteenId = first?.id || null;
  }

  if (!canteenId) {
    redirect('/staff');
  }

  const canteen = await prisma.canteen.findUnique({
    where: { id: canteenId },
    include: {
      categories: {
        include: {
          menuItems: {
            include: { inventory: true },
            orderBy: { name: 'asc' },
          },
        },
      },
    },
  });

  if (!canteen) {
    redirect('/staff');
  }

  const formattedCategories = (canteen.categories || []).map((c: any) => ({
    ...c,
    menuItems: (c.menuItems || []).map((m: any) => ({
      ...m,
      price: Number(m.price),
    })),
  }));

  return (
    <StaffMenuClient
      canteen={{ id: canteen.id, name: canteen.name }}
      categories={formattedCategories as any}
    />
  );
}
