import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { name: true, email: true } },
        canteen: { select: { name: true } },
        items: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Order Number',
      'Date',
      'Canteen',
      'Customer Name',
      'Customer Email',
      'Status',
      'Item Count',
      'Subtotal',
      'Tax',
      'Total',
      'Payment Method',
      'Payment Status',
    ];

    const rows = orders.map((o) => {
      return [
        `"${o.orderNumber}"`,
        `"${o.createdAt.toISOString()}"`,
        `"${o.canteen.name.replace(/"/g, '""')}"`,
        `"${o.customer.name.replace(/"/g, '""')}"`,
        `"${o.customer.email}"`,
        `"${o.status}"`,
        o.items.length,
        o.subtotal.toString(),
        o.tax.toString(),
        o.total.toString(),
        `"${o.payment?.method || 'N/A'}"`,
        `"${o.payment?.status || 'N/A'}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="quickbite-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json({ error: 'Failed to generate CSV export' }, { status: 500 });
  }
}
