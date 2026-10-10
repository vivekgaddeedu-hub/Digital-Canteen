import React from 'react';
import prisma from '@/lib/prisma';
import AdminCanteensClient from './AdminCanteensClient';

export const revalidate = 0;

export default async function AdminCanteensPage() {
  const canteens = await prisma.canteen.findMany({
    include: {
      _count: {
        select: {
          menuItems: true,
          categories: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return <AdminCanteensClient initialCanteens={canteens as any} />;
}
