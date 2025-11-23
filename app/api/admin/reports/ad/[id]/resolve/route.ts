import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    await prisma.report.update({
      where: { id: params.id },
      data: { status: 'RESOLVED' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resolving report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resolve report' },
      { status: 500 }
    );
  }
}



