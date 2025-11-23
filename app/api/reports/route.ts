import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { adId, reason } = await request.json();

    if (!adId || !reason) {
      return NextResponse.json(
        { error: 'Ad ID and reason are required' },
        { status: 400 }
      );
    }

    // Check if user already reported this ad
    const existingReport = await prisma.report.findFirst({
      where: {
        adId,
        userId: user.id,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this ad' },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        adId,
        userId: user.id,
        reason,
      },
    });

    // Check if ad has more than 10 reports
    const reportCount = await prisma.report.count({
      where: {
        adId,
        status: 'PENDING',
      },
    });

    if (reportCount >= 10) {
      // Auto-delete the ad
      await prisma.ad.update({
        where: { id: adId },
        data: {
          status: 'REJECTED',
        },
      });

      // Send message to ad owner
      const ad = await prisma.ad.findUnique({
        where: { id: adId },
        include: { user: true },
      });

      if (ad && ad.userId !== user.id) {
        // Find admin user to send message from
        const admin = await prisma.user.findFirst({
          where: { role: 'ADMIN' },
        });
        
        if (admin) {
          await prisma.message.create({
            data: {
              fromUserId: admin.id,
              toUserId: ad.userId,
              content: `Ваше объявление "${ad.title}" было автоматически удалено из-за большого количества жалоб (${reportCount}). Причина: превышение лимита жалоб.`,
              read: false,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create report' },
      { status: 500 }
    );
  }
}

