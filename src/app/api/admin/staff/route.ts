import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const staffUsers = await prisma.user.findMany({
      where: {
        OR: [{ role: Role.STAFF }, { role: Role.ADMIN }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        staffAssignments: {
          include: {
            canteen: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ staff: staffUsers });
  } catch (error) {
    console.error('Fetch staff error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff members' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { name, email, password, phone, canteenId, staffRole } = body;

    if (!name || !email || !password || !canteenId) {
      return NextResponse.json(
        { error: 'Name, email, password, and canteen assignment are required.' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          phone: phone || null,
          role: Role.STAFF,
        },
      });

      await tx.staffAssignment.create({
        data: {
          userId: user.id,
          canteenId,
          staffRole: staffRole || 'KITCHEN_STAFF',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: 'STAFF_MEMBER_CREATED',
          entityType: 'User',
          entityId: user.id,
          details: JSON.stringify({ email: user.email, canteenId }),
        },
      });

      return user;
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Create staff error:', error);
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
}
