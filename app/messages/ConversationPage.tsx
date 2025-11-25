'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import MessagesPage from './page';

export default function ConversationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  useEffect(() => {
    if (userId) {
      // Set selected conversation in MessagesPage
      // This is a workaround - ideally we'd pass this as a prop
      window.dispatchEvent(new CustomEvent('selectConversation', { detail: userId }));
    }
  }, [userId]);

  return <MessagesPage />;
}























