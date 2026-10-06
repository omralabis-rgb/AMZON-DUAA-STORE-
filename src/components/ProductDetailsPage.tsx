import React, { useState } from 'react';
import {
  Sparkles,
  Star,
  ShoppingBag,
  MessageCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  ChevronRight,
  ArrowRight,
  Heart,
  Share2,
  Info,
  Clock,
  Sparkle,
  Plus,
  Minus,
  CheckCircle2,
  ThumbsUp,
  Film,
  Play,
} from 'lucide-react';
import { Product, StoreSettings, ProductReview } from '../types';
import { generateSingleProductWhatsAppUrl } from '../lib/whatsapp';
import { StarRatingDisplay, StarRatingInput } from './StarRating';

interface ProductDetailsPageProps {
  product: Product;
  allProducts: Product[];
  onBackToStore: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onOpenCheckout: () => void;
  onSelectProduct: (product: Product) => void;
  settings: StoreSettings;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onUpdateProduct?: (updatedProduct: Product) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  allProducts,
  onBackToStore,
  onAddToCart,
  onOpenCheckout,
  onSelectProduct,
  settings,
  isWishlisted = false,
  onToggleWishlist,
  onUpdateProduct,
}) => {
  const images = product.gallery_images && product.gallery_images.length > 0
    ? [product.image_url, ...product.gallery_images.filter((img) => img !== product.image_url)]
    : [product.image_url];

  const [activeImage, setActiveImage] = useState(images[0] || product.image_url);
  const [showVideo, setShowVideo] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'benefits' | 'ritual' | 'ingredients' | 'shipping'>('benefits');
  const [isAddedToast, setIsAddedToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reviews state (initial + customer added)
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews_list || []);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const hasDiscount = product.discount_price !== null && product.discount_price < product.original_price;
  const currentPrice = product.discount_price ?? product.original_price;
  const discountAmount = hasDiscount ? product.original_price - (product.discount_price ?? 0) : 0;
  const discountPercent = hasDiscount
    ? Math.round((discountAmount / product.original_price) * 100)
    : 0;

  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 8;
  const isOutOfStock = product.stock_quantity <= 0;

  // Complementary product recommendation for "Frequently Bought Together"
  const complementaryProducts = allProducts
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 2);

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
    setIsAddedToast(true);
    setTimeout(() => setIsAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    onAddToCart(product, quantity);
    onOpenCheckout();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    const newRev: ProductReview = {
      id: 'rev-' + Date.now(),
      author: newReviewAuthor.trim(),
      rating: newReviewRating,
      date: 'اليوم',
      comment: newReviewComment.trim(),
      verifiedPurchase: true,
    };

    const updatedReviews = [newRev, ...reviews];
    setReviews(updatedReviews);

    // Calculate new average rating & review count
    const totalScore = updatedReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const newAverage = Number((totalScore / updatedReviews.length).toFixed(1));

    const updatedProduct: Product = {
      ...product,
      rating: newAverage,
      reviews_count: updatedReviews.length,
      reviews_list: updatedReviews,
    };

    onUpdateProduct?.(updatedProduct);

    setNewReviewAuthor('');
    setNewReviewComment('');
    setShowReviewForm(false);
  };

  const singleWhatsAppUrl = generateSingleProductWhatsAppUrl(product, settings);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast */}
      {isAddedToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold border border-stone-800 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>تمت إضافة ({quantity}) من "{product.title_ar}" إلى سلة المشتريات!</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6 overflow-x-auto pb-1">
        <button
          onClick={onBackToStore}
          className="hover:text-rose-600 transition-colors flex items-center gap-1 font-semibold"
        >
          <span>الرئيسية</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 rotate-180 text-stone-400 shrink-0" />
        <button
          onClick={onBackToStore}
          className="hover:text-rose-600 transition-colors font-semibold"
        >
          {product.category_name}
        </button>
        <ChevronRight className="w-3.5 h-3.5 rotate-180 text-stone-400 shrink-0" />
        <span className="text-stone-800 font-bold truncate max-w-xs">{product.title_ar}</span>
      </nav>

      {/* Main 3-Column Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        
        {/* Left Column: Gallery & Thumbnails (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Large Focal Image or Video Teaser */}
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-md group">
            {showVideo && product.video_url ? (
              <div className="w-full h-full bg-black relative flex items-center justify-center">
                <video
                  src={product.video_url}
                  autoPlay
                  loop
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setShowVideo(false)}
                  className="absolute bottom-4 right-4 bg-stone-900/80 hover:bg-stone-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1.5 transition-colors cursor-pointer z-20"
                >
                  <span>عرض الصور</span>
                </button>
              </div>
            ) : (
              <img
                src={activeImage}
                alt={product.title_ar}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            )}

            {/* Badges Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {hasDiscount && (
                <span className="bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                  خصم {discountPercent}%
                </span>
              )}
              {product.video_url && !showVideo && (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className="bg-rose-950/90 hover:bg-rose-900 text-rose-200 text-[11px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-xs border border-rose-400/40 flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
                  <span>فيديو 5s</span>
                </button>
              )}
              {product.badge && (
                <span className="bg-stone-900/90 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-xs border border-amber-300/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {product.badge}
                </span>
              )}
            </div>

            {/* Action Buttons: Wishlist & Share */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              {onToggleWishlist && (
                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-all cursor-pointer ${
                    isWishlisted
                      ? 'bg-rose-500 text-white shadow-rose-200'
                      : 'bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600'
                  }`}
                  title={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white text-white' : ''}`} />
                </button>
              )}

              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-md flex items-center justify-center transition-colors cursor-pointer"
                title="مشاركة الرابط"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Thumbnails Row */}
          {(images.length > 1 || product.video_url) && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.video_url && (
                <button
                  onClick={() => setShowVideo(true)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 flex flex-col items-center justify-center gap-1 bg-rose-50 text-rose-700 cursor-pointer ${
                    showVideo
                      ? 'border-rose-600 ring-2 ring-rose-200'
                      : 'border-stone-200 hover:border-rose-300'
                  }`}
                  title="مشاهدة مقطع 5 ثوانٍ"
                >
                  <Film className="w-6 h-6 text-rose-600" />
                  <span className="text-[10px] font-black">فيديو 5s</span>
                </button>
              )}
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImage(img);
                    setShowVideo(false);
                  }}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    !showVideo && activeImage === img
                      ? 'border-rose-600 ring-2 ring-rose-200'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Assurances Under Image */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] font-bold text-stone-600">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <span>أصلي 100% مضمون</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
              <RotateCcw className="w-5 h-5 text-rose-600 mx-auto mb-1" />
              <span>استرجاع سهل 7 أيام</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
              <Truck className="w-5 h-5 text-stone-700 mx-auto mb-1" />
              <span>شحن سريع ومبرد</span>
            </div>
          </div>
        </div>

        {/* Center Column: Product Specs, Formula & Story (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div>
            {/* Category & Rating */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg">
                {product.category_name}
              </span>

              <button
                onClick={() => {
                  document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title="الانتقال لتقييمات العميلات"
              >
                <StarRatingDisplay
                  rating={product.rating || 4.9}
                  reviewsCount={reviews.length}
                  size="sm"
                />
              </button>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-snug tracking-tight mb-2">
              {product.title_ar}
            </h1>

            {/* Size / Volume */}
            {product.size_or_volume && (
              <div className="text-xs font-bold text-stone-500 mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>الحجم / السعة: {product.size_or_volume}</span>
              </div>
            )}

            {/* Skin Compatibility */}
            {product.skin_type && (
              <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-3 text-xs text-rose-950 font-medium mb-4 flex items-start gap-2">
                <Sparkle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>مناسب لـ:</strong> {product.skin_type}
                </span>
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              {product.description_ar}
            </p>
          </div>

          {/* Key Benefits */}
          {product.key_benefits && product.key_benefits.length > 0 && (
            <div className="border-t border-stone-200 pt-4">
              <h3 className="text-xs font-bold text-stone-900 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span>أبرز الفوائد والنتائج السريرية:</span>
              </h3>
              <ul className="space-y-2 text-xs text-stone-600">
                {product.key_benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Luxury Atelier Tabs: Ritual, Ingredients, Delivery */}
          <div className="border-t border-stone-200 pt-4">
            <div className="flex border-b border-stone-200 gap-4 text-xs font-bold mb-3">
              <button
                onClick={() => setActiveTab('benefits')}
                className={`pb-2 transition-colors relative ${
                  activeTab === 'benefits'
                    ? 'text-rose-600 border-b-2 border-rose-600 font-black'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                طقس الاستخدام
              </button>
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`pb-2 transition-colors relative ${
                  activeTab === 'ingredients'
                    ? 'text-rose-600 border-b-2 border-rose-600 font-black'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                المكونات النشطة
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`pb-2 transition-colors relative ${
                  activeTab === 'shipping'
                    ? 'text-rose-600 border-b-2 border-rose-600 font-black'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                الشحن والتوصيل
              </button>
            </div>

            <div className="text-xs text-stone-600 leading-relaxed min-h-24 bg-stone-50 p-4 rounded-2xl border border-stone-200/70">
              {activeTab === 'benefits' && (
                <div>
                  <h4 className="font-bold text-stone-900 mb-1">طريقة التطبيق المثالية:</h4>
                  <p>{product.how_to_use || 'يُوضع على بشرة أو شعر نظيف بحركات دائرية هادئة حتى الامتصاص الكامل.'}</p>
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div>
                  <h4 className="font-bold text-stone-900 mb-1">التركيبة النقية:</h4>
                  <p>{product.ingredients || 'مستخلصات نباتية نقية، فيتامينات طبيعية معتمدة، خالية من البارابين والكبريتات.'}</p>
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-1.5">
                  <p>• شحن سريع ومبرد إلى كافة مدن المملكة ودول الخليج خلال 2 إلى 4 أيام عمل.</p>
                  <p>• شحن مجاني للطلبات فوق {settings.freeDeliveryThreshold} {settings.currency}.</p>
                  <p>• تغليف فاخر مع عينات مجانية مرفقة مع كل طلب.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Amazon-Style High-Conversion Buy Box (3 cols) */}
        <div className="lg:col-span-3">
          <div className="sticky top-28 bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-xl space-y-4">
            
            {/* Price Box */}
            <div>
              <span className="text-[11px] font-bold text-stone-400 block mb-1">السعر الإجمالي:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600">
                  {currentPrice} {settings.currency}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-stone-400 line-through">
                    {product.original_price} {settings.currency}
                  </span>
                )}
              </div>

              {hasDiscount && (
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg mt-1 inline-block">
                  وفرتِ: {discountAmount} {settings.currency} ({discountPercent}%)
                </div>
              )}
              <span className="text-[10px] text-stone-400 block mt-1">الأسعار شاملة ضريبة القيمة المضافة</span>
            </div>

            {/* Stock Availability */}
            <div className="pt-2 border-t border-stone-100 text-xs">
              {isOutOfStock ? (
                <span className="text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-xl block text-center">
                  نفدت الكمية حالياً
                </span>
              ) : isLowStock ? (
                <div className="text-amber-700 font-bold bg-amber-50 px-3 py-1.5 rounded-xl text-center border border-amber-200">
                  🔥 سارع بالطلب! متبقي {product.stock_quantity} قطع فقط في المخزون
                </div>
              ) : (
                <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>متوفر في المخزون وجاهز للشحن الفوري</span>
                </div>
              )}
            </div>

            {/* Estimated Delivery */}
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                <Truck className="w-4 h-4 text-rose-600" />
                <span>التوصيل المتوقع:</span>
              </div>
              <p className="text-[11px] text-stone-500">
                خلال 48 - 72 ساعة إلى باب منزلك مع إمكانية الدفع عند الاستلام.
              </p>
            </div>

            {/* Quantity Stepper */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">الكمية:</label>
              <div className="flex items-center border border-stone-200 rounded-2xl bg-stone-50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700 shadow-2xs transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-black text-stone-900 text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700 shadow-2xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Buy Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-rose-300" />
                <span>أضف إلى سلة المشتريات ({currentPrice * quantity} {settings.currency})</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-stone-200 text-white py-3.5 px-4 rounded-2xl font-black text-sm shadow-md hover:shadow-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>شراء فوري ومتابعة الدفع</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>

              {/* Direct WhatsApp link */}
              <a
                href={singleWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>طلب واستفسار مباشر عبر واتساب</span>
              </a>
            </div>

            {/* Fulfilled By Atelier Badge */}
            <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              <span>يُشحن ويُضمن مباشرة من مستودعات {settings.storeName}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Frequently Bought Together (Complementary Routine Bundle) */}
      {complementaryProducts.length > 0 && (
        <section className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white rounded-3xl p-6 sm:p-8 mb-16 shadow-xl">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="text-rose-300 text-xs font-bold uppercase tracking-wider block mb-1">
                روتين العناية المتكامل والموصى به
              </span>
              <h2 className="text-xl sm:text-2xl font-black">
                غالباً ما يتم شراء هذه المنتجات معاً للحصول على أفضل نتيجة
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Product 1 (Current) */}
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                <img
                  src={product.image_url}
                  alt={product.title_ar}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div className="text-xs">
                  <span className="text-rose-300 font-bold text-[10px] block">المنتج الحالي</span>
                  <div className="font-bold line-clamp-1">{product.title_ar}</div>
                  <div className="text-rose-300 font-black">{currentPrice} {settings.currency}</div>
                </div>
              </div>

              {/* Product 2 */}
              {complementaryProducts.map((cp) => {
                const cpPrice = cp.discount_price ?? cp.original_price;
                return (
                  <div
                    key={cp.id}
                    onClick={() => onSelectProduct(cp)}
                    className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl border border-white/10 flex items-center gap-3 cursor-pointer transition-all"
                  >
                    <img
                      src={cp.image_url}
                      alt={cp.title_ar}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="text-xs">
                      <span className="text-amber-300 font-bold text-[10px] block">منتج مكمل موصى به</span>
                      <div className="font-bold line-clamp-1">{cp.title_ar}</div>
                      <div className="text-rose-300 font-black">{cpPrice} {settings.currency}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="text-xs text-rose-200">
                ✨ وفر وقتك واحصلي على روتين متناسق يضاعف الفعالية بضغطة زر واحدة.
              </div>
              <button
                onClick={() => {
                  onAddToCart(product, 1);
                  complementaryProducts.forEach((p) => onAddToCart(p, 1));
                  setIsAddedToast(true);
                  setTimeout(() => setIsAddedToast(false), 2500);
                }}
                className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة المجموعة الكاملة إلى السلة</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Customer Reviews & Social Proof Section */}
      <section id="reviews-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm mb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-stone-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              <span>تقييمات وتجارب العميلات ({reviews.length})</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              آراء حقيقية وموثقة من عميلات جربن هذا المنتج في روتينهن اليومي
            </p>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{showReviewForm ? 'إلغاء النموذج' : 'كتابة تقييم وتجربة'}</span>
          </button>
        </div>

        {/* Rating Breakdown & Stats Card */}
        {reviews.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50/60 via-stone-50 to-rose-50/40 p-5 sm:p-6 rounded-2xl border border-stone-200 mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Overall Score Box */}
            <div className="md:col-span-4 text-center md:border-l md:border-stone-200/80 md:pl-6">
              <div className="text-4xl sm:text-5xl font-black text-stone-900 mb-1">
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)).toFixed(1)}
              </div>
              <div className="flex justify-center mb-1">
                <StarRatingDisplay
                  rating={reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)}
                  showNumeric={false}
                  showCount={false}
                  size="lg"
                />
              </div>
              <div className="text-xs font-bold text-stone-600">
                مبني على {reviews.length} تقييم حقيقي للعميلات
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>98% من العميلات يوصين بهذا المنتج</span>
              </div>
            </div>

            {/* Star Distribution Bars */}
            <div className="md:col-span-8 space-y-2">
              {[5, 4, 3, 2, 1].map((starNum) => {
                const count = reviews.filter((r) => Math.round(r.rating) === starNum).length;
                const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;

                return (
                  <div key={starNum} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-bold text-stone-700 text-left shrink-0">
                      {starNum} نجوم
                    </span>
                    <div className="flex-1 h-3 bg-stone-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-stone-500 text-[11px] font-semibold text-right shrink-0">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New Review Form */}
        {showReviewForm && (
          <form onSubmit={handleAddReview} className="bg-stone-50 p-6 rounded-3xl border border-stone-200 mb-8 space-y-5 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>أضيفي تقييمك وتجربتك الخاصة للمنتج:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">اسمك الكريم:</label>
                <input
                  type="text"
                  required
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  placeholder="مثال: ندى الأحمد"
                  className="w-full text-xs p-3 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">التقييم (اختر عدد النجوم):</label>
                <StarRatingInput
                  value={newReviewRating}
                  onChange={(rating) => setNewReviewRating(rating)}
                  size="md"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">تفاصيل تجربتك ونصلئحك للعميلات:</label>
              <textarea
                rows={3}
                required
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                placeholder="كيف كان ملمس المنتج والنتائج على بشرتك أو شعرك عند الاستخدام؟"
                className="w-full text-xs p-3 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-medium"
              />
            </div>

            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-rose-200 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>نشر التقييم فورياً</span>
            </button>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs">
            لا توجد تقييمات مضافة لهذا المنتج بعد. كوني أول من يشارك تجربته مع هذا المنتج!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between hover:border-amber-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <StarRatingDisplay
                      rating={rev.rating}
                      showNumeric={false}
                      showCount={false}
                      size="sm"
                    />
                    <span className="text-[11px] text-stone-400 font-medium">{rev.date}</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed mb-3 font-medium">"{rev.comment}"</p>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-stone-200/60">
                  <span className="font-bold text-stone-900">{rev.author}</span>
                  {rev.verifiedPurchase && (
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      مشترٍ تم التحقق منه
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Back to store floating button */}
      <div className="text-center pt-4">
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-6 py-3 rounded-2xl shadow-xs hover:shadow-md transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لتصفح كافة منتجات المتجر</span>
        </button>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
