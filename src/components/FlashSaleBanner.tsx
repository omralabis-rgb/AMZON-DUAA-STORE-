import React, { useState, useEffect } from 'react';
import { Flame, Clock, ArrowRight } from 'lucide-react';

interface FlashSaleBannerProps {
  onExploreSale?: () => void;
}

export const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({ onExploreSale }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-rose-700 via-stone-900 to-amber-700 text-white px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-amber-400 text-stone-900 font-bold animate-pulse">
            <Flame className="w-3.5 h-3.5" />
          </span>
          <span className="font-black text-amber-300">عروض نهاية الأسبوع الحصرية:</span>
          <span>خصومات حتى 40% على أرقى مستحضرات العناية الفاخرة</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 font-mono font-bold bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>ينتهي العرض خلال:</span>
            <span className="text-amber-300">{String(timeLeft.hours).padStart(2, '0')}:</span>
            <span className="text-amber-300">{String(timeLeft.minutes).padStart(2, '0')}:</span>
            <span className="text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>

          {onExploreSale && (
            <button
              onClick={onExploreSale}
              className="bg-white hover:bg-rose-50 text-rose-700 font-extrabold px-3 py-1 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>تسوق العروض</span>
              <ArrowRight className="w-3 h-3 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
