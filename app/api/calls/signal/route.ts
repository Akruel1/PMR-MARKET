import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { callSignals, getCallKey, removeCallSignal } from '@/lib/callSignals';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, offer, answer, candidate, fromUserId, toUserId } = body;

    const callKey = getCallKey(fromUserId, toUserId);

    // For end-call and reject, allow both users to send the signal
    if (type === 'end-call' || type === 'reject') {
      if (fromUserId !== session.user.id && toUserId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // For other types, only the caller can send
      if (fromUserId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (type === 'offer') {
      console.log(`[CALL] Offer received from ${fromUserId} to ${toUserId}`);
      callSignals.set(callKey, {
        offer: offer,
        iceCandidates: [],
        timestamp: Date.now(),
      });
      return NextResponse.json({ success: true });
    }

    if (type === 'answer') {
      console.log(`[CALL] Answer received from ${fromUserId} to ${toUserId}`);
      const existing = callSignals.get(callKey);
      if (existing) {
        existing.answer = answer;
        existing.timestamp = Date.now();
      } else {
        callSignals.set(callKey, {
          answer: answer,
          iceCandidates: [],
          timestamp: Date.now(),
        });
      }
      return NextResponse.json({ success: true });
    }

    if (type === 'ice-candidate') {
      const existing = callSignals.get(callKey);
      if (existing) {
        existing.iceCandidates.push(candidate);
      } else {
        callSignals.set(callKey, {
          iceCandidates: [candidate],
          timestamp: Date.now(),
        });
      }
      return NextResponse.json({ success: true });
    }

    if (type === 'end-call' || type === 'reject') {
      console.log(`[CALL] Call ended/rejected. User ${session.user.id} ending call between ${fromUserId} and ${toUserId}`);
      // Remove the call signal to stop notifications
      // Remove in both directions to handle any call direction
      removeCallSignal(fromUserId, toUserId);
      removeCallSignal(toUserId, fromUserId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error handling call signal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fromUserId = searchParams.get('fromUserId');
    const toUserId = searchParams.get('toUserId');
    const type = searchParams.get('type');

    if (!fromUserId || !toUserId || !type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (toUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const callKey = getCallKey(fromUserId, toUserId);
    const signal = callSignals.get(callKey);

    if (!signal) {
      return NextResponse.json({});
    }

    if (type === 'offer') {
      return NextResponse.json({ offer: signal.offer });
    }

    if (type === 'answer') {
      return NextResponse.json({ answer: signal.answer });
    }

    if (type === 'ice-candidates') {
      return NextResponse.json({ candidates: signal.iceCandidates });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching call signal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

