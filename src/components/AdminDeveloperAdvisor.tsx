import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Terminal,
  Sparkles,
  Send,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  FileCode,
  Layers,
  ArrowRight,
  Cpu,
  Laptop,
  Flame,
  Zap,
  Bot,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { StoreSettings } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

interface AdminDeveloperAdvisorProps {
  settings: StoreSettings;
  onBackToAdmin: () => void;
  onOpenStore?: () => void;
  onOpenOrders?: () => void;
}

const STORAGE_KEY = 'amazon_duaa_dev_advisor_chat_v1';

const INITIAL_WELCOME_MESSAGE: Message = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `مرحباً بك! أنا **المستشار البرمجي والتقني المعتمد (Lead Software Architect & AI Senior Engineer)** لمتجر **أمازون دعاء | Amazon Duaa**.

أنا هنا لمساعدتك على مدار الأيام في كل ما يخص الجوانب التقنية والبرمجية للموقع:
- 💡 **اقتراح أحدث الإضافات والميزات** التي ترفع المبيعات ومعدل التحويل (Conversion Rate).
- 💻 **توليد الأكواد البرمجية الكاملة (Clean Production-Ready Code)** لأي ميزة تريد إضافتها مباشرة في النظام مع مسار الملف وطريقة ربطه.
- ⚡ **تحسين سرعة وأداء المتجر والسيو (SEO)** وتجربة مستخدمي الجوال.
- 🛠️ **حل أي مشكلة تقنية** أو إعادة هيكلة المكونات البرمجية.

اختر من الأسئلة السريعة أدناه أو اكتب لي ما ترغب بتطويره وسأرسل لك الكود فورياً!

### 💡 اقتراحات لتطوير المنصة والخطوات التالية:
- أرسل لي كود إضافة نظام كوبونات الخصم في السلة
- أرسل لي كود شريط العد التنازلي للعروض الخاصة (Flash Sale)
- أرسل لي كود إشعار منبثق للمشتريات الأخيرة لزيادة الثقة
- ما هي خطة التطوير المقترحة للمتجر خلال الشهر القادم؟`,
  timestamp: 'الآن',
  suggestions: [
    'أرسل لي كود نظام كوبونات الخصم في السلة',
    'أرسل لي كود شريط العد التنازلي للعروض الخاصة (Flash Sale)',
    'أرسل لي كود إشعار منبثق للمشتريات الأخيرة لزيادة الثقة',
    'ما هي أهم 3 إضافات برمجية ترفع مبيعات متجرنا الآن؟',
  ],
};

const QUICK_PROMPTS = [
  {
    title: 'نظام الكوبونات',
    desc: 'كود كامل لتطبيق كود خصم في السلة',
    prompt: 'أريد إضافة نظام كوبونات خصم وقسائم ترويجية في السلة وصفحة الدفع. زوّدني بالكود البرمجي الكامل وطريقة ربطه في المتجر.',
    icon: Flame,
  },
  {
    title: 'شريط عروض اليوم (Timer)',
    desc: 'عداد تنازلي براق أعلى الصفحة',
    prompt: 'أريد كود شريط علوي جذاب يعرض عداداً تنازلياً لعروض اليوم مع زر خصم سريع. زوّدني بالكود الكامل ومسار الملف.',
    icon: Zap,
  },
  {
    title: 'إشعار المشتريات الأخيرة',
    desc: 'Social Proof لزيادة ثقة الزبائن',
    prompt: 'أريد كود نافذة منبثقة تظهر في أسفل الصفحة تعرض مشتريات حديثة حقيقية (Social Proof) لزيادة المبيعات. كيف أضيفها؟',
    icon: Sparkles,
  },
  {
    title: 'تحسين السيو وGoogle Rich Snippets',
    desc: 'ظهور المنتجات والتقييمات في نتائج بحث جوجل',
    prompt: 'كيف نحسن ظهور منتجاتنا وتقييمات الـ 5 نجوم في نتائج بحث جوجل عبر Schema.org؟ أرسل لي الكود البرمجي اللازم.',
    icon: Laptop,
  },
];

type ContentPart =
  | { type: 'text'; content: string; key: string }
  | { type: 'code'; langOrPath: string; code: string; key: string };

export const AdminDeveloperAdvisor: React.FC<AdminDeveloperAdvisorProps> = ({
  settings,
  onBackToAdmin,
  onOpenStore,
  onOpenOrders,
}) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
    return [INITIAL_WELCOME_MESSAGE];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Extract suggestions from assistant content if present
  const extractSuggestions = (text: string): string[] => {
    const suggestions: string[] = [];
    const match = text.match(/### 💡 اقتراحات لتطوير المنصة والخطوات التالية:([\s\S]*)$/);
    if (match && match[1]) {
      const lines = match[1].split('\n');
      for (const line of lines) {
        const cleaned = line.replace(/^[-*•\d.]+\s*/, '').trim();
        if (cleaned.length > 5 && cleaned.length < 90) {
          suggestions.push(cleaned);
        }
      }
    }
    return suggestions.slice(0, 4);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      // Build conversation history for context
      const history = newMessages.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.content,
      }));

      const res = await fetch('/api/ai/developer-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history,
          context: {
            storeName: settings.storeName,
            whatsappNumber: settings.whatsappNumber,
            platform: 'React 19 + TypeScript + Tailwind v4 + Express + Vercel + Supabase',
          },
        }),
      });

      if (!res.ok) {
        throw new Error('فشل الاتصال بخدمة المستشار البرمجي');
      }

      const data = await res.json();
      const answer = data.answer || 'تمت معالجة الاستشارة بنجاح.';
      const suggestions = extractSuggestions(answer);

      const assistantMsg: Message = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: answer,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: `عذراً، حدث خطأ أثناء الاتصال بالمستشار: ${err.message || 'خطأ غير متوقع'}. يرجى التحقق من اتصال الإنترنت أو مفتاح GEMINI_API_KEY.`,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('هل تريد مسح سجل المحادثات مع المستشار البرمجي والبدء من جديد؟')) {
      setMessages([INITIAL_WELCOME_MESSAGE]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleCopyCode = (code: string, blockId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(blockId);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Format message content with enhanced code blocks
  const renderMessageContent = (content: string, msgId: string) => {
    // Split by markdown code blocks (```language ... ```)
    const codeBlockRegex = /```([a-zA-Z0-9_\-\.\/]*)\n([\s\S]*?)```/g;
    const parts: ContentPart[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
          key: `text-${lastIndex}`,
        });
      }

      // Code block
      const langOrPath = (match[1] || '').trim() || 'typescript';
      const code = match[2] || '';
      parts.push({
        type: 'code',
        langOrPath,
        code,
        key: `code-${blockIndex++}`,
      });

      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last code block
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
        key: `text-${lastIndex}`,
      });
    }

    return (
      <div className="space-y-4">
        {parts.map((part) => {
          if (part.type === 'code') {
            const blockId = `${msgId}-${part.key}`;
            const isCopied = copiedCodeId === blockId;
            return (
              <div
                key={part.key}
                className="my-3 rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shadow-xl font-mono text-xs text-left"
                dir="ltr"
              >
                {/* Code Header Bar */}
                <div className="bg-stone-900/90 px-4 py-2.5 border-b border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="text-[11px] font-bold text-stone-300 ml-2">
                      {part.langOrPath.includes('/') ? `📁 ${part.langOrPath}` : part.langOrPath}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyCode(part.code, blockId)}
                    className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white px-3 py-1 rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-400" />
                        <span>نسخ الكود الكامل</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code Content */}
                <pre className="p-4 text-emerald-300/90 overflow-x-auto selection:bg-rose-900/50 leading-relaxed font-mono">
                  <code>{part.code}</code>
                </pre>
              </div>
            );
          }

          // Plain text rendering with basic markdown formatting
          const paragraphs = part.content.split('\n\n');
          return (
            <div key={part.key} className="space-y-2.5 leading-relaxed text-xs sm:text-sm">
              {paragraphs.map((p, pIdx) => {
                if (p.startsWith('### ')) {
                  return (
                    <h3 key={pIdx} className="text-base sm:text-lg font-black text-amber-300 pt-3 pb-1 border-b border-stone-800/80 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      <span>{p.replace('### ', '')}</span>
                    </h3>
                  );
                }
                if (p.startsWith('## ')) {
                  return (
                    <h2 key={pIdx} className="text-lg font-black text-rose-300 pt-2">
                      {p.replace('## ', '')}
                    </h2>
                  );
                }
                if (p.startsWith('- ') || p.startsWith('* ')) {
                  const items = p.split('\n');
                  return (
                    <ul key={pIdx} className="space-y-1.5 pr-2">
                      {items.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2 text-stone-200">
                          <span className="text-rose-400 font-bold mt-0.5">•</span>
                          <span>{item.replace(/^[-*]\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }

                return (
                  <p key={pIdx} className="text-stone-200 whitespace-pre-line">
                    {p}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner Navigation */}
      <div className="bg-gradient-to-r from-stone-950 via-indigo-950 to-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-900/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <Code2 className="w-4 h-4 text-indigo-400" />
              المستشار البرمجي والمعماري المعتمد للمنصة
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              جاهز لتوليد الأكواد
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>مستشار تطوير المنصة وكبير المطورين</span>
            <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded-lg text-white font-sans">AI Senior Architect</span>
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-2xl leading-relaxed">
            استشر مهندس النظام في أي وقت حول ما يحتاجه المتجر من تطويرات أو إضافات لزيادة الأرباح، واطلب منه كود أي ميزة ليرسله لك جاهزاً ومباشراً للإدراج في المشروع مع توضيح مسار الملف والخطوات.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-mono text-indigo-200/80">
            <span className="bg-stone-900/80 px-2.5 py-1 rounded-lg border border-stone-800">React 19</span>
            <span className="bg-stone-900/80 px-2.5 py-1 rounded-lg border border-stone-800">TypeScript</span>
            <span className="bg-stone-900/80 px-2.5 py-1 rounded-lg border border-stone-800">Tailwind CSS v4</span>
            <span className="bg-stone-900/80 px-2.5 py-1 rounded-lg border border-stone-800">Vercel & Express</span>
            <span className="bg-stone-900/80 px-2.5 py-1 rounded-lg border border-stone-800">Supabase DB</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onBackToAdmin}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-2xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>إدارة المنتجات</span>
          </button>

          {onOpenOrders && (
            <button
              onClick={onOpenOrders}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-2xl border border-white/20 transition-all cursor-pointer"
            >
              الطلبات
            </button>
          )}

          {onOpenStore && (
            <button
              onClick={onOpenStore}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>معاينة المتجر</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Ideas & Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_PROMPTS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(card.prompt)}
              disabled={loading}
              className="group text-right p-4 rounded-3xl bg-white hover:bg-indigo-50/50 border border-stone-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer disabled:opacity-50"
            >
              <div>
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center mb-3 transition-colors shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-black text-stone-900 text-xs sm:text-sm mb-1 group-hover:text-indigo-900 transition-colors">
                  {card.title}
                </h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                <span>طلب الكود الآن</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180 transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Chat Workspace */}
      <div className="bg-stone-900 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col min-h-[600px] h-[720px]">
        {/* Chat Header */}
        <div className="bg-stone-950 px-6 py-4 border-b border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm">محادثة المستشار البرمجي</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  متصل ومدرك لكامل هيكلية المتجر
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                اطلب كود أي ميزة وسيقوم ببرمجتها لك فورياً متوافقة مع React 19 و Tailwind v4
              </p>
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            className="text-stone-400 hover:text-rose-400 hover:bg-stone-800/70 p-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="مسح سجل المحادثة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">محادثة جديدة</span>
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-stone-900/90">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${
                msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-rose-600 text-white font-bold text-xs'
                    : 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white'
                }`}
              >
                {msg.role === 'user' ? 'أنت' : <Code2 className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-3xl p-5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-rose-700 text-white rounded-tr-xs'
                    : 'bg-stone-950/90 text-stone-200 border border-stone-800/90 rounded-tl-xs'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-stone-400 mb-2 pb-1 border-b border-white/10">
                  <span className="font-bold text-white">
                    {msg.role === 'user' ? 'طلبك البرمجي' : 'استشارة المهندس وكود الحل'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Content */}
                {renderMessageContent(msg.content, msg.id)}

                {/* Interactive Suggestion Pills (Next Steps) */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-stone-800">
                    <span className="text-[11px] font-bold text-amber-400 block mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>اقتراحات لتطوير المنصة يمكنك طلب كودها الآن:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          disabled={loading}
                          className="bg-stone-900 hover:bg-indigo-900/60 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-right disabled:opacity-50"
                        >
                          <span>{sug}</span>
                          <ArrowRight className="w-3 h-3 rotate-180 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-md">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="bg-stone-950 p-4 rounded-3xl border border-stone-800 text-xs text-indigo-300 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                <span>جاري دراسة بنية المتجر وتوليد الكود البرمجي المقترح مع التوصيات...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-stone-950 p-4 border-t border-stone-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-stone-900 rounded-2xl border border-stone-800 p-2 focus-within:border-indigo-500 transition-colors"
          >
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="اطلب استشارة تقنية، أو اطلب كود ميزة معينة لتضيفها للمتجر (مثال: أرسل لي كود إضافة نافذة تقييم تجربة العميل)..."
              className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm px-3 py-1.5 focus:outline-hidden resize-none placeholder-stone-500"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">إرسال واستشارة</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 px-2">
            <span>اضغط Enter للإرسال، و Shift+Enter لسطر جديد.</span>
            <span className="text-indigo-400 font-bold">✨ كل كود يتم توليده جاهز للتطبيق في مشروع أمازون دعاء مباشرة</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDeveloperAdvisor;
