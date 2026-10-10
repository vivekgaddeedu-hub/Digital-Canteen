import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { Role } from '@/types/database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.nextUrl.searchParams.get('token');

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: {
              select: { imageUrl: true, isVeg: true, name: true },
            },
          },
        },
        payment: {
          select: {
            status: true,
            method: true,
            amount: true,
            verifiedAt: true,
            notes: true,
          },
        },
        canteen: {
          select: {
            id: true,
            name: true,
            location: true,
            paymentQrEnabled: true,
            paymentUpiId: true,
            paymentPayeeName: true,
            paymentQrImageUrl: true,
            paymentInstructions: true,
            paymentPolicy: true,
          },
        },
        pickupSlot: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Authorization checks:
    // 1. Check guest tracking token if provided
    let isAuthorized = false;
    let isGuestAccess = false;

    if (token && order.guestTrackingTokenHash) {
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      const isTokenMatch = tokenHash === order.guestTrackingTokenHash;
      const isNotExpired =
        !order.trackingTokenExpiresAt || new Date(order.trackingTokenExpiresAt) > new Date();

      if (isTokenMatch && isNotExpired) {
        isAuthorized = true;
        isGuestAccess = true;
      }
    }

    // 2. Check session authentication
    if (!isAuthorized) {
      const session = await getSessionUser(req);
      if (session) {
        if (session.role === Role.ADMIN) {
          isAuthorized = true;
        } else if (
          session.role === Role.STAFF &&
          session.assignedCanteenId === order.canteenId
        ) {
          isAuthorized = true;
        } else if (session.role === Role.CUSTOMER && session.userId === order.customerId) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            'Unauthorized. Invalid or expired tracking link. Please log in with your customer account to view this order.',
        },
        { status: 403 }
      );
    }

    // Prepare strictly sanitized payload (zero PII exposure like phone or email)
    const sanitizedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      pickupToken: order.pickupToken,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      convenienceFee: Number(order.convenienceFee),
      discount: Number(order.discount),
      total: Number(order.total),
      specialInstructions: order.specialInstructions,
      cancellationReason: order.cancellationReason,
      rejectionReason: order.rejectionReason,
      paymentCollectionConfirmedAt: order.paymentCollectionConfirmedAt,
      pickupVerifiedAt: order.pickupVerifiedAt,
      customerFirstName: order.customer?.name?.split(' ')[0] || 'Customer',
      canteen: order.canteen,
      pickupSlot: order.pickupSlot,
      payment: order.payment
        ? {
            ...order.payment,
            amount: Number(order.payment.amount),
          }
        : null,
      items: order.items.map((it) => ({
        id: it.id,
        name: it.nameSnapshot,
        unitPrice: Number(it.unitPriceSnapshot),
        quantity: it.quantity,
        subtotal: Number(it.subtotal),
        notes: it.notes,
        imageUrl: it.menuItem?.imageUrl,
        isVeg: it.menuItem?.isVeg,
      })),
      statusHistory: order.statusHistory,
      isGuestAccess,
    };

    return NextResponse.json({ order: sanitizedOrder });
  } catch (error: any) {
    console.error('Tracking API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order tracking details' },
      { status: 500 }
    );
  }
}
