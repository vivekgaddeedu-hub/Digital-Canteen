import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promotionId } = await params;
    const body = await req.json();
    const eventType = body.eventType === 'CLICK' ? 'CLICK' : 'IMPRESSION';

    const user = await getSessionUser(req);
    const userId = user?.userId || null;

    if (eventType === 'CLICK') {
      await prisma.promotionClick.create({
        data: {
          promotionId,
          userId,
        },
      });
      // In PostgreSQL, we can track clicks
    } else {
      await prisma.promotionImpression.create({
        data: {
          promotionId,
          userId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Promotion event logging error:', error);
    // Return 200 with error false so telemetry failures never break user experience
    return NextResponse.json({ success: false });
  }
}
