import React, { useState } from 'react';
import { Tag, Check, AlertCircle } from 'lucide-react';

interface CouponInputProps {
  onApplyDiscount: (percent: number, code: string) => void;
  appliedCode?: string;
  currency: string;
}

const VALID_COUPONS: Record<string, number> = {
  'DUAA10': 10,
  'AMAZON15': 15,
  'BEAUTY20': 20,
};

export const CouponInput: React.FC<CouponInputProps> = ({ onApplyDiscount, appliedCode, currency }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    if (VALID_COUPONS[cleanCode]) {
      const discountPercent = VALID_COUPONS[cleanCode];
      onApplyDiscount(discountPercent, cleanCode);
      setSuccess(true);
      setError('');
    } else {
      setError('عذراً، هذا الكود غير صالح أو منتهي الصلاحية');
      setSuccess(false);
    }
  };

  return (
    <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs">
      <form onSubmit={handleApply} className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="أدخل كود الخصم (مثل: DUAA10)..."
            className="w-full bg-white pr-9 pl-3 py-2 border border-stone-200 rounded-xl uppercase font-bold focus:border-rose-500 focus:outline-hidden"
          />
        </div>
        <button
          type="submit"
          className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-xs cursor-pointer"
        >
          تطبيق
        </button>
      </form>

      {appliedCode && (
        <div className="mt-2 text-emerald-700 font-bold flex items-center gap-1.5 text-[11px]">
          <Check className="w-3.5 h-3.5" />
          <span>تم تطبيق الكود ({appliedCode}) بنجاح!</span>
        </div>
      )}

      {error && (
        <div className="mt-2 text-rose-600 font-bold flex items-center gap-1.5 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default CouponInput;
