import React, { useState } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  MessageCircle,
  CreditCard,
  Banknote,
  CheckCircle2,
  Tag,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  Check,
  Copy,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import { CartItem, CustomerOrderInfo, StoreSettings, Order } from '../types';
import { buildWhatsAppMessage, generateWhatsAppOrderUrl } from '../lib/whatsapp';

interface CheckoutPageProps {
  cartItems: CartItem[];
  settings: StoreSettings;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onOrderPlaced: (order: Order) => void;
  onBackToStore: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onOrderPlaced,
  onBackToStore,
}) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerOrderInfo>({
    customerName: '',
    phone: '',
    city: 'الرياض',
    address: '',
    notes: '',
    paymentMethod: 'cod',
    deliverySpeed: 'standard',
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product.discount_price ?? item.product.original_price;
    return acc + price * item.quantity;
  }, 0);

  // Delivery fee logic
  const isFreeDelivery = subtotal >= settings.freeDeliveryThreshold;
  const standardFee = isFreeDelivery ? 0 : settings.deliveryFee;
  const expressExtraFee = customerInfo.deliverySpeed === 'express' ? 15 : 0;
  const finalDeliveryFee = standardFee + expressExtraFee;

  const grandTotal = Math.max(0, subtotal - couponDiscount + finalDeliveryFee);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();

    if (code === 'BEAUTY10') {
      const disc = Math.round(subtotal * 0.1);
      setCouponDiscount(disc);
      setAppliedCoupon('BEAUTY10 (خصم 10%)');
    } else if (code === 'WELCOME') {
      const disc = Math.min(20, subtotal);
      setCouponDiscount(disc);
      setAppliedCoupon('WELCOME (خصم 20 ريال)');
    } else {
      setCouponError('رمز الكوبون غير صالح. جرب BEAUTY10 أو WELCOME');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  const handlePlaceOrder = () => {
    if (!customerInfo.customerName.trim() || !customerInfo.phone.trim()) {
      alert('يرجى إدخال اسم المستلم ورقم الجوال للمتابعة');
      return;
    }

    const orderNum = 'ELEN-' + Math.floor(1000 + Math.random() * 9000);

    const newOrder: Order = {
      id: 'order-' + Date.now(),
      order_number: orderNum,
      customer_name: customerInfo.customerName,
      customer_phone: customerInfo.phone,
      city: customerInfo.city,
      address: customerInfo.address,
      notes: customerInfo.notes,
      items: cartItems.map((ci) => ({
        product_id: ci.product.id,
        title_ar: ci.product.title_ar,
        price: ci.product.discount_price ?? ci.product.original_price,
        quantity: ci.quantity,
        image_url: ci.product.image_url,
      })),
      subtotal,
      discount_amount: couponDiscount,
      delivery_fee: finalDeliveryFee,
      total_amount: grandTotal,
      status: 'pending',
      whatsapp_sent: true,
      payment_method: customerInfo.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'تحويل بنكي فوري',
      delivery_speed: customerInfo.deliverySpeed === 'express' ? 'توصيل إكسبرس فائق السرعة' : 'توصيل قياسي',
      created_at: new Date().toISOString(),
    };

    onOrderPlaced(newOrder);
    setConfirmedOrder(newOrder);
    setIsSuccess(true);

    // Open WhatsApp
    const url = generateWhatsAppOrderUrl(
      cartItems,
      settings,
      customerInfo,
      couponDiscount,
      appliedCoupon || undefined,
      orderNum
    );
    window.open(url, '_blank');
  };

  // Success Confirmation Screen
  if (isSuccess && confirmedOrder) {
    const waUrl = generateWhatsAppOrderUrl(
      cartItems,
      settings,
      customerInfo,
      couponDiscount,
      appliedCoupon || undefined,
      confirmedOrder.order_number
    );

    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 border border-emerald-200 shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest block mb-1">
          تم استلام طلبك بنجاح!
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-stone-900 mb-2">
          شكراً لتسوقكِ من {settings.storeName}
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto mb-6">
          تم تسجيل طلبكِ رقم <strong className="text-stone-900">#{confirmedOrder.order_number}</strong> بنجاح. سنبدأ بتجهيزه فوراً للتوصيل.
        </p>

        {/* Order Summary Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 text-right text-xs space-y-4 mb-8 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="text-stone-500">رقم الطلب:</span>
            <span className="font-mono font-bold text-stone-900 text-sm">#{confirmedOrder.order_number}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="text-stone-500">المستلم:</span>
            <span className="font-bold text-stone-900">{confirmedOrder.customer_name} ({confirmedOrder.customer_phone})</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="text-stone-500">عنوان التوصيل:</span>
            <span className="font-bold text-stone-900">{confirmedOrder.city} - {confirmedOrder.address || 'العنوان المسجل'}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="text-stone-500">الإجمالي النهائي المطلوب:</span>
            <span className="font-black text-rose-600 text-base">{confirmedOrder.total_amount} {settings.currency}</span>
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl text-[11px] text-stone-600 flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>سيتم التواصل معك عبر الواتساب لتأكيد خروج الشحنة مع المندوب.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span>متابعة المحادثة في واتساب</span>
          </a>

          <button
            onClick={onBackToStore}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all shadow-md"
          >
            العودة للتسوق في المتجر
          </button>
        </div>
      </div>
    );
  }

  // Empty cart fallback
  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">سلة التسوق فارغة حالياً</h2>
        <p className="text-xs text-stone-500 mb-6">
          تصفحي تشكيلة مستحضرات التجميل والعناية الفاخرة وأضيفي ما يعجبكِ لإتمام الدفع!
        </p>
        <button
          onClick={onBackToStore}
          className="bg-stone-900 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-md"
        >
          تصفح المتجر الآن
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-stone-200">
        <div>
          <button
            onClick={onBackToStore}
            className="text-xs text-stone-500 hover:text-rose-600 flex items-center gap-1 font-bold mb-1 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للتسوق</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-rose-600" />
            <span>إتمام الطلب والدفع الآمن</span>
          </h1>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-stone-600">
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            تشفير وحماية الطلب
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Right Column: Checkout Steps & Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Customer & Delivery Address */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-sm">
                1
              </div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                بيانات المستلم وعنوان التوصيل
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1.5">اسم المستلم الكريم *</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.customerName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, customerName: e.target.value })}
                    placeholder="مثال: ريم العبدالله"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1.5">رقم الجوال لتأكيد التوصيل *</label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="050xxxxxxx"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1.5">المدينة *</label>
                  <select
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden font-semibold"
                  >
                    <option value="الرياض">الرياض (توصيل فوري متاح)</option>
                    <option value="جدة">جدة</option>
                    <option value="الدمام">الدمام والخبر</option>
                    <option value="مكة المكرمة">مكة المكرمة</option>
                    <option value="المدينة المنورة">المدينة المنورة</option>
                    <option value="القصيم">القصيم / بريدة</option>
                    <option value="أبها">أبها وخميس مشيط</option>
                    <option value="مدينة أخرى">مدينة أخرى بالمملكة أو الخليج</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1.5">الحي والشارع *</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    placeholder="مثال: حي النرجس، شارع عثمان بن عفان"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1.5">ملاحظات التوصيل أو التغليف كهدية (اختياري)</label>
                <input
                  type="text"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                  placeholder="مثال: يرجى التغليف كهدية فاخرة مع كرت إهداء..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Delivery Speed Options */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-sm">
                2
              </div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                سرعة وخيارات التوصيل
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  customerInfo.deliverySpeed === 'standard'
                    ? 'border-rose-600 bg-rose-50/40'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="deliverySpeed"
                  value="standard"
                  checked={customerInfo.deliverySpeed === 'standard'}
                  onChange={() => setCustomerInfo({ ...customerInfo, deliverySpeed: 'standard' })}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-stone-900 block mb-0.5">توصيل قياسي فاخر</span>
                  <span className="text-stone-500 block mb-1">خلال 2 إلى 4 أيام عمل</span>
                  <span className="font-bold text-rose-600">
                    {standardFee === 0 ? 'مجاني (عرض الشحن المجاني)' : `${standardFee} ${settings.currency}`}
                  </span>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  customerInfo.deliverySpeed === 'express'
                    ? 'border-rose-600 bg-rose-50/40'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="deliverySpeed"
                  value="express"
                  checked={customerInfo.deliverySpeed === 'express'}
                  onChange={() => setCustomerInfo({ ...customerInfo, deliverySpeed: 'express' })}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-stone-900 block mb-0.5">توصيل إكسبرس سريع ⚡</span>
                  <span className="text-stone-500 block mb-1">خلال 24-48 ساعة أولوية قصوى</span>
                  <span className="font-bold text-rose-600">
                    +{expressExtraFee} {settings.currency} إضافية
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Step 3: Payment Method Options */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-sm">
                3
              </div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                طريقة الدفع وتأكيد الحساب
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  customerInfo.paymentMethod === 'cod'
                    ? 'border-rose-600 bg-rose-50/40'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={customerInfo.paymentMethod === 'cod'}
                  onChange={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'cod' })}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-0.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>الدفع عند الاستلام (COD)</span>
                  </div>
                  <span className="text-stone-500 block">الدفع نقداً أو عبر بطاقة مدى لمندوب التوصيل</span>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  customerInfo.paymentMethod === 'bank_transfer'
                    ? 'border-rose-600 bg-rose-50/40'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={customerInfo.paymentMethod === 'bank_transfer'}
                  onChange={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'bank_transfer' })}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-0.5">
                    <CreditCard className="w-4 h-4 text-rose-600" />
                    <span>تحويل بنكي فوري / مدى</span>
                  </div>
                  <span className="text-stone-500 block">إرسال إيصال التحويل عبر واتساب مباشرة</span>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Left Column: Order Summary & Instant Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-md space-y-6">
            <h2 className="text-lg font-black text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
              <span>ملخص السلة ({cartItems.reduce((s, i) => s + i.quantity, 0)} قطعة)</span>
              <span className="text-xs text-stone-500 font-normal">شحن آمن</span>
            </h2>

            {/* Cart Items List */}
            <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto pr-1">
              {cartItems.map((item) => {
                const unitPrice = item.product.discount_price ?? item.product.original_price;
                return (
                  <div key={item.product.id} className="py-3 flex gap-3 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.image_url}
                        alt={item.product.title_ar}
                        className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1 max-w-[180px]">
                          {item.product.title_ar}
                        </h4>
                        <span className="text-[11px] text-stone-400">
                          {unitPrice} {settings.currency} × {item.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded bg-white hover:bg-stone-200 flex items-center justify-center font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded bg-white hover:bg-stone-200 flex items-center justify-center font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-xs font-black text-stone-900 min-w-16 text-left">
                        {unitPrice * item.quantity} {settings.currency}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Section */}
            <div className="pt-2 border-t border-stone-100">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 p-3 rounded-2xl text-xs font-medium border border-emerald-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    تم تفعيل: {appliedCoupon}
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-stone-500 hover:text-rose-600 text-xs font-bold underline"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="كود الخصم (جرب BEAUTY10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 uppercase focus:outline-hidden focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="bg-stone-800 hover:bg-stone-900 text-white text-xs px-4 py-2 rounded-xl font-bold transition-colors"
                  >
                    تطبيق
                  </button>
                </form>
              )}
              {couponError && <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs text-stone-600 pt-2 border-t border-stone-100">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-stone-900">{subtotal} {settings.currency}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>الخصم المطبق:</span>
                  <span>-{couponDiscount} {settings.currency}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>رسوم التوصيل:</span>
                <span>
                  {finalDeliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">مجاني 🎉</span>
                  ) : (
                    <span className="font-bold text-stone-900">{finalDeliveryFee} {settings.currency}</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between text-base font-black text-stone-900 pt-3 border-t border-stone-200">
                <span>الإجمالي النهائي للدفع:</span>
                <span className="text-rose-600 text-xl font-black">
                  {grandTotal} {settings.currency}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handlePlaceOrder}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-black text-sm shadow-xl hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>تأكيد الطلب وإرسال عبر واتساب ({grandTotal} {settings.currency})</span>
            </button>

            <div className="text-[11px] text-stone-400 text-center space-y-1">
              <p>🔒 تأكيد فوري وآمن: سيتم تسجيل طلبك فورياً في النظام وفتح محادثة واتساب لتأكيد الشحن.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
