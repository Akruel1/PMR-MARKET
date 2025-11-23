import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { redis } from '@/lib/redis';

// POST /api/messages/typing - Notify that user is typing
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { toUserId } = await request.json();

    if (!toUserId || typeof toUserId !== 'string') {
      return NextResponse.json({ error: 'toUserId is required' }, { status: 400 });
    }

    // Store typing status in Redis with 3 second TTL
    const key = `typing:${user.id}:${toUserId}`;
    await redis.setEx(key, 3, '1'); // Expires in 3 seconds
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting typing status:', error);
    return NextResponse.json({ error: 'Failed to set typing status' }, { status: 500 });
  }
}

// GET /api/messages/typing?userId=... - Check if user is typing
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const otherUserId = request.nextUrl.searchParams.get('userId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Check if other user is typing
    const key = `typing:${otherUserId}:${user.id}`;
    const isTyping = await redis.get(key);
    
    return NextResponse.json({ isTyping: isTyping === '1' });
  } catch (error) {
    console.error('Error checking typing status:', error);
    return NextResponse.json({ error: 'Failed to check typing status' }, { status: 500 });
  }
}

