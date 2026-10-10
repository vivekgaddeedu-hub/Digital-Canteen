import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { OrderStatus, Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get('canteenId');
    const range = searchParams.get('range') || '7d'; // 'today', '7d', '30d'

    // Determine date cutoff
    const now = new Date();
    let startDate = new Date();
    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else {
      // Default 7 days
      startDate.setDate(now.getDate() - 7);
    }

    const whereBase: any = {
      createdAt: { gte: startDate },
    };
    if (canteenId) whereBase.canteenId = canteenId;

    // Fetch all orders in the range
    const orders = await prisma.order.findMany({
      where: whereBase,
      include: {
        items: true,
        canteen: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Valid non-cancelled/non-rejected orders for financial calculations
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

    // Orders by status
    const statusCounts: Record<string, number> = {};
    for (const s of Object.values(OrderStatus)) {
      statusCounts[s] = orders.filter((o) => o.status === s).length;
    }

    // Best-selling menu items
    const itemSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const o of validOrders) {
      for (const item of o.items) {
        const existing = itemSalesMap.get(item.nameSnapshot) || {
          name: item.nameSnapshot,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += Number(item.subtotal);
        itemSalesMap.set(item.nameSnapshot, existing);
      }
    }

    const bestSellers = Array.from(itemSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Sales by canteen
    const canteenSalesMap = new Map<string, { name: string; orders: number; revenue: number }>();
    for (const o of validOrders) {
      const cName = o.canteen.name;
      const existing = canteenSalesMap.get(cName) || { name: cName, orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += Number(o.total);
      canteenSalesMap.set(cName, existing);
    }
    const canteenSales = Array.from(canteenSalesMap.values());

    // Daily revenue and orders trend
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Analytics computation error:', error);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
