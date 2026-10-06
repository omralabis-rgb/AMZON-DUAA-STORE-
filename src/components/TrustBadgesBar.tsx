import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';

export const TrustBadgesBar: React.FC = () => {
  return (
    <div className="bg-stone-50 border-y border-stone-200/80 py-5 my-8">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-white rounded-2xl border border-stone-200/70 shadow-2xs">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
          <h4 className="font-black text-xs text-stone-900">منتجات أصلية 100%</h4>
          <p className="text-[11px] text-stone-500">مستوردة ومفحوصة معملياً</p>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-stone-200/70 shadow-2xs">
          <Truck className="w-6 h-6 text-rose-600 mx-auto mb-1.5" />
          <h4 className="font-black text-xs text-stone-900">شحن سريع ومبرد</h4>
          <p className="text-[11px] text-stone-500">حفاظ تام على فعالية المكونات</p>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-stone-200/70 shadow-2xs">
          <RotateCcw className="w-6 h-6 text-amber-600 mx-auto mb-1.5" />
          <h4 className="font-black text-xs text-stone-900">استبدال واسترجاع سهل</h4>
          <p className="text-[11px] text-stone-500">خلال 7 أيام بكل مرونة</p>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-stone-200/70 shadow-2xs">
          <Award className="w-6 h-6 text-indigo-600 mx-auto mb-1.5" />
          <h4 className="font-black text-xs text-stone-900">خدمة عملاء VIP</h4>
          <p className="text-[11px] text-stone-500">متابعة فورية عبر الواتساب</p>
        </div>
      </div>
    </div>
  );
};
