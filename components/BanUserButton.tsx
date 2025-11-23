'use client';

import { useState } from 'react';
import { Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface BanUserButtonProps {
  userId: string;
  userName: string;
  onBanned?: () => void;
}

export default function BanUserButton({ userId, userName, onBanned }: BanUserButtonProps) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  const handleBan = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to ban user');
      }

      toast.success('User banned successfully');
      setShowModal(false);
      setReason('');
      if (onBanned) {
        onBanned();
      }
    } catch (error) {
      toast.error('Failed to ban user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center space-x-2"
      >
        <Ban className="h-4 w-4" />
        <span>Забанить</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-dark-bg2 border border-neutral-700 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-dark-text mb-2">Забанить пользователя</h3>
            <p className="text-dark-textSecondary mb-4">"{userName}"</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Причина бана..."
              className="w-full h-32 px-4 py-2 rounded-lg bg-dark-bg border border-neutral-700 text-dark-textSecondary placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleBan}
                disabled={submitting || !reason.trim()}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Блокировка...' : 'Забанить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

















