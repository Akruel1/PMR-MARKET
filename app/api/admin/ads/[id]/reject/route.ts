import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendAdRejectedTelegram } from '@/lib/telegram';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { reason } = await request.json();

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    const ad = await prisma.ad.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            telegramChatId: true,
            telegramBotLicenseAccepted: true,
          },
        },
      },
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    const updated = await prisma.ad.update({
      where: { id: params.id },
      data: { status: 'REJECTED' },
    });

    if (ad.user.telegramChatId && ad.user.telegramBotLicenseAccepted) {
      await sendAdRejectedTelegram(
        ad.user.telegramChatId,
        ad.user.name || ad.user.email || 'Пользователь',
        ad.title,
        reason.trim()
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error rejecting ad:', error);
    return NextResponse.json({ error: 'Failed to reject ad' }, { status: 500 });
  }
}

