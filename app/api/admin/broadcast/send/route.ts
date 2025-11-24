import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendTelegramMessage } from '@/lib/telegram';
import { z } from 'zod';

const sendBroadcastSchema = z.object({
  message: z.string().min(1).max(4000),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validatedData = sendBroadcastSchema.parse(body);

    // Get all users who have accepted the bot license and have telegramChatId
    const users = await prisma.user.findMany({
      where: {
        telegramChatId: { not: null },
        telegramBotLicenseAccepted: true,
      },
      select: {
        id: true,
        telegramChatId: true,
        name: true,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    // Send message to each user
    for (const user of users) {
      if (user.telegramChatId) {
        try {
          const success = await sendTelegramMessage(
            user.telegramChatId,
            validatedData.message
          );
          if (success) {
            sentCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Failed to send to user ${user.id}:`, error);
          failedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      totalUsers: users.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error sending broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    );
  }
}















