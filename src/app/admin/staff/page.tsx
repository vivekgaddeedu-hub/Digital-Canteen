import React from 'react';
import prisma from '@/lib/prisma';
import AdminStaffClient from './AdminStaffClient';
import { Role } from '@prisma/client';

export const revalidate = 0;

export default async function AdminStaffPage() {
  const staff = await prisma.user.findMany({
    where: {
      OR: [{ role: Role.STAFF }, { role: Role.ADMIN }],
    },
    include: {
      staffAssignments: {
        include: {
          canteen: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const canteens = await prisma.canteen.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return <AdminStaffClient initialStaff={staff as any} canteens={canteens} />;
}
