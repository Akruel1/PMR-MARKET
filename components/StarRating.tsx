'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showNumber?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  showNumber = false,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const filledStars = Math.round(rating);
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <div className="flex items-center">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            disabled={!interactive}
            className={`
              ${interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
              transition-transform duration-150
              touch-manipulation
            `}
          >
            <Star
              size={size}
              className={`
                ${star <= filledStars ? 'fill-accent-500 text-accent-500' : 'fill-neutral-700 text-neutral-700'}
                transition-colors duration-150
              `}
            />
          </button>
        ))}
      </div>
      {showNumber && (
        <span className="text-dark-textSecondary ml-1 text-xs sm:text-sm">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}


























