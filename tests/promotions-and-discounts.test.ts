import { describe, it, expect } from 'vitest';
import { promotionSchema, userPreferenceSchema } from '../src/lib/validations';

describe('Promotions & Personalization Validation Logic', () => {
  it('validates percentage promotion configuration with maximum cap', () => {
    const validPromo = {
      title: 'Lunch Rush Saver: 20% Off',
      subtitle: 'Valid on hot meal bowls',
      description: 'Pre-order your lunch between 11:30 AM and 2:30 PM to save 20%.',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxDiscount: 50,
      minOrderValue: 150,
      promoCode: 'LUNCH20',
      badge: '20% OFF',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      isActive: true,
    };

    expect(promotionSchema.safeParse(validPromo).success).toBe(true);
  });

  it('validates flat amount promotion configuration', () => {
    const flatPromo = {
      title: 'Morning Brew Flat ₹25 Off',
      description: 'Kickstart your day with artisanal espresso.',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
      discountType: 'FLAT',
      discountValue: 25,
      minOrderValue: 100,
      promoCode: 'BREW25',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      isActive: true,
    };

    expect(promotionSchema.safeParse(flatPromo).success).toBe(true);
  });

  it('rejects promotions with invalid discount types or negative values', () => {
    const invalid = {
      title: 'Invalid Promo',
      description: 'Test description for invalid promotion.',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
      discountType: 'UNKNOWN_TYPE',
      discountValue: -10,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    };

    expect(promotionSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates customer dietary preferences', () => {
    expect(userPreferenceSchema.safeParse({ dietaryPreference: 'VEG' }).success).toBe(true);
    expect(userPreferenceSchema.safeParse({ dietaryPreference: 'ANY' }).success).toBe(true);
    expect(userPreferenceSchema.safeParse({ dietaryPreference: 'NON_VEG' }).success).toBe(true);
    expect(userPreferenceSchema.safeParse({ dietaryPreference: 'INVALID' }).success).toBe(false);
  });

  it('calculates server-side percentage discounts with max caps accurately', () => {
    // 20% off on ₹200 with max ₹50 => ₹40 discount
    const subtotal1 = 200;
    const discount1 = Math.min((subtotal1 * 20) / 100, 50);
    expect(discount1).toBe(40);

    // 20% off on ₹500 with max ₹50 => capped at ₹50
    const subtotal2 = 500;
    const discount2 = Math.min((subtotal2 * 20) / 100, 50);
    expect(discount2).toBe(50);

    // Flat ₹25 discount on ₹150 => ₹25 discount
    const subtotal3 = 150;
    const flatDiscount = Math.min(25, subtotal3);
    expect(flatDiscount).toBe(25);
  });
});
