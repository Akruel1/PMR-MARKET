'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeleteAdButtonProps {
  adId: string;
  adTitle: string;
  onDeleted?: () => void;
  variant?: 'icon' | 'button';
}

export default function DeleteAdButton({ adId, adTitle, onDeleted, variant = 'button' }: DeleteAdButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/ads/${adId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete ad');
      }

      toast.success('Объявление удалено');
      setShowModal(false);
      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/profile');
      }
    } catch (error: any) {
      toast.error(error.message || 'Не удалось удалить объявление');
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
          title="Удалить объявление"
        >
          <Trash2 className="h-5 w-5" />
        </button>

        {showModal && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowModal(false)}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div
              className="bg-dark-bg2 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Удалить объявление</h3>
              <p className="text-sm sm:text-base text-neutral-400 mb-4">Вы уверены, что хотите удалить "{adTitle}"?</p>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
        className="flex items-center gap-2 rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 hover:border-red-500"
      >
        <Trash2 className="h-4 w-4" />
        <span>Удалить объявление</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div
            className="bg-dark-bg2 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Удалить объявление</h3>
            <p className="text-sm sm:text-base text-neutral-400 mb-4">Вы уверены, что хотите удалить "{adTitle}"?</p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600 transition-colors text-sm sm:text-base"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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



