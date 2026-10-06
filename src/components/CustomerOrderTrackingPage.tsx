import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Search,
  Phone,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Printer,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Order, OrderStatus, StoreSettings, Product } from '../types';
import { trackOrdersCloud } from '../lib/cloud';
import { getStoredOrders } from '../lib/storage';
import { ShippingRouteMap } from './ShippingRouteMap';

interface CustomerOrderTrackingPageProps {
  orders: Order[];
  settings: StoreSettings;
  onBackToStore: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  allProducts: Product[];
}

interface TrackedOrderReference {
  orderNumber: string;
  phone: string;
}

const RECENT_TRACKED_KEY = 'amazon_duaa_recent_tracked_orders_v1';

const STATUS_STAGES: {
  key: OrderStatus;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'pending',
    label: 'تم استلام الطلب',
    desc: 'تم تسجيل طلبك بنجاح وفي انتظار مراجعة التأكيد.',
    icon: Clock,
  },
  {
    key: 'processing',
    label: 'جاري التجهيز والتغليف',
    desc: 'يقوم فريق الأتيليه بتجهيز وتغليف المنتجات بحناية.',
    icon: Package,
  },
  {
    key: 'shipped',
    label: 'تم الشحن للتوصيل',
    desc: 'تم تسليم شحنتك لمندوب التوصيل وهي في طريقها إليك.',
    icon: Truck,
  },
  {
    key: 'delivered',
    label: 'تم التوصيل بنجاح',
    desc: 'تم تسليم الطلب بنجاح. نتمنى لك تجربة ممتعة!',
    icon: CheckCircle2,
  },
];

export const CustomerOrderTrackingPage: React.FC<CustomerOrderTrackingPageProps> = ({
  orders,
  settings,
  onBackToStore,
  onAddToCart,
  allProducts,
}) => {
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundOrders, setFoundOrders] = useState<Order[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentTracked, setRecentTracked] = useState<TrackedOrderReference[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_TRACKED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Normalize phone for matching (remove spaces, plus, dashes, leading zeroes/country codes)
  const normalizePhone = (p: string) => {
    const digits = p.replace(/\D/g, '');
    return digits.length > 7 ? digits.slice(-7) : digits;
  };

  const handleTrackOrder = async (targetNum?: string, targetPhone?: string) => {
    const num = (targetNum !== undefined ? targetNum : orderNumberInput).trim();
    const phone = (targetPhone !== undefined ? targetPhone : phoneInput).trim();

    if (!num && !phone) {
      setErrorMessage('يرجى إدخال رقم الطلب أو رقم الجوال للبحث عن الطلبات.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setHasSearched(true);

    try {
      // 1. Try local state orders first
      const cleanNum = num.toLowerCase();
      const cleanPhone = normalizePhone(phone);

      let matches = orders.filter((o) => {
        const oNum = o.order_number.toLowerCase();
        const oPhone = normalizePhone(o.customer_phone);

        const matchNum = num ? oNum.includes(cleanNum) : true;
        const matchPhone = phone ? oPhone.includes(cleanPhone) : true;

        return matchNum && matchPhone;
      });

      // 2. If no local match, try Supabase cloud RPC function
      if (matches.length === 0 && (num || phone)) {
        const { orders: cloudResults, isCloud } = await trackOrdersCloud(num, phone);
        if (isCloud && cloudResults.length > 0) {
          matches = cloudResults;
        }
      }

      setFoundOrders(matches);

      if (matches.length > 0) {
        setExpandedOrderId(matches[0].id);

        // Save to recent searched
        const newRef: TrackedOrderReference = {
          orderNumber: matches[0].order_number,
          phone: matches[0].customer_phone,
        };

        setRecentTracked((prev) => {
          const filtered = prev.filter((r) => r.orderNumber !== newRef.orderNumber);
          const updated = [newRef, ...filtered].slice(0, 5);
          try {
            localStorage.setItem(RECENT_TRACKED_KEY, JSON.stringify(updated));
          } catch (e) {
            console.warn('Failed to save recent tracked orders:', e);
          }
          return updated;
        });
      } else {
        setErrorMessage(
          'لم نجد أي طلب يطابق البيانات المخلة. يرجى التأكد من رقم الطلب (مثال: ELEN-1234) ورقم الجوال المسجل عند الشراء.'
        );
      }
    } catch (err: any) {
      console.error('Error tracking order:', err);
      setErrorMessage('حدث خطأ أثناء الاستعلام عن الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (order: Order) => {
    let addedCount = 0;
    order.items.forEach((item) => {
      // Find matching product in catalog
      const matchedProduct = allProducts.find((p) => p.id === item.product_id);
      if (matchedProduct) {
        onAddToCart(matchedProduct, item.quantity);
        addedCount++;
      } else {
        // Fallback dummy product object for order item if missing from catalog
        const dummyProd: Product = {
          id: item.product_id,
          title_ar: item.title_ar,
          description_ar: 'منتج مُعاد طلبه من سجل مشترياتك السابقة.',
          original_price: item.price,
          discount_price: null,
          stock_quantity: 10,
          category_id: 'general',
          category_name: 'إعادة طلب',
          tags: ['إعادة طلب'],
          image_url: item.image_url,
          ai_generated: false,
          rating: 5,
          reviews_count: 1,
          created_at: new Date().toISOString(),
        };
        onAddToCart(dummyProd, item.quantity);
        addedCount++;
      }
    });
    alert(`تمت إعادة إضافة ${addedCount} منتج من هذا الطلب إلى سلة مشترياتك بنجاح! 🎉`);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const getStageIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 font-bold px-3.5 py-1.5 rounded-full text-xs border border-rose-200/80 mb-3 shadow-2xs">
          <PackageCheck className="w-4 h-4 text-rose-600" />
          <span>تتبع الشحنات والطلبات بدون حساب</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight mb-3">
          متابعة حالة وتاريخ طلباتك
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
          أدخلي رقم الطلب ورقم الجوال لاستعراض مسار الشحنة، الفاتورة المفصلة، وإعادة طلب المنتجات بضغطة زر واحدة.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xl mb-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrackOrder();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Order Number Field */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-rose-600" />
                <span>رقم الطلب:</span>
              </label>
              <input
                type="text"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                placeholder="مثال: ELEN-1234 أو ORD-20261005-0001"
                className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden font-mono uppercase"
              />
            </div>

            {/* Phone Number Field */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-rose-600" />
                <span>رقم الجوال المسجل:</span>
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="مثال: 0501234567 أو 777627595"
                className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white font-black text-xs sm:text-sm py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {loading ? (
              <span>جاري البحث والاستعلام...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>استعلام وتتبع الطلبات</span>
              </>
            )}
          </button>
        </form>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Recent Tracked Chips */}
        {recentTracked.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-100">
            <span className="text-[11px] font-bold text-stone-500 block mb-2">
              طلب استعلمتي عنه مؤخراً على هذا الجهاز:
            </span>
            <div className="flex flex-wrap gap-2">
              {recentTracked.map((ref, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setOrderNumberInput(ref.orderNumber);
                    setPhoneInput(ref.phone);
                    handleTrackOrder(ref.orderNumber, ref.phone);
                  }}
                  className="text-xs bg-stone-100 hover:bg-rose-50 hover:text-rose-700 border border-stone-200/80 px-3 py-1.5 rounded-xl font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>#{ref.orderNumber}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {hasSearched && foundOrders.length > 0 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-rose-600" />
              <span>الطلبات المطابقة ({foundOrders.length})</span>
            </h2>
            <span className="text-xs text-stone-500 font-bold">
              انقري على أي طلب للتوسع والتفاصيل
            </span>
          </div>

          {foundOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const currentStageIdx = getStageIndex(order.status);
            const isCancelled = order.status === 'cancelled';
            const formattedDate = new Date(order.created_at).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const whatsappInquiryUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
              `مرحباً، أود الاستفسار عن حالة طلبي رقم #${order.order_number} باسم (${order.customer_name})`
            )}`;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border-2 border-stone-200/90 overflow-hidden shadow-md transition-all"
              >
                {/* Order Summary Header Bar */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-5 sm:p-6 bg-stone-50/80 hover:bg-rose-50/30 flex flex-wrap items-center justify-between gap-4 cursor-pointer transition-colors border-b border-stone-200/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      #{order.order_number.slice(-4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-stone-900 text-sm sm:text-base font-mono">
                          #{order.order_number}
                        </span>
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isCancelled
                              ? 'bg-rose-100 text-rose-700 border-rose-300'
                              : order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {isCancelled
                            ? 'ملغي'
                            : order.status === 'delivered'
                            ? 'تم التوصيل'
                            : order.status === 'shipped'
                            ? 'تم الشحن'
                            : order.status === 'processing'
                            ? 'جاري التجهيز'
                            : 'قيد المراجعة'}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500 mt-0.5 block">
                        تاريخ الطلب: {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <span className="text-[11px] text-stone-400 block">الإجمالي:</span>
                      <span className="font-black text-rose-600 text-sm sm:text-base">
                        {order.total_amount} {settings.currency}
                      </span>
                    </div>
                    <button className="text-stone-500 hover:text-stone-900 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
                    {/* Status Progress Bar */}
                    {isCancelled ? (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-3">
                        <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                        <div>
                          <p className="font-black text-sm">تم إلغاء هذا الطلب</p>
                          <p className="text-[11px] font-normal mt-0.5">
                            تم إلغاء الطلب واسترجاع الكميات للمخزون. يمكنك تواصل معنا إذا كانت لديك أية استفسارات.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-stone-50/80 p-6 rounded-3xl border border-stone-200/80">
                        <h4 className="text-xs font-bold text-stone-800 mb-6 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-rose-600" />
                          <span>مسار الشحنة والتوصيل:</span>
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                          {STATUS_STAGES.map((stage, sIdx) => {
                            const Icon = stage.icon;
                            const isReached = currentStageIdx >= sIdx;
                            const isCurrent = currentStageIdx === sIdx;

                            return (
                              <div
                                key={stage.key}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                  isCurrent
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-102'
                                    : isReached
                                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                                    : 'bg-white border-stone-200/80 text-stone-400'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                      isCurrent
                                        ? 'bg-white/20 text-white'
                                        : isReached
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-stone-100 text-stone-400'
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className="text-[10px] font-bold">مرحلة {sIdx + 1}</span>
                                </div>

                                <div>
                                  <h5
                                    className={`font-black text-xs mb-1 ${
                                      isCurrent ? 'text-white' : 'text-stone-900'
                                    }`}
                                  >
                                    {stage.label}
                                  </h5>
                                  <p
                                    className={`text-[10px] leading-relaxed ${
                                      isCurrent ? 'text-rose-100' : 'text-stone-500'
                                    }`}
                                  >
                                    {stage.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Live Route Map using react-simple-maps when order is shipped */}
                    {order.status === 'shipped' && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <ShippingRouteMap order={order} />
                      </div>
                    )}

                    {/* Customer Info & Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2">
                        <span className="text-stone-400 font-bold block mb-1">بيانات العميل والتواصل:</span>
                        <div className="flex justify-between">
                          <span className="text-stone-500">الاسم:</span>
                          <span className="font-bold text-stone-900">{order.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">رقم الجوال:</span>
                          <span className="font-bold text-stone-900 font-mono" dir="ltr">
                            {order.customer_phone}
                          </span>
                        </div>
                      </div>

                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2">
                        <span className="text-stone-400 font-bold block mb-1">عنوان التسليم والتوصيل:</span>
                        <div className="flex justify-between">
                          <span className="text-stone-500">المدينة / المنطقة:</span>
                          <span className="font-bold text-stone-900">{order.city || 'المدينة المحددة'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">العنوان التفصيلي:</span>
                          <span className="font-bold text-stone-900">{order.address || 'حسب التنسيق'}</span>
                        </div>
                        {order.notes && (
                          <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-600">
                            <strong>ملاحظات:</strong> {order.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-800 mb-3">المنتجات المشتراة في هذا الطلب:</h4>
                      <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-2xl overflow-hidden bg-white">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image_url}
                                alt={item.title_ar}
                                className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                              />
                              <div>
                                <h5 className="font-bold text-stone-900 leading-snug">{item.title_ar}</h5>
                                <span className="text-[11px] text-stone-400">
                                  الكمية: {item.quantity} × {item.price} {settings.currency}
                                </span>
                              </div>
                            </div>
                            <span className="font-black text-stone-900 text-sm">
                              {item.price * item.quantity} {settings.currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-xs space-y-2 max-w-sm ml-auto">
                      <div className="flex justify-between text-stone-600">
                        <span>المجموع الفرعي:</span>
                        <span>{order.subtotal} {settings.currency}</span>
                      </div>
                      {order.discount_amount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>مبلغ الخصم:</span>
                          <span>-{order.discount_amount} {settings.currency}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-stone-600">
                        <span>رسوم التوصيل:</span>
                        <span>{order.delivery_fee} {settings.currency}</span>
                      </div>
                      <div className="flex justify-between font-black text-stone-900 text-sm sm:text-base pt-2 border-t border-rose-200">
                        <span>المبلغ الإجمالي:</span>
                        <span className="text-rose-600">{order.total_amount} {settings.currency}</span>
                      </div>
                    </div>

                    {/* Action Bar for Customer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={whatsappInquiryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>استفسار عبر واتساب</span>
                        </a>

                        <button
                          onClick={handlePrintInvoice}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-stone-500" />
                          <span>طباعة الفاتورة</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleReorder(order)}
                        className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-rose-300" />
                        <span>إعادة طلب جميع المنتجات بالسلة</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Back to store */}
      <div className="text-center pt-8">
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-6 py-3 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للتسوق في المتجر</span>
        </button>
      </div>
    </div>
  );
};

export const TrackOrderPage = CustomerOrderTrackingPage;
export const CustomerOrderHistory = CustomerOrderTrackingPage;
export default CustomerOrderTrackingPage;
