'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminDeleteButton from '@/components/AdminDeleteButton';

interface AdminActionsProps {
  adId: string;
  adTitle: string;
}

export default function AdminActions({ adId, adTitle }: AdminActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [reason, setReason] = useState('');

  const approve = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ads/${adId}/approve`, { method: 'POST' });
      if (!response.ok) throw new Error();
      toast.success('Объявление одобрено');
      router.refresh();
    } catch {
      toast.error('Не удалось одобрить объявление');
    } finally {
      setLoading(false);
    }
  };

  const reject = async () => {
    if (!reason.trim()) {
      toast.error('Укажите причину отклонения');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ads/${adId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!response.ok) throw new Error();
      toast.success('Объявление отклонено');
      setRejectModal(false);
      setReason('');
      router.refresh();
    } catch {
      toast.error('Не удалось отклонить объявление');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={approve}
          disabled={loading}
          className="rounded-full border border-emerald-500 px-4 py-1 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500 hover:text-white disabled:opacity-50"
        >
          Одобрить
        </button>
        <button
          onClick={() => setRejectModal(true)}
          disabled={loading}
          className="rounded-full border border-red-500 px-4 py-1 text-sm font-semibold text-red-200 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
        >
          Отклонить
        </button>
        <AdminDeleteButton adId={adId} adTitle={adTitle} onDeleted={() => router.refresh()} />
      </div>

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setRejectModal(false)}>
          <div
            className="w-full max-w-md rounded-3xl border border-neutral-800 bg-[#05070f] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white">Отклонить объявление</h3>
            <p className="mt-2 text-sm text-neutral-400">
              "{adTitle}" — укажите причину, она будет отправлена продавцу вместе с уведомлением.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-2xl border border-neutral-800 bg-dark-bg px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
              placeholder="Например: не хватает реальных фото, уточните состояние товара..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectModal(false)}
                className="rounded-2xl border border-neutral-800 px-4 py-2 text-sm font-semibold text-white hover:border-primary-500"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={reject}
                disabled={loading}
                className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

