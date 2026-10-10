import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { User, Mail, Phone, Calendar, Shield, ShoppingBag, Clock } from 'lucide-react';
import { OrderStatus } from '@prisma/client';

export default async function CustomerProfilePage() {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      orders: {
        select: {
          id: true,
          status: true,
          total: true,
        },
      },
      staffAssignments: {
        include: { canteen: true },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  const totalOrders = user.orders.length;
  const activeOrders = user.orders.filter((o) =>
    (
      [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY] as OrderStatus[]
    ).includes(o.status)
  ).length;
  const totalSpend = user.orders
    .filter((o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.REJECTED)
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Account Profile</h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Your campus account and dining summary.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-2xl uppercase">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">{user.name}</h2>
            <p className="text-xs text-stone-500">{user.email}</p>
            <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              Role: {user.role}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-100">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
            <span className="text-[11px] font-bold text-stone-400 block uppercase">Total Orders</span>
            <span className="text-xl font-black text-stone-900">{totalOrders}</span>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
            <span className="text-[11px] font-bold text-stone-400 block uppercase">Active Orders</span>
            <span className="text-xl font-black text-brand-600">{activeOrders}</span>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
            <span className="text-[11px] font-bold text-stone-400 block uppercase">Total Spend</span>
            <span className="text-xl font-black text-stone-900">₹{totalSpend.toFixed(0)}</span>
          </div>
        </div>

        {/* Contact details */}
        <div className="space-y-3 pt-4 border-t border-stone-100 text-xs sm:text-sm">
          <div className="flex items-center gap-3 text-stone-600">
            <Mail className="w-4 h-4 text-stone-400" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-stone-600">
            <Phone className="w-4 h-4 text-stone-400" />
            <span>{user.phone || 'No phone number linked'}</span>
          </div>
          <div className="flex items-center gap-3 text-stone-600">
            <Calendar className="w-4 h-4 text-stone-400" />
            <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
