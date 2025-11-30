// In-memory storage for call signals (in production, use Redis)
interface CallSignal {
  offer?: any; // RTCSessionDescriptionInit
  answer?: any; // RTCSessionDescriptionInit
  iceCandidates: any[]; // RTCIceCandidateInit[]
  timestamp: number;
}

export const callSignals = new Map<string, CallSignal>();

// Cleanup old signals (older than 1 minute)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of callSignals.entries()) {
    if (now - value.timestamp > 60000) {
      callSignals.delete(key);
    }
  }
}, 30000);

export function getCallKey(fromUserId: string, toUserId: string): string {
  return `${fromUserId}-${toUserId}`;
}

export function removeCallSignal(fromUserId: string, toUserId: string): void {
  const callKey = getCallKey(fromUserId, toUserId);
  callSignals.delete(callKey);
}

