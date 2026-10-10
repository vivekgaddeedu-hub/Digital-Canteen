import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import StatusBadge from '@/components/StatusBadge';
import { ShoppingBag, Clock, Store, Eye } from 'lucide-react';

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      canteen: { select: { name: true } },
      pickupSlot: { select: { startTime: true, endTime: true, date: true } },
      items: true,
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Order Oversight</h1>
          <p className="text-xs text-stone-500">
            Real-time feed of all {orders.length} campus customer orders.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Canteen</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(orders || []).map((o: any) => (
                <tr key={o.id} className="hover:bg-stone-50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                    {o.orderNumber}
                    <span className="block text-[10px] text-brand-600 font-semibold font-mono">
                      Token: {o.pickupToken}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-stone-700">{o.canteen?.name}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-stone-900">{o.customer?.name}</p>
                    <p className="text-[10px] text-stone-400">{o.customer?.email}</p>
                  </td>
                  <td className="py-3.5 px-4 text-stone-600">
                    {o.pickupSlot ? `${o.pickupSlot.startTime} – ${o.pickupSlot.endTime}` : 'Walk-in'}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={o.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-black text-stone-900">
                    ₹{Number(o.total).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/orders/${o.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-brand-50 hover:text-brand-600 text-stone-700 font-bold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
