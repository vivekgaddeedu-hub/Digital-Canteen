import prisma from '@/lib/prisma';

export interface PersonalizedPromotion {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  imageUrl: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number;
  promoCode: string | null;
  badge: string | null;
  canteenId: string | null;
  canteenName?: string | null;
  canteenSlug?: string | null;
  targetCategoryId: string | null;
  priority: number;
  startDate: Date;
  endDate: Date;
  isPersonalizedMatch?: boolean;
}

/**
 * Rule-based recommendation engine for campus digital canteen promotions.
 * Uses transparent, non-sensitive signals:
 * - Customer dietary preference (VEG, NON_VEG, ANY)
 * - Most frequently ordered food categories
 * - Favorite/most visited canteen
 * - Active dates and valid inventory
 */
export async function getPersonalizedPromotions(
  userId?: string | null,
  canteenId?: string | null
): Promise<PersonalizedPromotion[]> {
  const now = new Date();

  // 1. Fetch all currently active, valid promotions
  const activePromotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      ...(canteenId ? { OR: [{ canteenId }, { canteenId: null }] } : {}),
    },
    include: {
      canteen: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  if (activePromotions.length === 0) {
    return [];
  }

  // 2. If unauthenticated / new customer, return general ranked promotions
  if (!userId) {
    return activePromotions.map((p) => ({
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
      canteenId: p.canteenId,
      canteenName: p.canteen?.name || null,
      canteenSlug: p.canteen?.slug || null,
      targetCategoryId: p.targetCategoryId,
      priority: p.priority,
      startDate: p.startDate,
      endDate: p.endDate,
      isPersonalizedMatch: false,
    }));
  }

  // 3. Retrieve user signals: preferences & past order categories
  const [userPref, pastOrders] = await Promise.all([
    prisma.userPreference.findUnique({
      where: { userId },
    }),
    prisma.order.findMany({
      where: { customerId: userId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            menuItem: {
              select: { categoryId: true, isVeg: true },
            },
          },
        },
      },
    }),
  ]);

  const favoriteCategories = new Set<string>();
  let orderedVegCount = 0;
  let totalItemsCount = 0;

  for (const ord of pastOrders) {
    for (const item of ord.items) {
      if (item.menuItem?.categoryId) {
        favoriteCategories.add(item.menuItem.categoryId);
      }
      if (item.menuItem?.isVeg) {
        orderedVegCount++;
      }
      totalItemsCount++;
    }
  }

  const isPredominantlyVeg =
    userPref?.dietaryPreference === 'VEG' ||
    (totalItemsCount > 2 && orderedVegCount / totalItemsCount >= 0.7);

  // 4. Score and sort promotions based on personalization signals
  const scored = activePromotions.map((promo) => {
    let score = promo.priority * 10;
    let isMatch = false;

    // Signal: User's favorite or selected canteen
    if (userPref?.favoriteCanteenId && promo.canteenId === userPref.favoriteCanteenId) {
      score += 25;
      isMatch = true;
    }

    // Signal: Category preference from order history
    if (promo.targetCategoryId && favoriteCategories.has(promo.targetCategoryId)) {
      score += 30;
      isMatch = true;
    }

    // Signal: Veg preference alignment
    if (isPredominantlyVeg && promo.badge?.toLowerCase().includes('veg')) {
      score += 15;
      isMatch = true;
    }

    return {
      promo,
      score,
      isMatch,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map(({ promo, isMatch }) => ({
    id: promo.id,
    title: promo.title,
    subtitle: promo.subtitle,
    description: promo.description,
    imageUrl: promo.imageUrl,
    discountType: promo.discountType,
    discountValue: Number(promo.discountValue),
    maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
    minOrderValue: Number(promo.minOrderValue),
    promoCode: promo.promoCode,
    badge: promo.badge,
    canteenId: promo.canteenId,
    canteenName: promo.canteen?.name || null,
    canteenSlug: promo.canteen?.slug || null,
    targetCategoryId: promo.targetCategoryId,
    priority: promo.priority,
    startDate: promo.startDate,
    endDate: promo.endDate,
    isPersonalizedMatch: isMatch,
  }));
}

/**
 * Validates a promo code on the server and computes the discount amount.
 * Never trust a client-calculated price or discount.
 */
export async function validatePromotionCode(
  promoCode: string,
  subtotal: number,
  canteenId?: string
): Promise<{
  valid: boolean;
  discountAmount: number;
  promotion?: {
    id: string;
    title: string;
    promoCode: string;
    discountType: string;
    discountValue: number;
  };
  error?: string;
}> {
  const code = promoCode.trim().toUpperCase();
  const now = new Date();

  const promotion = await prisma.promotion.findUnique({
    where: { promoCode: code },
  });

  if (!promotion || !promotion.isActive) {
    return { valid: false, discountAmount: 0, error: 'Invalid or inactive promo code.' };
  }

  if (now < promotion.startDate || now > promotion.endDate) {
    return { valid: false, discountAmount: 0, error: 'This promo code has expired.' };
  }

  if (promotion.canteenId && canteenId && promotion.canteenId !== canteenId) {
    return { valid: false, discountAmount: 0, error: 'Promo code is not valid for this canteen.' };
  }

  const minOrder = Number(promotion.minOrderValue);
  if (subtotal < minOrder) {
    return {
      valid: false,
      discountAmount: 0,
      error: `Minimum order value of ₹${minOrder} required for this promo.`,
    };
  }

  let discount = 0;
  const val = Number(promotion.discountValue);

  if (promotion.discountType === 'PERCENTAGE') {
    discount = (subtotal * val) / 100;
    if (promotion.maxDiscount) {
      discount = Math.min(discount, Number(promotion.maxDiscount));
    }
  } else {
    // FLAT discount
    discount = Math.min(val, subtotal);
  }

  return {
    valid: true,
    discountAmount: Math.round(discount * 100) / 100,
    promotion: {
      id: promotion.id,
      title: promotion.title,
      promoCode: promotion.promoCode || code,
      discountType: promotion.discountType,
      discountValue: val,
    },
  };
}
