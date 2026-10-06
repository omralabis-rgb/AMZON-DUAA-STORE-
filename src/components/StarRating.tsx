import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface UnifiedStarRatingProps {
  rating?: number;
  value?: number;
  reviewsCount?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showNumeric?: boolean;
  showCount?: boolean;
  showLabel?: boolean;
  interactive?: boolean;
  disabled?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'سيء جداً (1 نجوم)',
  2: 'مقبول (2 نجوم)',
  3: 'جيد (3 نجوم)',
  4: 'جيد جداً (4 نجوم)',
  5: 'ممتاز وفاخر (5 نجوم)',
};

export const StarRating: React.FC<UnifiedStarRatingProps> = ({
  rating,
  value,
  reviewsCount,
  size = 'md',
  showNumeric = true,
  showCount = true,
  showLabel = false,
  interactive = false,
  disabled = false,
  onChange,
  className = '',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const currentScore = value !== undefined ? value : rating !== undefined ? rating : 5;
  const roundedRating = Math.min(5, Math.max(0, currentScore));
  const activeValue = hoverValue !== null ? hoverValue : roundedRating;

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  if (interactive) {
    return (
      <div className={`flex flex-col items-start gap-1 ${className}`}>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= activeValue;

            return (
              <button
                key={star}
                type="button"
                disabled={disabled}
                onClick={() => onChange?.(star)}
                onMouseEnter={() => setHoverValue(star)}
                onMouseLeave={() => setHoverValue(null)}
                className={`p-1 rounded-xl transition-all cursor-pointer focus:outline-hidden transform hover:scale-125 ${
                  disabled ? 'cursor-not-allowed opacity-50' : 'active:scale-95'
                }`}
                title={RATING_LABELS[star]}
                aria-label={RATING_LABELS[star]}
              >
                <Star
                  className={`${starSizes[size]} transition-all ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                      : 'text-stone-300 fill-stone-100 hover:text-amber-300'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {showLabel && (
          <span className="text-xs font-bold text-amber-700 transition-all">
            {RATING_LABELS[activeValue] || ''}
          </span>
        )}
      </div>
    );
  }

  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 >= 0.3 && roundedRating % 1 <= 0.7;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5" aria-label={`تقييم ${roundedRating} من 5`}>
        {[1, 2, 3, 4, 5].map((star) => {
          let starFill = 'text-stone-200 fill-stone-100';
          if (star <= fullStars) {
            starFill = 'text-amber-400 fill-amber-400';
          } else if (star === fullStars + 1 && hasHalfStar) {
            starFill = 'text-amber-400 fill-amber-200';
          }

          return (
            <Star
              key={star}
              className={`${starSizes[size]} ${starFill} transition-all shrink-0`}
            />
          );
        })}
      </div>

      {showNumeric && (
        <span className={`font-black text-stone-900 ${textSizes[size]}`}>
          {roundedRating.toFixed(1)}
        </span>
      )}

      {showCount && reviewsCount !== undefined && (
        <span className="text-stone-400 text-xs font-medium">
          ({reviewsCount} {reviewsCount === 1 ? 'تقييم' : 'تقييمات'})
        </span>
      )}
    </div>
  );
};

export const StarRatingDisplay = StarRating;
export const StarRatingInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = (props) => (
  <StarRating
    interactive={true}
    value={props.value}
    onChange={props.onChange}
    size={props.size}
    showLabel={true}
    className={props.className}
  />
);
