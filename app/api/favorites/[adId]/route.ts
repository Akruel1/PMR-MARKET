import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/favorites/[adId] - Check if ad is favorited
export async function GET(
  request: NextRequest,
  { params }: { params: { adId: string } }
) {
  try {
    const user = await requireAuth();

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_adId: {
          userId: user.id,
          adId: params.adId,
        },
      },
    });

    return NextResponse.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    return NextResponse.json(
      { error: 'Failed to check favorite' },
      { status: 500 }
    );
  }
}

// POST /api/favorites/[adId] - Toggle favorite
export async function POST(
  request: NextRequest,
  { params }: { params: { adId: string } }
) {
  try {
    const user = await requireAuth();

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_adId: {
          userId: user.id,
          adId: params.adId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: {
          userId_adId: {
            userId: user.id,
            adId: params.adId,
          },
        },
      });
      return NextResponse.json({ isFavorite: false });
    } else {
      await prisma.favorite.create({
        data: {
          userId: user.id,
          adId: params.adId,
        },
      });
      return NextResponse.json({ isFavorite: true });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}




















