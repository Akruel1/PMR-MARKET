import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendAdApprovedTelegram } from '@/lib/telegram';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

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
      data: { status: 'APPROVED' },
    });

    if (ad.user.telegramChatId && ad.user.telegramBotLicenseAccepted) {
      await sendAdApprovedTelegram(
        ad.user.telegramChatId,
        ad.user.name || ad.user.email || 'Пользователь',
        ad.title,
        `${ad.slug}-${ad.id}`
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error approving ad:', error);
    return NextResponse.json({ error: 'Failed to approve ad' }, { status: 500 });
  }
}

