'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminDeleteButtonProps {
  adId: string;
  adTitle: string;
  onDeleted?: () => void;
  variant?: 'icon' | 'button';
}

export default function AdminDeleteButton({ adId, adTitle, onDeleted, variant = 'button' }: AdminDeleteButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/ads/${adId}?reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete ad');
      }

      toast.success('Объявление удалено');
      setShowModal(false);
      setReason('');
      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/admin');
      }
    } catch (error) {
      toast.error('Не удалось удалить объявление');
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          title="Удалить объявление"
        >
          <Trash2 className="h-4 w-4" />
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
              <h3 className="text-xl font-bold text-white mb-2">Удалить объявление</h3>
              <p className="text-neutral-400 mb-4">"{adTitle}"</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Причина удаления..."
                className="w-full h-32 px-4 py-2 rounded-lg bg-dark-bg border border-neutral-700 text-neutral-300 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting || !reason.trim()}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center space-x-2"
      >
        <Trash2 className="h-4 w-4" />
        <span>Удалить</span>
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
            <h3 className="text-xl font-bold text-dark-text mb-2">Удалить объявление</h3>
            <p className="text-dark-textSecondary mb-4">"{adTitle}"</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Причина удаления..."
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
                onClick={handleDelete}
                disabled={submitting || !reason.trim()}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

