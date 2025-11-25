'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import StarRating from './StarRating';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Review {
  id: string;
  adRating: number;
  sellerRating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewsSectionProps {
  adId: string;
  sellerId: string;
}

export default function ReviewsSection({ adId, sellerId }: ReviewsSectionProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [adRating, setAdRating] = useState(0);
  const [sellerRating, setSellerRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [adId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?adId=${adId}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      
      // Calculate average ratings
      if (data.reviews && data.reviews.length > 0) {
        const avgAdRating = data.reviews.reduce((sum: number, r: Review) => sum + r.adRating, 0) / data.reviews.length;
        const avgSellerRating = data.reviews.reduce((sum: number, r: Review) => sum + r.sellerRating, 0) / data.reviews.length;
        // These are just for display, we don't store them
      }

      // Check if current user has already reviewed
      if (session?.user?.id) {
        const userReview = data.reviews?.find((r: Review) => r.reviewer.id === session.user.id);
        setHasReviewed(!!userReview);
        if (userReview) {
          setAdRating(userReview.adRating);
          setSellerRating(userReview.sellerRating);
          setComment(userReview.comment || '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast.error('Необходимо войти для оставления отзыва');
      return;
    }

    if (adRating === 0 || sellerRating === 0) {
      toast.error('Пожалуйста, выберите оценку для объявления и продавца');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: hasReviewed ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          reviewedUserId: sellerId,
          adRating,
          sellerRating,
          comment: comment.trim() || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка при отправке отзыва');
      }

      toast.success(hasReviewed ? 'Отзыв обновлен' : 'Отзыв добавлен');
      setHasReviewed(true);
      setComment('');
      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при отправке отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  const averageAdRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.adRating, 0) / reviews.length
    : 0;
  const averageSellerRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.sellerRating, 0) / reviews.length
    : 0;

  return (
    <section className="rounded-[32px] border border-neutral-900 bg-[#05070f] p-8 shadow-[0_20px_45px_rgba(0,0,0,0.45)] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Reviews</p>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mt-1">
            <MessageSquare className="h-6 w-6 text-primary-400" />
            Отзывы ({reviews.length})
          </h2>
        </div>
      </div>

      {/* Average Ratings */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-neutral-900 bg-[#0b101c] p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-3">Средняя оценка объявления</p>
            <StarRating rating={averageAdRating} showNumber size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-3">Средняя оценка продавца</p>
            <StarRating rating={averageSellerRating} showNumber size={24} />
          </div>
        </div>
      )}

      {/* Review Form */}
      {session?.user && session.user.id !== sellerId && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-900 bg-[#0b101c] p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">
            {hasReviewed ? 'Обновить отзыв' : 'Оставить отзыв'}
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-3">
                Оценка объявления
              </label>
              <StarRating
                rating={adRating}
                interactive
                onRatingChange={setAdRating}
                size={28}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-3">
                Оценка продавца
              </label>
              <StarRating
                rating={sellerRating}
                interactive
                onRatingChange={setSellerRating}
                size={28}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-3">
                Комментарий (необязательно)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Поделитесь своим мнением..."
                rows={4}
                className="w-full rounded-2xl border border-neutral-800 bg-dark-bg px-4 py-3 text-white placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || adRating === 0 || sellerRating === 0}
              className="w-full rounded-2xl bg-primary-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Отправка...' : hasReviewed ? 'Обновить отзыв' : 'Отправить отзыв'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <p className="text-neutral-500 text-center py-8">Загрузка отзывов...</p>
      ) : reviews.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">Пока нет отзывов</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-neutral-900 bg-[#0b101c] p-5 space-y-3"
            >
              <div className="flex items-start gap-3">
                <a 
                  href={`/profile?userId=${review.reviewer.id}`}
                  className="block hover:opacity-80 transition-opacity"
                  title="Открыть профиль пользователя"
                >
                  {review.reviewer.image ? (
                    <img
                      src={review.reviewer.image}
                      alt={review.reviewer.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-300 font-semibold border border-primary-500/30 cursor-pointer">
                      {(review.reviewer.name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </a>
                <div className="flex-1">
                  <a 
                    href={`/profile?userId=${review.reviewer.id}`}
                    className="font-semibold text-white hover:text-primary-400 transition-colors cursor-pointer"
                    title="Открыть профиль пользователя"
                  >
                    {review.reviewer.name || 'Анонимный пользователь'}
                  </a>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mt-1">
                    {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">Объявление:</span>
                  <StarRating rating={review.adRating} size={16} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">Продавец:</span>
                  <StarRating rating={review.sellerRating} size={16} />
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-neutral-300 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

















