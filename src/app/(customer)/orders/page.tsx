import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import StatusBadge from '@/components/StatusBadge';
import { Clock, ArrowRight, Store, ShoppingBag } from 'lucide-react';
import { OrderStatus } from '@/types/database';

export default async function CustomerOrdersPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }

  const orders = await prisma.order.findMany({
    where: { customerId: session.userId },
    include: {
      canteen: { select: { name: true, location: true } },
      pickupSlot: { select: { startTime: true, endTime: true, date: true } },
      items: true,
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">My Orders</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Track active lunch orders or review your previous campus meals.
          </p>
        </div>

        <Link
          href="/canteens"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition self-start sm:self-auto"
        >
          <span>Order New Meal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">No Orders Placed Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You haven't ordered from any campus canteen yet. Try pre-ordering to skip the queue today.
          </p>
          <div className="pt-2">
            <Link
              href="/canteens"
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs inline-flex items-center gap-2"
            >
              <span>Explore Menus</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(orders || []).map((order: any) => {
            const isActive = (
              [
                OrderStatus.PLACED,
                OrderStatus.ACCEPTED,
                OrderStatus.PREPARING,
                OrderStatus.READY,
              ] as OrderStatus[]
            ).includes(order.status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-stone-700">
                      {order.orderNumber}
                    </span>
                    <StatusBadge status={order.status} size="sm" />
                    {isActive && (
                      <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded border border-brand-200">
                        Code: {order.pickupToken}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-bold text-stone-900 text-base flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-brand-600" />
                      {order.canteen?.name}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {(order.items || []).length} items: {(order.items || []).map((i: any) => `${i.quantity}x ${i.nameSnapshot}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      Pickup: {order.pickupSlot ? `${order.pickupSlot.startTime} – ${order.pickupSlot.endTime} (${order.pickupSlot.date})` : 'Standard Pickup'}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100 gap-3">
                  <span className="text-lg font-black text-stone-900">
                    ₹{Number(order.total).toFixed(2)}
                  </span>

                  <Link
                    href={`/orders/${order.id}`}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <span>{isActive ? 'Track Live' : 'View Receipt'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
