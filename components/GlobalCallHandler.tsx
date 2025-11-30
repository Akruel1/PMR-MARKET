'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    let lastCheckedCallId: string | null = null;

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
          if (callId !== lastCheckedCallId) {
            lastCheckedCallId = callId;
            setIncomingCall(latestCall);
            setIsIncomingCall(true);
            setIsCallModalOpen(true);

            // Play notification sound (optional)
            try {
              const audio = new Audio('/sounds/incoming-call.mp3');
              audio.volume = 0.5;
              // audio.play().catch(() => {}); // Uncomment if you have a sound file
            } catch (error) {
              // Silent fail if sound file doesn't exist
            }
          }
        } else if (calls.length === 0) {
          lastCheckedCallId = null;
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

  const handleReject = () => {
    setIsCallModalOpen(false);
    setIsIncomingCall(false);
    setIncomingCall(null);
  };

  const handleEnd = () => {
    setIsCallModalOpen(false);
    setIsIncomingCall(false);
    setIncomingCall(null);
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

