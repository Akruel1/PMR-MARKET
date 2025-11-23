import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const vipSchema = z.object({
  days: z.number().min(0).max(365),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { days } = vipSchema.parse(body);

    const ad = await prisma.ad.findUnique({
      where: { id: params.id },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Объявление не найдено' },
        { status: 404 }
      );
    }

    if (ad.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Можно установить VIP только для одобренных объявлений' },
        { status: 400 }
      );
    }

    // Calculate expiration date
    const vipExpiresAt = days === 0 
      ? null 
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const updatedAd = await prisma.ad.update({
      where: { id: params.id },
      data: {
        isVip: true,
        vipExpiresAt,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
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

    return NextResponse.json({
      success: true,
      ad: updatedAd,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error setting VIP status:', error);
    return NextResponse.json(
      { error: 'Не удалось установить VIP статус' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const ad = await prisma.ad.findUnique({
      where: { id: params.id },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Объявление не найдено' },
        { status: 404 }
      );
    }

    const updatedAd = await prisma.ad.update({
      where: { id: params.id },
      data: {
        isVip: false,
        vipExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      ad: updatedAd,
    });
  } catch (error) {
    console.error('Error removing VIP status:', error);
    return NextResponse.json(
      { error: 'Не удалось снять VIP статус' },
      { status: 500 }
    );
  }
}

