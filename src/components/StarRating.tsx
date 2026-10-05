import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showScore?: boolean;
  showLabel?: boolean;
  reviewsCount?: number;
  className?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'ضعيف - لم يعجبني',
  2: 'مقبول - أقل من المتوقع',
  3: 'جيد - يلبي التوقعات',
  4: 'جيد جداً - راضٍ تماماً',
  5: 'ممتاز جداً - أنصح به بشدة',
};

const SIZE_MAP = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showScore = false,
  showLabel = false,
  reviewsCount,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const currentRating = hoverRating !== null ? hoverRating : rating;
  const starClass = SIZE_MAP[size] || SIZE_MAP.md;

  const handleClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex);
    }
  };

  const handleMouseEnter = (starIndex: number) => {
    if (interactive) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Stars Array */}
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = currentRating >= starValue;
          const isHalf = !isFilled && currentRating >= starValue - 0.5;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              className={`p-0.5 transition-transform ${
                interactive
                  ? 'cursor-pointer hover:scale-125 focus:outline-hidden active:scale-95'
                  : 'cursor-default'
              }`}
              title={interactive ? RATING_LABELS[starValue] : `${rating} من ${maxRating}`}
              aria-label={`${starValue} نجوم`}
            >
              <div className="relative">
                {/* Background Empty Star */}
                <Star
                  className={`${starClass} text-stone-300 stroke-[1.5] transition-colors ${
                    interactive && hoverRating !== null && hoverRating >= starValue
                      ? 'text-amber-400 fill-amber-400'
                      : ''
                  }`}
                />

                {/* Filled or Half Star Overlay */}
                {isFilled ? (
                  <Star
                    className={`absolute inset-0 ${starClass} text-amber-400 fill-amber-400 drop-shadow-xs transition-all`}
                  />
                ) : isHalf ? (
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star
                      className={`${starClass} text-amber-400 fill-amber-400 drop-shadow-xs`}
                    />
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Numeric Score */}
      {showScore && (
        <span className="font-extrabold text-stone-900 text-xs sm:text-sm mr-1 tracking-tight">
          {rating > 0 ? rating.toFixed(1) : 'جديد'}
        </span>
      )}

      {/* Reviews Count */}
      {reviewsCount !== undefined && (
        <span className="text-stone-400 text-xs">
          ({reviewsCount} {reviewsCount === 1 ? 'تقييم' : 'تقييماً'})
        </span>
      )}

      {/* Interactive Label on hover or selected */}
      {showLabel && interactive && (
        <span className="text-xs font-bold text-amber-600 mr-2 animate-in fade-in duration-150">
          {currentRating > 0 ? RATING_LABELS[Math.round(currentRating)] : 'انقر للتقييم'}
        </span>
      )}
    </div>
  );
};
