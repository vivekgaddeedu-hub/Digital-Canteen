import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@/types/database';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
