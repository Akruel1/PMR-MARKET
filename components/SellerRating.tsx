'use client';

import { useState, useEffect } from 'react';
import StarRating from './StarRating';

interface SellerRatingProps {
  userId: string;
  size?: number;
  showNumber?: boolean;
  showCount?: boolean;
}

export default function SellerRating({
  userId,
  size = 20,
  showNumber = true,
  showCount = true,
}: SellerRatingProps) {
  const [rating, setRating] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRating() {
      try {
        const res = await fetch(`/api/reviews/user/${userId}`);
        const data = await res.json();
        setRating(data.averageRating || 0);
        setCount(data.totalReviews || 0);
      } catch (error) {
        console.error('Failed to fetch seller rating:', error);
      } finally {
        setLoading(false);
      }
    }
    if (userId) {
      fetchRating();
    }
  }, [userId]);

  if (loading) {
    return <span className="text-neutral-500 text-sm">Загрузка...</span>;
  }

  if (count === 0) {
    return <span className="text-neutral-500 text-sm">Нет оценок</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <StarRating rating={rating} size={size} showNumber={showNumber} />
      {showCount && (
        <span className="text-sm text-neutral-500">
          ({count} {count === 1 ? 'отзыв' : count < 5 ? 'отзыва' : 'отзывов'})
        </span>
      )}
    </div>
  );
}




















