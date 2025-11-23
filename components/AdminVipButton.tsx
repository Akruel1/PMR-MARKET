'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminVipButtonProps {
  adId: string;
  adTitle: string;
  isVip?: boolean;
  vipExpiresAt?: Date | null;
  status: string;
}

export default function AdminVipButton({ adId, adTitle, isVip, vipExpiresAt, status }: AdminVipButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vipModal, setVipModal] = useState(false);
  const [vipDays, setVipDays] = useState(7);

  const isVipActive = isVip && (!vipExpiresAt || new Date(vipExpiresAt) >= new Date());

  const handleSetVip = async () => {
    if (status !== 'APPROVED') {
      toast.error('Сначала нужно одобрить объявление');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ads/${adId}/vip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: vipDays }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set VIP');
      }

      toast.success(`VIP статус установлен на ${vipDays} дней`);
      setVipModal(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Не удалось установить VIP статус');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVip = async () => {
    if (!confirm('Вы уверены, что хотите снять VIP статус с этого объявления?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ads/${adId}/vip`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove VIP');
      }

      toast.success('VIP статус снят');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Не удалось снять VIP статус');
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'APPROVED') {
    return (
      <button
        onClick={() => toast.error('Сначала нужно одобрить объявление')}
        disabled={true}
        className="w-full rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-300 opacity-50 cursor-not-allowed"
        title="Сначала нужно одобрить объявление"
      >
        <Crown className="h-4 w-4 inline mr-2" />
        Установить VIP
      </button>
    );
  }

  return (
    <>
      {isVipActive ? (
        <button
          onClick={handleRemoveVip}
          disabled={loading}
          className="w-full rounded-2xl border border-red-500 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <XCircle className="h-4 w-4" />
          Снять VIP
        </button>
      ) : (
        <button
          onClick={() => setVipModal(true)}
          disabled={loading}
          className="w-full rounded-2xl border border-yellow-500 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Crown className="h-4 w-4" />
          Установить VIP
        </button>
      )}

      {vipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setVipModal(false)}>
          <div
            className="w-full max-w-md rounded-3xl border border-yellow-500/50 bg-[#05070f] p-6 shadow-[0_20px_60px_rgba(234,179,8,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-6 w-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">Установить VIP статус</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-4">
              Выберите срок действия VIP статуса для объявления "{adTitle}"
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-neutral-300 mb-2 block">Срок действия (дней)</span>
                <select
                  value={vipDays}
                  onChange={(e) => setVipDays(Number(e.target.value))}
                  className="w-full rounded-2xl border border-neutral-800 bg-dark-bg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                >
                  <option value={1}>1 день</option>
                  <option value={3}>3 дня</option>
                  <option value={7}>7 дней</option>
                  <option value={14}>14 дней</option>
                  <option value={30}>30 дней</option>
                  <option value={0}>Без ограничений</option>
                </select>
              </label>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setVipModal(false)}
                  className="rounded-2xl border border-neutral-800 px-4 py-2 text-sm font-semibold text-white hover:border-primary-500"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSetVip}
                  disabled={loading}
                  className="rounded-2xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-600 disabled:opacity-50"
                >
                  {loading ? 'Установка...' : 'Установить VIP'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

