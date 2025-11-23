import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/messages/unread-count - Get unread message count
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const unreadCount = await prisma.message.count({
      where: {
        toUserId: user.id,
        read: false,
      },
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}

















