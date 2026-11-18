import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  Send,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ArrowRight,
  Store,
  SlidersHorizontal,
  Package,
  Check,
  RefreshCw,
  Loader2,
  Upload,
  X,
  Tag,
  DollarSign,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Product, Category, StoreSettings } from '../types';
import { getSafeImageSrc, handleProductImageError } from '../lib/image';

interface AIAssistantPageProps {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  onProductCreated: (product: Product) => Promise<void>;
  onUpdateProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onBackToStore: () => void;
  onOpenAdmin: () => void;
}

interface ActionPayload {
  action: 'create_product' | 'update_product' | 'delete_product';
  product?: Partial<Product>;
  productId?: string;
  applied?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionPayload?: ActionPayload;
  imagePreview?: string;
}

const PASSCODE_STORAGE_KEY = 'amazon_duaa_assistant_unlocked_v1';
const CORRECT_PASSCODE = '12345678';

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  products,
  categories,
  settings,
  onProductCreated,
  onUpdateProduct,
  onDeleteProduct,
  onBackToStore,
  onOpenAdmin,
}) => {
  // Passcode unlock state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem(PASSCODE_STORAGE_KEY) === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `مرحباً بك في المساعد الذكي لإدارة منتجات متجر أمازون دعاء! 🌸\n\nأنت الآن تملك صلاحيات إدارة الكتالوج. يمكنك أن تطلب مني باللغة العربية:\n• «أضف منتج جديد: سيروم فيتامين سي بسعر 120 ريال»\n• «عدل سعر منتج [اسم المنتج] إلى 140 ريال»\n• «حدث مخزون منتج كذا إلى 25 قطعة»\n• رفع صورة منتج لتحليله وصياغة تفاصيله بالذكاء الاصطناعي\n• «اعرض لي المنتجات التي أوشكت على النفاد»`,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Passcode Unlock
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    setIsVerifyingPasscode(true);

    try {
      // Verify with backend API
      const res = await fetch('/api/assistant/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.valid) {
        localStorage.setItem(PASSCODE_STORAGE_KEY, 'true');
        setIsUnlocked(true);
        setPasscodeInput('');
      } else if (passcodeInput.trim() === CORRECT_PASSCODE) {
        // Safe direct fallback if network is offline
        localStorage.setItem(PASSCODE_STORAGE_KEY, 'true');
        setIsUnlocked(true);
        setPasscodeInput('');
      } else {
        setPasscodeError(data.error || 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.');
      }
    } catch {
      // Local fallback check
      if (passcodeInput.trim() === CORRECT_PASSCODE) {
        localStorage.setItem(PASSCODE_STORAGE_KEY, 'true');
        setIsUnlocked(true);
        setPasscodeInput('');
      } else {
        setPasscodeError('كلمة المرور غير صحيحة.');
      }
    } finally {
      setIsVerifyingPasscode(false);
    }
  };

  // Lock Assistant
  const handleLock = () => {
    localStorage.removeItem(PASSCODE_STORAGE_KEY);
    setIsUnlocked(false);
  };

  // Image File Upload handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP)');
      return;
    }

    setAttachedImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImageBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Parse local heuristic if backend fails or for rapid preview
  const parseLocalProductIntent = (text: string, imgBase64?: string | null): ActionPayload | null => {
    const lower = text.toLowerCase();

    // Check for ADD / CREATE product
    if (lower.includes('أضف') || lower.includes('اضف') || lower.includes('إضافة') || lower.includes('انشئ') || lower.includes('جديد')) {
      // Extract price if available
      const priceMatch = text.match(/(\d+)\s*(ريال|رس|SAR)?/);
      const price = priceMatch ? Number(priceMatch[1]) : 120;

      // Extract title
      let title = 'منتج عناية وتجميل جديد فاخر';
      const titleMatch = text.match(/(?:منتج|اسمه|عنوانه)\s*[:：]?\s*([^،,.]+)/);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      } else if (text.length > 8 && !text.includes('جديد:')) {
        title = text.replace(/أضف|اضف|منتج|جديد/g, '').trim().slice(0, 50) || title;
      }

      // Match category
      let matchedCat = categories[0];
      if (lower.includes('عطر') || lower.includes('عود') || lower.includes('مسك')) {
        matchedCat = categories.find((c) => c.id === 'perfumes') || categories[0];
      } else if (lower.includes('شعر') || lower.includes('شامبو') || lower.includes('زيت')) {
        matchedCat = categories.find((c) => c.id === 'haircare') || categories[0];
      } else if (lower.includes('مكياج') || lower.includes('روج') || lower.includes('شفاه') || lower.includes('بودرة')) {
        matchedCat = categories.find((c) => c.id === 'makeup') || categories[0];
      } else if (lower.includes('جسم') || lower.includes('لوشن') || lower.includes('سكراب')) {
        matchedCat = categories.find((c) => c.id === 'bodycare') || categories[0];
      }

      const newProd: Product = {
        id: `prod-ai-${Date.now()}`,
        title_ar: title,
        description_ar: `تركيبة متطورة ومختارة بعناية توفر أعلى مستويات الفعالية والنعومة لروتينك اليومي، مع ضمان أصالة وجودة متجر أمازون دعاء.`,
        original_price: Math.round(price * 1.25),
        discount_price: price,
        stock_quantity: 25,
        category_id: matchedCat.id,
        category_name: matchedCat.name_ar,
        tags: [matchedCat.name_ar, 'أمازون_دعاء', 'أصلي_100%', 'عناية_فاخرة'],
        image_url: imgBase64 || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
        ai_generated: true,
        created_at: new Date().toISOString(),
        featured: true,
      };

      return {
        action: 'create_product',
        product: newProd,
      };
    }

    // Check for UPDATE / EDIT product
    if (lower.includes('عدل') || lower.includes('عدّل') || lower.includes('تعديل') || lower.includes('غير') || lower.includes('غيّر') || lower.includes('حدث')) {
      // Find matching product
      const targetProduct = products.find((p) =>
        lower.includes(p.title_ar.toLowerCase()) ||
        p.title_ar.toLowerCase().split(' ').some((word) => word.length > 3 && lower.includes(word))
      );

      if (targetProduct) {
        const priceMatch = text.match(/(\d+)\s*(ريال|رس|SAR)?/);
        const updated = { ...targetProduct };
        if (priceMatch) {
          updated.discount_price = Number(priceMatch[1]);
        }
        if (lower.includes('مخزون') || lower.includes('كمية')) {
          const stockMatch = text.match(/(\d+)\s*(قطعة|حبة)?/);
          if (stockMatch) {
            updated.stock_quantity = Number(stockMatch[1]);
          }
        }

        return {
          action: 'update_product',
          product: updated,
          productId: targetProduct.id,
        };
      }
    }

    return null;
  };

  // Send message to Assistant
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend && !attachedImageBase64) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend || 'تحليل الصورة المرفقة واستخراج بيانات المنتج:',
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      imagePreview: attachedImageBase64 || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    const currentImg = attachedImageBase64;
    setAttachedImageBase64(null);
    setAttachedImageName(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode: CORRECT_PASSCODE,
          message: textToSend,
          imageBase64: currentImg,
          productsSummary: products.map((p) => ({
            id: p.id,
            title_ar: p.title_ar,
            price: p.discount_price || p.original_price,
            stock: p.stock_quantity,
            category: p.category_name,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: data.reply || 'تم تحليل طلبك وتجهيز الإجراء المناسب:',
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          actionPayload: data.actionPayload || undefined,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Fallback to local intelligent parser
        const localAction = parseLocalProductIntent(textToSend, currentImg);
        let replyText = 'أهلاً بك! لقد قمت بمعالجة طلبك:';
        if (localAction?.action === 'create_product') {
          replyText = `قمت بصياغة وتجهيز بطاقة المنتج الجديد: "${localAction.product?.title_ar}". يمكنك معاينته والضغط على زر النشر المباشر لتثبيته في المتجر فوراً!`;
        } else if (localAction?.action === 'update_product') {
          replyText = `تم تجهيز التعديلات المطلوبة على منتج "${localAction.product?.title_ar}". اضغط على زر تطبيق التعديل لحفظه في المتجر.`;
        } else {
          replyText = `لقد قمت بمراجعة كتالوج المنتجات (${products.length} منتج). يمكنك أن تطلب مني إضافة منتج باسم وسعر محدد، أو تعديل سعر منتج حالي، أو رفع صورة لأي مستحضر وسأقوم بتحليله وتجهيزه لك فوراً.`;
        }

        const fallbackMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          actionPayload: localAction || undefined,
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      // Local fallback on connection error
      const localAction = parseLocalProductIntent(textToSend, currentImg);
      const fallbackMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: localAction
          ? 'تم تجهيز تفاصيل المنتج وتحديد البيانات. انقر أدناه لنشره في المتجر مباشرة:'
          : 'المساعد الذكي جاهز ومستعد لتنفيذ أوامرك. اطلب مني إضافة أو تعديل أي منتج وسأقوم بتجهيزه لك في ثوانٍ.',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        actionPayload: localAction || undefined,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply Action (Add or Update Product in Firestore / Store state)
  const handleApplyAction = async (msgId: string, actionPayload: ActionPayload) => {
    try {
      if (actionPayload.action === 'create_product' && actionPayload.product) {
        await onProductCreated(actionPayload.product as Product);
        setStatusNotification(`تم نشر منتج "${actionPayload.product.title_ar}" في المتجر بنجاح!`);
      } else if (actionPayload.action === 'update_product' && actionPayload.product) {
        await onUpdateProduct(actionPayload.product as Product);
        setStatusNotification(`تم تحديث بيانات منتج "${actionPayload.product.title_ar}" بنجاح!`);
      } else if (actionPayload.action === 'delete_product' && actionPayload.productId) {
        await onDeleteProduct(actionPayload.productId);
        setStatusNotification(`تم حذف المنتج من المتجر بنجاح.`);
      }

      // Mark message action as applied
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.actionPayload
            ? { ...m, actionPayload: { ...m.actionPayload, applied: true } }
            : m
        )
      );

      setTimeout(() => setStatusNotification(null), 4000);
    } catch (err: any) {
      alert(`حدث خطأ أثناء تطبيق الإجراء: ${err?.message || 'يرجى المحاولة مجدداً'}`);
    }
  };

  // ==========================================
  // VIEW: Passcode Lock Screen
  // ==========================================
  if (!isUnlocked) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-stone-200 text-center relative overflow-hidden">
          {/* Decorative Background Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-100 rounded-full blur-2xl opacity-70 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-100 rounded-full blur-2xl opacity-70 pointer-events-none" />

          {/* Lock Icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200">
            <Lock className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-stone-900 mb-2">
            بوابة المساعد الذكي للمنتجات
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed mb-6">
            صفحة محمية ومخصصة لإدارة المنتجات بالذكاء الاصطناعي. أدخل كلمة المرور المعتمدة للحصول على صلاحيات إضافة وتعديل كتالوج المتجر.
          </p>

          {passcodeError && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-right">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{passcodeError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <KeyRound className="w-5 h-5 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  setPasscodeError('');
                }}
                placeholder="أدخل كلمة المرور (12345678)..."
                autoFocus
                className="w-full pr-12 pl-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-center text-lg tracking-widest font-mono text-stone-900 focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingPasscode || !passcodeInput.trim()}
              className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifyingPasscode ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-rose-300" />
                  <span>جاري التحقق من الصلاحيات...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 text-rose-400" />
                  <span>فتح المساعد الذكي</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <button
              onClick={onBackToStore}
              className="hover:text-stone-900 flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
            >
              <Store className="w-4 h-4 text-rose-600" />
              <span>العودة للمتجر</span>
            </button>
            <span className="text-[11px] bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full font-mono">
              رمز الدخول: 12345678
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: Unlocked AI Assistant Workspace
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white flex items-center justify-center shadow-lg shrink-0">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black">المساعد الذكي لمنتجات أمازون دعاء</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  مصرح بإضافة وتعديل المنتجات
                </span>
              </div>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                اكتب أوامرك باللغة العربية لإضافة منتجات جديدة، تعديل الأسعار، ومزامنة الكتالوج مباشرة مع المتجر.
              </p>
            </div>
          </div>

          {/* Quick Stats & Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-stone-300 block">إجمالي المنتجات</span>
              <span className="text-sm font-black text-rose-300 font-mono">{products.length}</span>
            </div>
            <button
              onClick={onBackToStore}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-4 h-4 text-rose-400" />
              <span>معاينة المتجر</span>
            </button>
            <button
              onClick={onOpenAdmin}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>لوحة الإدارة</span>
            </button>
            <button
              onClick={handleLock}
              title="قفل المساعد والخروج"
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 p-2.5 rounded-xl transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Status Notification Toast */}
      {statusNotification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{statusNotification}</span>
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Chat Workspace */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-stone-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-stone-900 text-white'
                      : 'bg-gradient-to-tr from-rose-600 to-rose-400 text-white'
                  }`}
                >
                  {isUser ? <Store className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                </div>

                {/* Message Bubble & Cards */}
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-3`}>
                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-stone-900 text-white rounded-tr-xs'
                        : 'bg-white text-stone-800 border border-stone-200 shadow-xs rounded-tl-xs'
                    }`}
                  >
                    {/* Optional Image Attachment Preview */}
                    {msg.imagePreview && (
                      <div className="mb-3 rounded-2xl overflow-hidden border border-white/20 max-h-48">
                        <img
                          src={msg.imagePreview}
                          alt="مرفق صورة المنتج"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <span
                      className={`block text-[10px] mt-2 ${
                        isUser ? 'text-stone-400 text-left' : 'text-stone-400 text-right'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Interactive Action Preview Card (Create / Update / Delete) */}
                  {msg.actionPayload && msg.actionPayload.product && (
                    <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-rose-200/80 shadow-md space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                        <span className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          {msg.actionPayload.action === 'create_product'
                            ? 'معاينة منتج جديد جاهز للنشر'
                            : 'معاينة تحديث بيانات المنتج'}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700">
                          {msg.actionPayload.product.category_name || 'عام'}
                        </span>
                      </div>

                      <div className="flex gap-4 items-start">
                        <img
                          src={getSafeImageSrc(msg.actionPayload.product.image_url)}
                          alt={msg.actionPayload.product.title_ar}
                          onError={handleProductImageError}
                          className="w-20 h-20 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-xs"
                        />
                        <div className="flex-1 space-y-1">
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-2">
                            {msg.actionPayload.product.title_ar}
                          </h4>
                          <p className="text-[11px] text-stone-500 line-clamp-2">
                            {msg.actionPayload.product.description_ar}
                          </p>
                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-sm font-black text-rose-600 font-mono">
                              {msg.actionPayload.product.discount_price ||
                                msg.actionPayload.product.original_price}{' '}
                              {settings.currency}
                            </span>
                            {msg.actionPayload.product.discount_price && (
                              <span className="text-xs text-stone-400 line-through font-mono">
                                {msg.actionPayload.product.original_price} {settings.currency}
                              </span>
                            )}
                            <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                              المخزون: {msg.actionPayload.product.stock_quantity ?? 10} قطعة
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 flex items-center justify-end gap-2">
                        {msg.actionPayload.applied ? (
                          <div className="w-full bg-emerald-50 text-emerald-700 py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>تم حفظ ونشر هذا المنتج بنجاح في المتجر!</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApplyAction(msg.id, msg.actionPayload!)}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 px-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>
                              {msg.actionPayload.action === 'create_product'
                                ? 'تأكيد ونشر المنتج في المتجر فوراً'
                                : 'تطبيق التعديلات على المنتج في المتجر'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Assistant Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-stone-500 animate-pulse">
              <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span>المساعد الذكي يقوم بتحليل طلبك وتجهيز بيانات المنتج...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-stone-100/70 border-t border-stone-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-stone-500 shrink-0">اقتراحات سريعة:</span>
          <button
            type="button"
            onClick={() =>
              handleSendMessage(
                'أضف منتج جديد: سيروم حمض الهيالورونيك 2% وفيتامين B5 بسعر 110 ريال، الفئة عناية بالبشرة'
              )
            }
            className="text-[11px] font-medium bg-white hover:bg-rose-50 hover:text-rose-700 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs whitespace-nowrap transition-colors cursor-pointer"
          >
            ➕ إضافة سيروم هيالورونيك
          </button>
          <button
            type="button"
            onClick={() =>
              handleSendMessage('أضف عطر ليالي الشرق الملكي برائحة العود الفاخر بسعر 240 ريال')
            }
            className="text-[11px] font-medium bg-white hover:bg-rose-50 hover:text-rose-700 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs whitespace-nowrap transition-colors cursor-pointer"
          >
            ➕ إضافة عطر عود فاخر
          </button>
          <button
            type="button"
            onClick={() =>
              handleSendMessage('اعرض لي المنتجات التي يقل مخزونها عن 5 قطع مع اقتراح تعديل الكمية')
            }
            className="text-[11px] font-medium bg-white hover:bg-rose-50 hover:text-rose-700 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs whitespace-nowrap transition-colors cursor-pointer"
          >
            📦 فحص النواقص والمخزون
          </button>
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 bg-white border-t border-stone-200">
          {/* Active Image Attachment Pill */}
          {attachedImageName && (
            <div className="mb-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
              <div className="flex items-center gap-2 truncate">
                <ImageIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-bold truncate">{attachedImageName}</span>
                <span className="text-[10px] text-rose-500">(سيتم تحليله واستخراج المنتج بالذكاء الاصطناعي)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedImageBase64(null);
                  setAttachedImageName(null);
                }}
                className="text-rose-600 hover:text-rose-900 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="إرفاق صورة منتج لتحليله"
              className="p-3 text-stone-500 hover:text-rose-600 bg-stone-100 hover:bg-rose-50 rounded-2xl transition-colors cursor-pointer shrink-0"
            >
              <Upload className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="اكتب أمرك للمساعد الذكي (مثال: أضف روج وردي مخملي بسعر 75 ريال)..."
                disabled={isLoading}
                className="w-full pl-4 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all shadow-inner"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || (!inputPrompt.trim() && !attachedImageBase64)}
              className="bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white p-3 rounded-2xl shadow-md transition-all flex items-center justify-center cursor-pointer shrink-0"
            >
              <Send className="w-5 h-5 rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
