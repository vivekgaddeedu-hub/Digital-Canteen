import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, clearAuthCookie } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        staffAssignments: {
          include: {
            canteen: {
              select: {
                id: true,
                name: true,
                slug: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      const res = NextResponse.json({ user: null });
      clearAuthCookie(res);
      return res;
    }

    return NextResponse.json({
      user: {
        ...user,
        assignedCanteen: user.staffAssignments[0]?.canteen || null,
      },
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
