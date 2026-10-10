import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import StaffDashboardClient from './StaffDashboardClient';
import { Role } from '@/types/database';

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ canteenId?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }

  if (session.role !== Role.STAFF && session.role !== Role.ADMIN) {
    redirect('/canteens');
  }

  const { canteenId: queryCanteenId } = await searchParams;

  // Determine target canteen
  let targetCanteenId = session.assignedCanteenId;

  if (session.role === Role.ADMIN && queryCanteenId) {
    targetCanteenId = queryCanteenId;
  }

  // If no assigned canteen (e.g. admin without assignment), pick the first active canteen
  if (!targetCanteenId) {
    const firstCanteen = await prisma.canteen.findFirst({ where: { isActive: true } });
    if (firstCanteen) {
      targetCanteenId = firstCanteen.id;
    }
  }

  if (!targetCanteenId) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
        <h2 className="text-xl font-bold text-stone-900">No Canteens Configured</h2>
        <p className="text-xs text-stone-500 mt-1">Please configure a canteen in the admin panel.</p>
      </div>
    );
  }

  const canteen = await prisma.canteen.findUnique({
    where: { id: targetCanteenId },
    select: { id: true, name: true, location: true },
  });

  if (!canteen) {
    redirect('/canteens');
  }

  // Fetch orders for this canteen
  const orders = await prisma.order.findMany({
    where: { canteenId: targetCanteenId },
    include: {
      customer: { select: { name: true, phone: true } },
      pickupSlot: { select: { startTime: true, endTime: true, date: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

  const formattedOrders = (orders || []).map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: o.customerId,
    canteenId: o.canteenId,
    pickupSlotId: o.pickupSlotId,
    status: o.status,
    subtotal: Number(o.subtotal),
    tax: Number(o.tax),
    convenienceFee: Number(o.convenienceFee),
    discount: Number(o.discount || 0),
    total: Number(o.total),
    specialInstructions: o.specialInstructions,
    rejectionReason: o.rejectionReason,
    cancellationReason: o.cancellationReason,
    pickupToken: o.pickupToken,
    paymentCollectionConfirmedAt: o.paymentCollectionConfirmedAt instanceof Date ? o.paymentCollectionConfirmedAt.toISOString() : (o.paymentCollectionConfirmedAt ? String(o.paymentCollectionConfirmedAt) : null),
    paymentConfirmedByStaffId: o.paymentConfirmedByStaffId || null,
    pickupVerifiedAt: o.pickupVerifiedAt instanceof Date ? o.pickupVerifiedAt.toISOString() : (o.pickupVerifiedAt ? String(o.pickupVerifiedAt) : null),
    pickupVerifiedByStaffId: o.pickupVerifiedByStaffId || null,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
    updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : String(o.updatedAt),
    customer: o.customer,
    pickupSlot: o.pickupSlot,
    items: (o.items || []).map((i: any) => ({
      id: i.id,
      orderId: i.orderId,
      menuItemId: i.menuItemId,
      nameSnapshot: i.nameSnapshot,
      quantity: i.quantity,
      unitPriceSnapshot: Number(i.unitPriceSnapshot),
      subtotal: Number(i.subtotal),
      notes: i.notes || null,
    })),
  }));

  return <StaffDashboardClient canteen={canteen} initialOrders={formattedOrders as any} />;
}
