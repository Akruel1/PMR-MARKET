import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportedUserId, reason } = await request.json();

    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { error: 'User ID and reason are required' },
        { status: 400 }
      );
    }

    if (reportedUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot report yourself' },
        { status: 400 }
      );
    }

    // Check if user already reported this user
    const existingReport = await prisma.userReport.findFirst({
      where: {
        reportedUserId,
        reporterId: user.id,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this user' },
        { status: 400 }
      );
    }

    // Create report
    await prisma.userReport.create({
      data: {
        reportedUserId,
        reporterId: user.id,
        reason,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating user report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create report' },
      { status: 500 }
    );
  }
}























