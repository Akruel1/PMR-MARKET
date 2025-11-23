'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface ReportActionButtonsProps {
  reportId: string;
  type: 'ad' | 'user';
}

export default function ReportActionButtons({ reportId, type }: ReportActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'resolve' | 'dismiss') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports/${type}/${reportId}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      toast.success(`Жалоба ${action === 'resolve' ? 'принята' : 'отклонена'}`);
      router.refresh();
    } catch (error) {
      toast.error('Ошибка при обработке жалобы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction('resolve')}
        disabled={loading}
        className="rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/40 disabled:opacity-50"
        title="Принять жалобу"
      >
        <CheckCircle2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleAction('dismiss')}
        disabled={loading}
        className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/40 disabled:opacity-50"
        title="Отклонить жалобу"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
}



