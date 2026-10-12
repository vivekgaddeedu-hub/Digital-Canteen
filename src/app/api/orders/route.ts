import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createOrderSchema } from '@/lib/validations';
import { generateOrderNumber, generatePickupToken, calculateOrderTotals } from '@/lib/order-utils';
import { sendOrderPlacedEmail } from '@/lib/email/email-service';
import { OrderStatus, PaymentStatus, Role, PaymentMethod } from '@/types/database';

export async function POST(req: NextRequest) {
  // 1. Authenticate Customer
  const auth = await requireAuth(req, [Role.CUSTOMER, Role.STAFF, Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Order validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { canteenId, pickupSlotId, items: requestedItems, specialInstructions, paymentMethod } = parsed.data;

    // 2. Validate Canteen
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
    });

    if (!canteen || !canteen.isActive) {
      return NextResponse.json(
        { error: 'The selected canteen is currently closed or unavailable.' },
        { status: 400 }
      );
    }

    // Generate cryptographic guest tracking token before transaction
    const rawGuestToken = crypto.randomBytes(24).toString('hex');
    const guestTrackingTokenHash = crypto.createHash('sha256').update(rawGuestToken).digest('hex');
    const trackingTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 3. Atomically validate slot and items in a database transaction
    const orderResult = await prisma.$transaction(async (tx) => {
      // 4. Validate and reserve pickup slot capacity atomically
      const slot = await tx.pickupSlot.findUnique({
        where: { id: pickupSlotId },
      });

      if (!slot || !slot.isActive) {
        throw new Error('Selected pickup slot does not exist or is inactive.');
      }

      if (slot.canteenId !== canteenId) {
        throw new Error('Selected pickup slot does not belong to this canteen.');
      }

      if (slot.currentBookings >= slot.maxCapacity) {
        throw new Error('This pickup slot has reached full capacity. Please choose another time slot.');
      }

      // 5. Fetch current menu items from database to prevent price tampering
      const itemIds = requestedItems.map((i) => i.menuItemId);
      const dbMenuItems = await tx.menuItem.findMany({
        where: {
          id: { in: itemIds },
          canteenId: canteenId,
        },
        include: { inventory: true },
      });

      if (dbMenuItems.length !== requestedItems.length) {
        throw new Error('One or more selected menu items are invalid or unavailable for this canteen.');
      }

      const itemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

      let calculatedSubtotal = 0;
      const orderItemDataToCreate: Array<{
        menuItemId: string;
        nameSnapshot: string;
        unitPriceSnapshot: number;
        quantity: number;
        subtotal: number;
        notes?: string;
      }> = [];

      // 6. Validate availability & stock for each item, and decrement stock
      for (const reqItem of requestedItems) {
        const dbItem = itemMap.get(reqItem.menuItemId);
        if (!dbItem) {
          throw new Error(`Menu item not found: ${reqItem.menuItemId}`);
        }

        if (!dbItem.isAvailable) {
          throw new Error(`"${dbItem.name}" is currently marked unavailable.`);
        }

        const inv = dbItem.inventory;
        if (inv && !inv.isUnlimited) {
          if (inv.currentStock < reqItem.quantity) {
            throw new Error(
              `Insufficient stock for "${dbItem.name}". Only ${inv.currentStock} left in kitchen.`
            );
          }

          // Decrement inventory stock atomically
          await tx.inventoryRecord.update({
            where: { menuItemId: dbItem.id },
            data: { currentStock: { decrement: reqItem.quantity } },
          });
        }

        const unitPrice = Number(dbItem.price);
        const itemSubtotal = unitPrice * reqItem.quantity;
        calculatedSubtotal += itemSubtotal;

        orderItemDataToCreate.push({
          menuItemId: dbItem.id,
          nameSnapshot: dbItem.name,
          unitPriceSnapshot: unitPrice,
          quantity: reqItem.quantity,
          subtotal: itemSubtotal,
          notes: reqItem.notes,
        });
      }

      // 7. Calculate server-side total
      const totals = calculateOrderTotals(calculatedSubtotal);

      // 8. Increment slot capacity atomically
      await tx.pickupSlot.update({
        where: { id: pickupSlotId },
        data: { currentBookings: { increment: 1 } },
      });

      // 9. Generate identifiers
      const orderNumber = generateOrderNumber();
      const pickupToken = generatePickupToken();

      // 11. Determine payment status:
      // SIMULATED_CARD is treated as paid online; counter/UPI is UNPAID until staff verifies
      const initialPaymentStatus =
        paymentMethod === PaymentMethod.SIMULATED_CARD
          ? PaymentStatus.PAID
          : PaymentStatus.UNPAID;

      const transactionRef = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 12. Create the Order with all relations atomically
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: auth.user.userId,
          canteenId,
          pickupSlotId,
          status: OrderStatus.PLACED,
          subtotal: totals.subtotal,
          tax: totals.tax,
          convenienceFee: totals.convenienceFee,
          total: totals.total,
          specialInstructions: specialInstructions || null,
          pickupToken,
          guestTrackingTokenHash,
          trackingTokenExpiresAt,
          items: {
            create: orderItemDataToCreate.map((item) => ({
              menuItemId: item.menuItemId,
              nameSnapshot: item.nameSnapshot,
              unitPriceSnapshot: item.unitPriceSnapshot,
              quantity: item.quantity,
              subtotal: item.subtotal,
              notes: item.notes || null,
            })),
          },
          payment: {
            create: {
              amount: totals.total,
              currency: 'INR',
              method: paymentMethod,
              status: initialPaymentStatus,
              transactionRef,
              isSimulated: paymentMethod === PaymentMethod.SIMULATED_CARD || paymentMethod === PaymentMethod.SIMULATED_UPI,
            },
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: OrderStatus.PLACED,
              note: 'Order successfully submitted by customer. Awaiting kitchen review.',
              changedByUserId: auth.user.userId,
            },
          },
        },
        include: {
          items: true,
          payment: true,
          pickupSlot: true,
          canteen: true,
        },
      });

      // 13. Audit log
      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: 'ORDER_PLACED',
          entityType: 'Order',
          entityId: createdOrder.id,
          details: JSON.stringify({
            orderNumber: createdOrder.orderNumber,
            total: totals.total,
            itemCount: requestedItems.length,
            paymentStatus: initialPaymentStatus,
          }),
        },
      });

      return createdOrder;
    });

    // 14. Send Order Placed email asynchronously without blocking the response
    sendOrderPlacedEmail(auth.user.email, {
      orderId: orderResult.id,
      orderNumber: orderResult.orderNumber,
      customerName: auth.user.name,
      canteenName: orderResult.canteen?.name || 'QuickBite Canteen',
      canteenLocation: orderResult.canteen?.location || 'Campus Counter',
      pickupSlot: orderResult.pickupSlot ? `${orderResult.pickupSlot.startTime} - ${orderResult.pickupSlot.endTime}` : 'As Scheduled',
      pickupToken: orderResult.pickupToken,
      items: orderResult.items.map((i) => ({
        name: i.nameSnapshot,
        quantity: i.quantity,
        price: Number(i.unitPriceSnapshot),
        subtotal: Number(i.subtotal),
      })),
      subtotal: Number(orderResult.subtotal),
      tax: Number(orderResult.tax),
      convenienceFee: Number(orderResult.convenienceFee),
      total: Number(orderResult.total),
      status: orderResult.status,
      paymentStatus: orderResult.payment?.status || 'UNPAID',
      specialInstructions: orderResult.specialInstructions,
      guestTrackingToken: rawGuestToken,
    }).catch((err) => {
      console.warn('Order placed email failed (non-fatal):', err);
    });

    return NextResponse.json(
      {
        message: 'Order placed successfully',
        order: orderResult,
        guestTrackingToken: rawGuestToken,
        trackingUrl: `/track-order/${orderResult.id}?token=${rawGuestToken}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Order placement failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to place order. Please check item availability and try again.' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const canteenId = searchParams.get('canteenId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};

    // Role-based scoping:
    // Customers can ONLY view their own orders!
    if (auth.user.role === Role.CUSTOMER) {
      where.customerId = auth.user.userId;
    } else if (auth.user.role === Role.STAFF) {
      // Staff can only view orders for their assigned canteen!
      if (!auth.user.assignedCanteenId) {
        return NextResponse.json({ error: 'Staff member has no assigned canteen.' }, { status: 403 });
      }
      where.canteenId = auth.user.assignedCanteenId;
    } else if (auth.user.role === Role.ADMIN) {
      if (canteenId) where.canteenId = canteenId;
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        payment: true,
        canteen: { select: { id: true, name: true, location: true } },
        pickupSlot: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
