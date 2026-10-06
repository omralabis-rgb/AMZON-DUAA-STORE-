import React, { useState } from 'react';
import { X, ShoppingBag, MessageCircle, Sparkles, Shield, Heart, Truck, Check } from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { generateSingleProductWhatsAppUrl } from '../lib/whatsapp';
import { StarRatingDisplay } from './StarRating';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  settings: StoreSettings;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  settings,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const hasDiscount = product.discount_price !== null && product.discount_price < product.original_price;
  const currentPrice = product.discount_price ?? product.original_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price - (product.discount_price ?? 0)) / product.original_price) * 100)
    : 0;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const whatsappUrl = generateSingleProductWhatsAppUrl(product, settings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-md flex items-center justify-center transition-colors border border-stone-200"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Column */}
        <div className="md:w-1/2 relative bg-stone-100 flex items-center justify-center p-6">
          <img
            src={product.image_url}
            alt={product.title_ar}
            className="w-full h-full max-h-96 object-cover rounded-2xl shadow-sm"
          />

          <div className="absolute top-6 right-6 flex flex-col gap-2">
            {hasDiscount && (
              <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                خصم {discountPercent}%
              </span>
            )}
            {product.ai_generated && (
              <span className="bg-stone-900/90 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-amber-300/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                تحليل AI معتمد
              </span>
            )}
          </div>
        </div>

        {/* Product Details Column */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Category & Rating */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg">
                {product.category_name}
              </span>
              <StarRatingDisplay
                rating={product.rating || 4.9}
                reviewsCount={product.reviews_count || 12}
                size="sm"
              />
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug mb-3">
              {product.title_ar}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-black text-rose-600">
                {currentPrice} {settings.currency}
              </span>
              {hasDiscount && (
                <span className="text-sm text-stone-400 line-through">
                  {product.original_price} {settings.currency}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3 mb-5 text-sm text-stone-600 leading-relaxed">
              <p>{product.description_ar}</p>

              {product.how_to_use && (
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
                  <h4 className="font-bold text-xs text-stone-800 mb-1">طريقة الاستخدام:</h4>
                  <p className="text-xs text-stone-600">{product.how_to_use}</p>
                </div>
              )}

              {product.ingredients && (
                <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100">
                  <h4 className="font-bold text-xs text-rose-900 mb-1">المكونات الفعالة:</h4>
                  <p className="text-xs text-rose-800/80">{product.ingredients}</p>
                </div>
              )}
            </div>

            {/* Stock status */}
            <div className="mb-4 text-xs">
              {product.stock_quantity > 0 ? (
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
                  متوفر في المخزون ({product.stock_quantity} قطعة)
                </span>
              ) : (
                <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md font-medium">
                  نفدت الكمية حالياً
                </span>
              )}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {product.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg"
                  >
                    #{tag.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-stone-200">
            <div className="flex items-center gap-3 mb-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-stone-300 rounded-2xl p-1 bg-stone-50">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700 transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-stone-900 text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock_quantity || 99, q + 1))}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAdd}
                disabled={product.stock_quantity <= 0}
                className="flex-1 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white py-3 px-4 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>تمت الإضافة للسلة!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-rose-300" />
                    <span>أضف للسلة ({currentPrice * quantity} {settings.currency})</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct WhatsApp button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>طلب مباشر فوري عبر واتساب</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
