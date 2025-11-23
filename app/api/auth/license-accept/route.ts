import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user license acceptance
    await prisma.user.update({
      where: { id: user.id },
      data: {
        licenseAccepted: true,
        licenseAcceptedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error accepting license:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept license' },
      { status: 500 }
    );
  }
}

















