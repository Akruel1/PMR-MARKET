import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot ban admin users' },
        { status: 400 }
      );
    }

    // Ban the user
    await prisma.user.update({
      where: { id: params.id },
      data: {
        banned: true,
      },
    });

    // Send message to user
    await prisma.message.create({
      data: {
        fromUserId: admin.id,
        toUserId: params.id,
        text: `Ваш аккаунт был заблокирован модератором. Причина: ${reason || 'Нарушение правил использования сервиса'}`,
        read: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to ban user' },
      { status: 500 }
    );
  }
}























