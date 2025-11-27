import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const createReviewSchema = z.object({
  adId: z.string(),
  reviewedUserId: z.string(),
  adRating: z.number().min(1).max(5),
  sellerRating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
});

// GET /api/reviews - Get reviews for an ad
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adId = searchParams.get('adId');

    if (!adId) {
      return NextResponse.json({ error: 'adId is required' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { adId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = createReviewSchema.parse(body);

    // Check if user already reviewed this ad
    const existingReview = await prisma.review.findUnique({
      where: {
        adId_reviewerId: {
          adId: data.adId,
          reviewerId: user.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this ad. Use PUT to update.' },
        { status: 400 }
      );
    }

    // Verify the ad exists and belongs to reviewedUserId
    const ad = await prisma.ad.findUnique({
      where: { id: data.adId },
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    if (ad.userId !== data.reviewedUserId) {
      return NextResponse.json(
        { error: 'Reviewed user does not match ad owner' },
        { status: 400 }
      );
    }

    // Cannot review own ad
    if (ad.userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot review your own ad' },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        adId: data.adId,
        reviewerId: user.id,
        reviewedUserId: data.reviewedUserId,
        adRating: data.adRating,
        sellerRating: data.sellerRating,
        comment: data.comment || null,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to create review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}

// PUT /api/reviews - Update an existing review
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = createReviewSchema.parse(body);

    const existingReview = await prisma.review.findUnique({
      where: {
        adId_reviewerId: {
          adId: data.adId,
          reviewerId: user.id,
        },
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const review = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        adRating: data.adRating,
        sellerRating: data.sellerRating,
        comment: data.comment || null,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ review });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update review' },
      { status: 500 }
    );
  }
}

























