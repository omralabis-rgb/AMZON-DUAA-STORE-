import React, { useState } from 'react';
import { Lock, KeyRound, Store, ShieldCheck, AlertCircle } from 'lucide-react';
import { AdminUser, StoreSettings } from '../types';
import { setAdminSession } from '../lib/storage';

interface AdminLoginProps {
  settings: StoreSettings;
  onLoginSuccess: (user: AdminUser) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  settings,
  onLoginSuccess,
  onBackToStore,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetPassword = settings.adminPassword || 'admin';

    if (password === targetPassword) {
      const user: AdminUser = {
        id: 'admin-1',
        username: username || 'admin',
        displayName: 'مدير المتجر',
        role: 'superadmin',
      };
      setAdminSession(user);
      onLoginSuccess(user);
    } else {
      setError('كلمة المرور غير صحيحة. (كلمة المرور الافتراضية هي: admin)');
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
          <p className="text-xs text-stone-500 mt-1">
            منطقة مخصصة لإدارة المنتجات، الطلبات، وتحليلات المتجر
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">اسم المستخدم</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm p-3 pr-10 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
                placeholder="أدخل كلمة المرور"
              />
              <KeyRound className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
            </div>
            <p className="text-[11px] text-stone-400 mt-1.5">
              💡 كلمة المرور الافتراضية للتجربة هي: <strong className="text-rose-600">admin</strong> (يمكنك تغييرها لاحقاً من الإعدادات).
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>تسجيل الدخول</span>
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-100 text-center">
          <button
            onClick={onBackToStore}
            className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <Store className="w-4 h-4 text-rose-600" />
            <span>العودة لصفحة المتجر الرئيسية للعملاء</span>
          </button>
        </div>
      </div>
    </div>
  );
};
