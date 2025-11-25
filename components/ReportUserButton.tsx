'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface ReportUserButtonProps {
  userId: string;
  userName: string;
}

export default function ReportUserButton({ userId, userName }: ReportUserButtonProps) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!session?.user || session.user.id === userId) {
    return null;
  }

  const handleReport = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/users/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedUserId: userId,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit report');
      }

      toast.success('Report submitted successfully');
      setShowModal(false);
      setReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-neutral-700 text-dark-textSecondary hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
      >
        <Flag className="h-4 w-4" />
        <span>Пожаловаться</span>
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
            <h3 className="text-xl font-bold text-dark-text mb-4">Пожаловаться на пользователя</h3>
            <p className="text-dark-textSecondary mb-4">"{userName}"</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Укажите причину жалобы..."
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
                onClick={handleReport}
                disabled={submitting || !reason.trim()}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}























