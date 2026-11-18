import React, { useState } from 'react';
import { Settings, Save, Check, Phone, DollarSign, Truck, RotateCcw } from 'lucide-react';
import { StoreSettings } from '../types';

interface AdminSettingsProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onResetData: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-600" />
            <span>إعدادات المتجر ونظام الواتساب</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            ضبط رقم استقبال الطلبات على واتساب، رسوم التوصيل، واسم المتجر
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Store Name */}
          <div>
            <label className="block font-bold text-stone-700 mb-1.5">اسم المتجر</label>
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block font-bold text-stone-700 mb-1.5">الشعار التسويقي (Tagline)</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          {/* WhatsApp Phone */}
          <div>
            <label className="block font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              رقم الواتساب لاستقبال الطلبات (مع الكود الدولي بدون + أو أصفار)
            </label>
            <input
              type="text"
              required
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              placeholder="مثال: 966501234567 أو 967780187409"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden font-mono"
            />
            <span className="text-[11px] text-stone-400 mt-1 block">
              سيتم توجيه العملاء إلى wa.me/{formData.whatsappNumber.replace(/\D/g, '')}
            </span>
          </div>

          {/* Currency */}
          <div>
            <label className="block font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-rose-600" />
              رمز العملة
            </label>
            <input
              type="text"
              required
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              placeholder="ريال"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          {/* Delivery Fee */}
          <div>
            <label className="block font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-stone-600" />
              رسوم التوصيل العادية ({formData.currency})
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.deliveryFee}
              onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          {/* Free Delivery Threshold */}
          <div>
            <label className="block font-bold text-stone-700 mb-1.5">
              الحد الأدنى للشحن المجاني ({formData.currency})
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.freeDeliveryThreshold}
              onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: Number(e.target.value) })}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* AI Assistant Access Information Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 to-indigo-50 border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
              <span>🤖 المساعد الذكي لإدارة المنتجات (صفحة مستقلة)</span>
            </h4>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              يمكنك مشاركة رمز المرور التالي مع أي شخص ترغب بمنحه صلاحية إضافة وتعديل وحذف المنتجات عبر الذكاء الاصطناعي:
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono font-bold text-sm bg-white px-3.5 py-1.5 rounded-xl border border-stone-300 text-rose-700 shadow-2xs">
              12345678
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100">
          <button
            type="submit"
            className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>تم حفظ التغييرات بنجاح</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ إعدادات المتجر</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('هل تريد استعادة البيانات الافتراضية للمتجر والمنتجات؟')) {
                onResetData();
              }
            }}
            className="text-stone-400 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors p-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة المنتجات والإعدادات الافتراضية</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
