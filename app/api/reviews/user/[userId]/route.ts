import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reviews/user/[userId] - Get average seller rating for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    const reviews = await prisma.review.findMany({
      where: { reviewedUserId: userId },
      select: {
        sellerRating: true,
      },
    });

    if (reviews.length === 0) {
      return NextResponse.json({
        averageRating: 0,
        totalReviews: 0,
      });
    }

    const averageRating =
      reviews.reduce((sum, r) => sum + r.sellerRating, 0) / reviews.length;

    return NextResponse.json({
      averageRating,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error('Failed to fetch user rating:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rating' },
      { status: 500 }
    );
  }
}

























