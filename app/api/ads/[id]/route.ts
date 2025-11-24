import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateAdSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  price: z.number().positive().optional(),
  currency: z.enum(['USD', 'EUR', 'RUB', 'MDL']).optional(),
  condition: z.enum(['NEW', 'USED']).optional(),
  cityId: z.string().optional(),
  categoryId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// GET /api/ads/[id] - Get single ad
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ad = await prisma.ad.findUnique({
      where: { id: params.id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        category: true,
        city: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            views: true,
          },
        },
      },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Ad not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.view.create({
      data: {
        adId: ad.id,
        ip: request.headers.get('x-forwarded-for') || undefined,
      },
    });

    await prisma.ad.update({
      where: { id: ad.id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(ad);
  } catch (error) {
    console.error('Error fetching ad:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad' },
      { status: 500 }
    );
  }
}

// PUT /api/ads/[id] - Update ad
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const ad = await prisma.ad.findUnique({
      where: { id: params.id },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Ad not found' },
        { status: 404 }
      );
    }

    // Check if user owns the ad or is admin
    if (ad.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateAdSchema.parse(body);

    const updatedAd = await prisma.ad.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        images: true,
        category: true,
        city: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAd);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating ad:', error);
    return NextResponse.json(
      { error: 'Failed to update ad' },
      { status: 500 }
    );
  }
}

// DELETE /api/ads/[id] - Delete ad
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const ad = await prisma.ad.findUnique({
      where: { id: params.id },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Ad not found' },
        { status: 404 }
      );
    }

    // Check if user owns the ad or is admin
    if (ad.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await prisma.ad.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { error: 'Failed to delete ad' },
      { status: 500 }
    );
  }
}




















