import React, { useState } from 'react';
import { Lock, Store, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { AdminUser, StoreSettings } from '../types';
import { loginAdminWithGoogle, getFriendlyFirebaseErrorMessage } from '../lib/firebase';

interface AdminLoginProps {
  settings: StoreSettings;
  onLoginSuccess: (user: AdminUser) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToStore,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleAdminLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const { adminUser } = await loginAdminWithGoogle();
      onLoginSuccess(adminUser);
    } catch (err: any) {
      setError(getFriendlyFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-stone-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-stone-900">تسجيل دخول لوحة الإدارة</h2>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
            منطقة محمية لإدارة المنتجات والطلبات. الدخول متاح حصراً للمشرف المعتمد عبر حساب Google مع التحقق من الصلاحيات من الخادم.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-500 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-rose-300" />
                <span>جاري التحقق من الهوية والصلاحيات...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>تسجيل الدخول باستخدام Google للمشرف</span>
              </>
            )}
          </button>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>يتم التحقق من البريد الإلكتروني والهوية وصلاحية الإدارة من جهة الخادم قبل فتح لوحة التحكم.</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-stone-100 text-center">
          <button
            type="button"
            onClick={onBackToStore}
            className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
          >
            <Store className="w-4 h-4 text-rose-600" />
            <span>العودة لصفحة المتجر الرئيسية للعملاء</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
