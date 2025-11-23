'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';

interface ReportButtonProps {
  adId: string;
  variant?: 'button' | 'icon';
}

export default function ReportButton({ adId, variant = 'button' }: ReportButtonProps) {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async () => {
    if (!session?.user) {
      toast.error('Please sign in to report');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adId,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit report' }));
        throw new Error(errorData.error || 'Failed to submit report');
      }

      const data = await response.json();
      toast.success(data.message || 'Report submitted successfully');
      setShowModal(false);
      setReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={() => setShowModal(true)}
          className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
          title="Report"
        >
          <Flag className="h-5 w-5" />
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-neutral-700 text-dark-textSecondary hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
        >
          <Flag className="h-4 w-4" />
          <span>Пожаловаться</span>
        </button>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-dark-bg2 border border-neutral-700 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-dark-text mb-4">Пожаловаться на объявление</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Укажите причину жалобы..."
              className="w-full h-32 px-4 py-2 rounded-lg bg-dark-bg border border-neutral-700 text-dark-textSecondary placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex justify-end space-x-3 mt-4">
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

