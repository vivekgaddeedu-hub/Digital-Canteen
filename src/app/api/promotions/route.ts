import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getPersonalizedPromotions } from '@/lib/recommendations';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const canteenId = req.nextUrl.searchParams.get('canteenId') || undefined;

    const promotions = await getPersonalizedPromotions(user?.userId, canteenId);

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotional offers.' },
      { status: 500 }
    );
  }
}
