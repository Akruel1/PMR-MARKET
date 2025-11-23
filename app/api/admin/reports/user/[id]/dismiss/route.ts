import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    await prisma.userReport.update({
      where: { id: params.id },
      data: { status: 'DISMISSED' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error dismissing user report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dismiss report' },
      { status: 500 }
    );
  }
}



