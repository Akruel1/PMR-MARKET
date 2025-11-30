'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import CallModal from './CallModal';

export default function GlobalCallHandler() {
  const { data: session, status } = useSession();
  const [incomingCall, setIncomingCall] = useState<{
    fromUserId: string;
    fromUserName: string | null;
    fromUserImage: string | null;
    fromUserEmail: string | null;
  } | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const lastCheckedCallIdRef = useRef<string | null>(null);
  const hasNotifiedRejectRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    const checkIncomingCalls = async () => {
      try {
        const response = await fetch('/api/calls/incoming');
        if (!response.ok) return;

        const data = await response.json();
        const calls = data.incomingCalls || [];

        if (calls.length > 0 && !isCallModalOpen) {
          // Get the most recent call
          const latestCall = calls[0];
          const callId = `${latestCall.fromUserId}-${session.user.id}`;
          
          // Only show if it's a new call (different from last checked)
          if (callId !== lastCheckedCallIdRef.current) {
            lastCheckedCallIdRef.current = callId;
            hasNotifiedRejectRef.current = false; // Reset reject notification flag
            setIncomingCall(latestCall);
            setIsIncomingCall(true);
            setIsCallModalOpen(true);

            // Play notification sound (optional)
            // Uncomment and add sound file to /public/sounds/incoming-call.mp3 if you want sound notifications
            // try {
            //   const audio = new Audio('/sounds/incoming-call.mp3');
            //   audio.volume = 0.5;
            //   audio.play().catch(() => {});
            // } catch (error) {
            //   // Silent fail if sound file doesn't exist
            // }
          }
        } else if (calls.length === 0) {
          lastCheckedCallIdRef.current = null;
          hasNotifiedRejectRef.current = false;
        }
      } catch (error) {
        // Silent fail
      }
    };

    // Check every 2 seconds
    const interval = setInterval(checkIncomingCalls, 2000);

    return () => clearInterval(interval);
  }, [session, status, isCallModalOpen]);

  const handleAccept = () => {
    setIsIncomingCall(false);
  };

  const handleReject = async () => {
    if (incomingCall && session?.user?.id && !hasNotifiedRejectRef.current) {
      hasNotifiedRejectRef.current = true; // Prevent multiple notifications
      // Notify server that call was rejected
      // For incoming calls, we send as the receiver (toUserId is the caller)
      try {
        await fetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'reject',
            fromUserId: session.user.id, // Current user rejecting
            toUserId: incomingCall.fromUserId, // The caller
          }),
        });
        console.log('[CALL] Notified server about call rejection');
      } catch (error) {
        console.error('[CALL] Error notifying call rejection:', error);
      }
    }
    setIsCallModalOpen(false);
    setIsIncomingCall(false);
    setIncomingCall(null);
    lastCheckedCallIdRef.current = null;
  };

  const handleEnd = async () => {
    if (incomingCall && session?.user?.id) {
      // Notify server that call has ended
      try {
        await fetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'end-call',
            fromUserId: session.user.id, // Current user ending call
            toUserId: incomingCall.fromUserId, // The caller
          }),
        });
        console.log('[CALL] Notified server about call end');
      } catch (error) {
        console.error('[CALL] Error notifying call end:', error);
      }
    }
    setIsCallModalOpen(false);
    setIsIncomingCall(false);
    setIncomingCall(null);
    lastCheckedCallIdRef.current = null;
    hasNotifiedRejectRef.current = false;
  };

  if (!session?.user?.id || !incomingCall) return null;

  return (
    <CallModal
      isOpen={isCallModalOpen}
      isIncoming={isIncomingCall}
      callerName={incomingCall.fromUserName || incomingCall.fromUserEmail || 'Пользователь'}
      callerImage={incomingCall.fromUserImage || undefined}
      onAccept={handleAccept}
      onReject={handleReject}
      onEnd={handleEnd}
      otherUserId={incomingCall.fromUserId}
      currentUserId={session.user.id}
    />
  );
}

