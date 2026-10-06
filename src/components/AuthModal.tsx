import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  LogIn,
  UserPlus,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGooglePopup,
  resetUserPassword,
  getFriendlyFirebaseErrorMessage,
} from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  initialMode?: 'login' | 'register' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFields = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleSwitchMode = (newMode: 'login' | 'register' | 'reset') => {
    resetFields();
    setMode(newMode);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          throw new Error('يرجى إدخال اسمك الكريم');
        }
        if (password.length < 6) {
          throw new Error('يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل');
        }
        const { profile } = await registerWithEmail(name, email, password);
        setSuccessMessage('تم إنشاء حسابك بنجاح في أمازون دعاء!');
        setTimeout(() => {
          onAuthSuccess(profile);
          onClose();
        }, 800);
      } else if (mode === 'login') {
        const { profile } = await loginWithEmail(email, password);
        setSuccessMessage(`أهلاً بك مجدداً يا ${profile.name || 'عزيزنا'}!`);
        setTimeout(() => {
          onAuthSuccess(profile);
          onClose();
        }, 800);
      } else if (mode === 'reset') {
        if (!email.trim()) {
          throw new Error('يرجى إدخال بريدك الإلكتروني');
        }
        await resetUserPassword(email);
        setSuccessMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح!');
      }
    } catch (err: any) {
      console.error('[Firebase Auth Error]:', err);
      const friendlyMsg = getFriendlyFirebaseErrorMessage(err);
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const { profile } = await loginWithGooglePopup();
      setSuccessMessage(`مرحباً بك ${profile.name || ''}!`);
      setTimeout(() => {
        onAuthSuccess(profile);
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('[Google Sign In Error]:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(getFriendlyFirebaseErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for admin email input without bypassing auth
  const handleQuickAdminFill = () => {
    setEmail('omralabis@gmail.com');
    setPassword('admin123456');
    setMode('login');
    resetFields();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
            <Sparkles className="w-7 h-7 text-rose-200" />
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">
            {mode === 'login' && 'تسجيل الدخول إلى حسابك'}
            {mode === 'register' && 'إنشاء حساب جديد في أمازون دعاء'}
            {mode === 'reset' && 'استعادة كلمة المرور'}
          </h2>
          <p className="text-xs text-rose-100/90 mt-1">
            {mode === 'login' && 'احفظ سلتك ومفضلاتك وتتبع طلباتك عبر جميع أجهزتك'}
            {mode === 'register' && 'انضم لعملاء النخبة واحصل على مزامنة فورية وعروض حصرية'}
            {mode === 'reset' && 'أدخل بريدك وسنرسل لك رابطاً لإعادة تعيين كلمة المرور فوراً'}
          </p>

          {/* Tab Selector */}
          <div className="flex bg-black/20 p-1 rounded-2xl mt-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-rose-700 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white text-rose-700 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              حساب جديد
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('reset')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'reset' ? 'bg-white text-rose-700 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              استعادة
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">الاسم الكامل</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: سارة محمد"
                    className="w-full text-sm p-3 pr-10 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-colors"
                  />
                  <UserIcon className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-sm p-3 pr-10 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-colors"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-stone-700">كلمة المرور</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('reset')}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm p-3 pr-10 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-colors"
                    dir="ltr"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white py-3.5 px-4 rounded-2xl font-extrabold text-sm shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري المعالجة عبر Firebase...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </>
              ) : mode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء الحساب والمزامنة</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>إرسال رابط الاستعادة</span>
                </>
              )}
            </button>
          </form>

          {/* Google Sign In Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <span className="relative bg-white px-3 text-[11px] font-medium text-stone-400">
              أو عبر
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 py-3 px-4 rounded-2xl text-xs font-bold text-stone-700 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>متابعة باستخدام حساب Google</span>
          </button>

          {/* Security Status Info */}
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>مصادقة أصلية عبر Firebase Auth</span>
            </span>
            <button
              type="button"
              onClick={handleQuickAdminFill}
              className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer text-[10px] underline"
              title="تعبئة بيانات حساب المشرف لتسجيل الدخول"
            >
              تعبئة حساب المشرف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
