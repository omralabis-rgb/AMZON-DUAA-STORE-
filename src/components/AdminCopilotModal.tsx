import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, AlertCircle, ShoppingBag, ArrowUpRight, Copy, Check, RefreshCw } from 'lucide-react';
import { Product, Order, StoreSettings } from '../types';

interface AdminCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AdminCopilotModal: React.FC<AdminCopilotModalProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  settings,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `مرحباً بك! أنا المساعد الإداري الذكي لمتجر "${settings.storeName}".\nيمكنني مساعدتك في تحليل مبيعاتك، فحص مستويات المخزون، أو اقتراح أفكار تسويقية لرفع المبيعات عبر الواتساب. كيف أستطيع خدمتك اليوم؟`,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    '📊 ملخص لأداء المتجر والطلبات الأخيرة',
    '⚠️ ما هي المنتجات التي قارب مخزونها على النفاد؟',
    '💡 أفكار لزيادة التحويل والطلبات عبر الواتساب',
    '✨ كيف ننشئ باقة عروض مجمعة (Frequently Bought Together)؟',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build bounded context for the store
      const lowStock = products.filter((p) => (p.stock_quantity ?? 0) <= 5);
      const pendingOrders = orders.filter((o) => o.status === 'pending');
      const totalRevenue = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const contextData = {
        storeName: settings.storeName,
        whatsappNumber: settings.whatsappNumber,
        currency: settings.currency,
        totalProducts: products.length,
        lowStockItems: lowStock.map((p) => ({ title: p.title_ar, stock: p.stock_quantity })),
        totalOrdersCount: orders.length,
        pendingOrdersCount: pendingOrders.length,
        totalRevenue,
      };

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: contextData,
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'تم استلام الاستفسار بنجاح.',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي. يمكنك المحاولة مجدداً.',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 flex flex-col h-[650px] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base">Amazon Duaa AI Admin Copilot</h3>
                <span className="text-[10px] bg-rose-500/30 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/40">
                  مستشار المتجر
                </span>
              </div>
              <p className="text-xs text-stone-300">مساعد إداري بالذكاء الاصطناعي لتحليل الكتالوج والمبيعات والمخزون</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="bg-stone-50 border-b border-stone-200 p-3 overflow-x-auto flex gap-2 text-xs no-scrollbar">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="shrink-0 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-900 border border-stone-200 text-stone-700 px-3 py-1.5 rounded-full font-medium transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {m.sender === 'assistant' ? (
                <div className="w-8 h-8 rounded-xl bg-stone-900 text-rose-400 flex items-center justify-center shrink-0 text-xs font-bold shadow">
                  <Sparkles className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow">
                  أنت
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed relative group ${
                  m.sender === 'user'
                    ? 'bg-rose-600 text-white rounded-tl-sm'
                    : 'bg-white text-stone-800 shadow-sm border border-stone-200 rounded-tr-sm'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 text-[10px] opacity-70">
                  <span>{m.timestamp}</span>
                  {m.sender === 'assistant' && (
                    <button
                      onClick={() => handleCopy(m.id, m.text)}
                      className="hover:text-rose-600 flex items-center gap-1 transition-colors"
                      title="نسخ النص"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-stone-500 text-xs animate-pulse p-2">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-rose-400 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3 shadow-sm">
                جاري التفكير وتحليل بيانات المتجر بواسطة Gemini...
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="اطرح سؤالاً حول المتجر، المخزون، أو نصائح المبيعات..."
              className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-stone-900 hover:bg-rose-900 disabled:opacity-50 text-white px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shrink-0"
            >
              <span>إرسال</span>
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCopilotModal;
