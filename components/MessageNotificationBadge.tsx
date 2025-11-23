'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function MessageNotificationBadge() {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || status !== 'authenticated' || !session?.user) return;

    // Fetch unread count
    async function fetchUnreadCount() {
      try {
        const response = await fetch('/api/messages/unread-count');
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    }

    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [mounted, session, status]);

  // Always render the same structure to avoid hydration issues
  if (!mounted || !unreadCount) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}















