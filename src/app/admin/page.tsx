import React from 'react';
import prisma from '@/lib/prisma';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';
import { OrderStatus } from '@prisma/client';

export const revalidate = 0; // Dynamic server analytics

export default async function AdminPage() {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    include: {
      items: true,
      canteen: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const validOrders = orders.filter(
    (o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.REJECTED
  );
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COLLECTED);
  const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED);
  const rejectedOrders = orders.filter((o) => o.status === OrderStatus.REJECTED);
  const activeOrders = orders.filter((o) =>
    (
      [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY] as OrderStatus[]
    ).includes(o.status)
  );

  const grossRevenue = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrderValue = validOrders.length > 0 ? grossRevenue / validOrders.length : 0;

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const s of Object.values(OrderStatus)) {
    statusCounts[s] = orders.filter((o) => o.status === s).length;
  }

  // Best sellers
  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of validOrders) {
    for (const item of o.items) {
      const existing = itemMap.get(item.nameSnapshot) || {
        name: item.nameSnapshot,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.subtotal);
      itemMap.set(item.nameSnapshot, existing);
    }
  }
  const bestSellers = Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Sales by Canteen
  const canteenMap = new Map<string, { name: string; orders: number; revenue: number }>();
  for (const o of validOrders) {
    const cName = o.canteen.name;
    const existing = canteenMap.get(cName) || { name: cName, orders: 0, revenue: 0 };
    existing.orders += 1;
    existing.revenue += Number(o.total);
    canteenMap.set(cName, existing);
  }
  const canteenSales = Array.from(canteenMap.values());

  // Daily Trend
  const dailyMap = new Map<string, { date: string; orders: number; revenue: number }>();
  for (const o of orders) {
    const dayKey = o.createdAt.toISOString().slice(0, 10);
    const existing = dailyMap.get(dayKey) || { date: dayKey, orders: 0, revenue: 0 };
    existing.orders += 1;
    if (o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.REJECTED) {
      existing.revenue += Number(o.total);
    }
    dailyMap.set(dayKey, existing);
  }
  const trend = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const analyticsData = {
    summary: {
      totalOrders: orders.length,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      averageOrderValue: Number(avgOrderValue.toFixed(2)),
      completedCount: completedOrders.length,
      cancelledCount: cancelledOrders.length,
      rejectedCount: rejectedOrders.length,
      activeCount: activeOrders.length,
    },
    statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    bestSellers,
    canteenSales,
    trend,
  };

  return <AnalyticsDashboardClient initialData={analyticsData} />;
}
