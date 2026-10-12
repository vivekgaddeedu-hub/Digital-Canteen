import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { CheckCircle2, ArrowRight, Clock, MapPin, QrCode, Sparkles } from 'lucide-react';

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      canteen: true,
      pickupSlot: true,
      items: true,
      payment: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto my-8 space-y-6">
      <div className="bg-white rounded-3xl border border-stone-200/90 p-8 shadow-sm text-center space-y-6">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Order Confirmed & Sent to Kitchen
          </span>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Thank You for Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Order ID: <span className="font-mono font-bold text-stone-800">{order.orderNumber}</span>
          </p>
        </div>

        {/* Pickup Token Showcase */}
        <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Your Express Pickup Code
          </span>
          <div className="inline-block px-6 py-2.5 rounded-xl bg-white border-2 border-brand-500 shadow-md">
            <span className="text-3xl font-black text-brand-600 font-mono tracking-wider">
              {order.pickupToken}
            </span>
          </div>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            Show this code at the pickup counter or scan when your order status turns "Ready".
          </p>
        </div>

        {/* Slot & Location Details */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Arrival Slot</span>
            </div>
            <p className="text-xs font-extrabold text-stone-900">
              {order.pickupSlot ? `${order.pickupSlot.startTime} – ${order.pickupSlot.endTime}` : 'As Scheduled'}
            </p>
            <p className="text-[10px] text-stone-500">{order.pickupSlot?.date || 'Today'}</p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Pickup Counter</span>
            </div>
            <p className="text-xs font-extrabold text-stone-900 truncate">{order.canteen?.name || 'QuickBite Canteen'}</p>
            <p className="text-[10px] text-stone-500 truncate">{order.canteen?.location || 'Counter'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href={`/orders/${order.id}`}
            className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Track Live Order Status</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/canteens"
            className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition"
          >
            Back to Canteens
          </Link>
        </div>
      </div>
    </div>
  );
}
