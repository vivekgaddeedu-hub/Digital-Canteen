import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { promotionSchema } from '@/lib/validations';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const promotions = await prisma.promotion.findMany({
      include: {
        canteen: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const promoIds = promotions.map((p) => p.id);
    const categoryIds = promotions
      .map((p) => p.targetCategoryId)
      .filter((id): id is string => Boolean(id));

    const [categories, impressionsList, clicksList, ordersList] = await Promise.all([
      categoryIds.length > 0
        ? prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : [],
      promoIds.length > 0
        ? prisma.promotionImpression.groupBy({
            by: ['promotionId'],
            where: { promotionId: { in: promoIds } },
            _count: { id: true },
          })
        : [],
      promoIds.length > 0
        ? prisma.promotionClick.groupBy({
            by: ['promotionId'],
            where: { promotionId: { in: promoIds } },
            _count: { id: true },
          })
        : [],
      promoIds.length > 0
        ? prisma.order.groupBy({
            by: ['promotionId'],
            where: { promotionId: { in: promoIds } },
            _count: { id: true },
          })
        : [],
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const impMap = new Map(impressionsList.map((i) => [i.promotionId, i._count.id]));
    const clickMap = new Map(clicksList.map((c) => [c.promotionId, c._count.id]));
    const orderMap = new Map(
      ordersList
        .filter((o) => o.promotionId !== null)
        .map((o) => [o.promotionId as string, o._count.id])
    );

    const data = promotions.map((p) => {
      const impressions = impMap.get(p.id) || 0;
      const clicks = clickMap.get(p.id) || 0;
      const orders = orderMap.get(p.id) || 0;
      const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';

      return {
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        imageUrl: p.imageUrl,
        discountType: p.discountType,
        discountValue: Number(p.discountValue),
        maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
        minOrderValue: Number(p.minOrderValue),
        promoCode: p.promoCode,
        badge: p.badge,
        canteen: p.canteen,
        category: p.targetCategoryId ? categoryMap.get(p.targetCategoryId) || null : null,
        placement: p.placement,
        priority: p.priority,
        startDate: p.startDate,
        endDate: p.endDate,
        isActive: p.isActive,
        impressions,
        clicks,
        orders,
        ctr: `${ctr}%`,
      };
    });

    return NextResponse.json({ promotions: data });
  } catch (error) {
    console.error('Error fetching admin promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = promotionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      title,
      subtitle,
      description,
      imageUrl,
      discountType,
      discountValue,
      maxDiscount,
      minOrderValue,
      promoCode,
      badge,
      canteenId,
      targetCategoryId,
      targetMenuItemId,
      placement,
      priority,
      startDate,
      endDate,
      isActive,
    } = parsed.data;

    // Check if promoCode already taken
    if (promoCode) {
      const existing = await prisma.promotion.findUnique({
        where: { promoCode: promoCode.trim().toUpperCase() },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'A promotion with this promo code already exists.' },
          { status: 409 }
        );
      }
    }

    const promo = await prisma.promotion.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        discountType,
        discountValue,
        maxDiscount: maxDiscount || null,
        minOrderValue: minOrderValue || 0,
        promoCode: promoCode ? promoCode.trim().toUpperCase() : null,
        badge: badge?.trim() || null,
        canteenId: canteenId || null,
        targetCategoryId: targetCategoryId || null,
        targetMenuItemId: targetMenuItemId || null,
        placement,
        priority,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
      },
    });

    return NextResponse.json({ message: 'Promotion created successfully', promotion: promo }, { status: 201 });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { error: 'Failed to create promotion.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { id, isActive } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Promotion ID is required.' }, { status: 400 });
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
    });

    return NextResponse.json({ message: 'Promotion updated successfully', promotion: updated });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json(
      { error: 'Failed to update promotion.' },
      { status: 500 }
    );
  }
}
