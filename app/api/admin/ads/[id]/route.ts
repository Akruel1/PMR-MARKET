import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendAdRejectedTelegram } from '@/lib/telegram';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const reason = request.nextUrl.searchParams.get('reason') || undefined;

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

    await prisma.ad.delete({ where: { id: params.id } });

    if (ad.user.telegramChatId && ad.user.telegramBotLicenseAccepted) {
      await sendAdRejectedTelegram(
        ad.user.telegramChatId,
        ad.user.name || ad.user.email || 'Пользователь',
        ad.title,
        reason || 'Объявление удалено модератором.'
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 });
  }
}

