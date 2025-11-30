import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { callSignals } from '@/lib/callSignals';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check for incoming calls (offers where toUserId matches current user)
    const incomingCalls: Array<{
      fromUserId: string;
      fromUserName: string | null;
      fromUserImage: string | null;
      fromUserEmail: string | null;
    }> = [];

    for (const [key, signal] of callSignals.entries()) {
      // Key format: "fromUserId-toUserId"
      const [fromUserId, toUserId] = key.split('-');
      
      if (toUserId === userId && signal.offer && !signal.answer) {
        // This is an incoming call that hasn't been answered yet
        // Check if it's recent (within last 30 seconds)
        const callAge = Date.now() - signal.timestamp;
        console.log(`[CALL] Checking incoming call from ${fromUserId} to ${toUserId}, age: ${callAge}ms`);
        if (callAge < 30000) {
          // Get user info
          try {
            const user = await prisma.user.findUnique({
              where: { id: fromUserId },
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            });

            if (user) {
              incomingCalls.push({
                fromUserId: user.id,
                fromUserName: user.name,
                fromUserImage: user.image,
                fromUserEmail: user.email,
              });
            }
          } catch (error) {
            console.error('Error fetching user info:', error);
          }
        }
      }
    }

    return NextResponse.json({ incomingCalls });
  } catch (error) {
    console.error('Error fetching incoming calls:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

