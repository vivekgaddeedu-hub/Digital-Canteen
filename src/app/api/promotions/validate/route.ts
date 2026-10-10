import { NextRequest, NextResponse } from 'next/server';
import { validatePromotionCode } from '@/lib/recommendations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { promoCode, subtotal, canteenId } = body;

    if (!promoCode || typeof promoCode !== 'string') {
      return NextResponse.json(
        { error: 'Please enter a valid promo code.' },
        { status: 400 }
      );
    }

    const subtotalNumber = Number(subtotal);
    if (isNaN(subtotalNumber) || subtotalNumber < 0) {
      return NextResponse.json(
        { error: 'Invalid order subtotal.' },
        { status: 400 }
      );
    }

    const result = await validatePromotionCode(promoCode, subtotalNumber, canteenId);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Invalid promo code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      discountAmount: result.discountAmount,
      promotion: result.promotion,
    });
  } catch (error) {
    console.error('Validate promotion code error:', error);
    return NextResponse.json(
      { error: 'Failed to validate promo code.' },
      { status: 500 }
    );
  }
}
