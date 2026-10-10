import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import {
  LayoutDashboard,
  Utensils,
  FolderTree,
  Store,
  Boxes,
  CalendarClock,
  Users,
  FileSpreadsheet,
  History,
  ShoppingBag,
  Tag,
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session || session.role !== Role.ADMIN) {
    redirect('/login');
  }

  const links = [
    { href: '/admin/dashboard', label: 'Analytics Overview', icon: LayoutDashboard },
    { href: '/admin/promotions', label: 'Promotions & Deals', icon: Tag },
    { href: '/admin/orders', label: 'All Orders', icon: ShoppingBag },
    { href: '/admin/menu', label: 'Menu Catalog', icon: Utensils },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/canteens', label: 'Canteens', icon: Store },
    { href: '/admin/inventory', label: 'Inventory Stock', icon: Boxes },
    { href: '/admin/slots', label: 'Pickup Slots', icon: CalendarClock },
    { href: '/admin/staff', label: 'Staff Accounts', icon: Users },
    { href: '/admin/reports', label: 'CSV Reports', icon: FileSpreadsheet },
    { href: '/admin/audit', label: 'Audit Logs', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Subheader & Tab bar */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 px-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              QUICKBITE Administrator Console
            </h2>
          </div>
          <span className="text-[11px] text-stone-500 font-mono">
            Signed in as: {session.name}
          </span>
        </div>

        {/* Scrollable navigation tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pt-3 scrollbar-thin">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition shrink-0"
              >
                <Icon className="w-4 h-4 text-stone-500" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div>{children}</div>
    </div>
  );
}
