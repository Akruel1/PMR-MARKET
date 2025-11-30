import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { callSignals, getCallKey } from '@/lib/callSignals';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, offer, answer, candidate, fromUserId, toUserId } = body;

    if (fromUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const callKey = getCallKey(fromUserId, toUserId);

    if (type === 'offer') {
      callSignals.set(callKey, {
        offer: offer,
        iceCandidates: [],
        timestamp: Date.now(),
      });
      return NextResponse.json({ success: true });
    }

    if (type === 'answer') {
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

