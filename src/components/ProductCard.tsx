import React from 'react';
import { ShoppingBag, Eye, MessageCircle, Sparkles, Star, Check, ArrowUpRight } from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { generateSingleProductWhatsAppUrl } from '../lib/whatsapp';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
  settings: StoreSettings;
  isInCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
  onOpenDetails,
  settings,
  isInCart,
}) => {
  const hasDiscount = product.discount_price !== null && product.discount_price < product.original_price;
  const currentPrice = product.discount_price ?? product.original_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price - (product.discount_price ?? 0)) / product.original_price) * 100)
    : 0;

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const singleWhatsAppUrl = generateSingleProductWhatsAppUrl(product, settings);

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-stone-200/80 hover:border-rose-300 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      {/* Image Area */}
      <div
        className="relative aspect-square overflow-hidden bg-stone-100 cursor-pointer"
        onClick={() => onOpenDetails(product)}
      >
        <img
          src={product.image_url}
          alt={product.title_ar}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
          <div className="flex flex-col gap-1 items-start">
            {hasDiscount && (
              <span className="bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs">
                خصم {discountPercent}%
              </span>
            )}
            {product.badge ? (
              <span className="bg-stone-900/90 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-amber-400/30">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {product.badge}
              </span>
            ) : product.ai_generated ? (
              <span className="bg-stone-900/85 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-amber-400/30">
                <Sparkles className="w-3 h-3 text-amber-300" />
                تحليل AI
              </span>
            ) : null}
          </div>

          {isOutOfStock ? (
            <span className="bg-stone-800 text-stone-200 text-xs font-bold px-2.5 py-1 rounded-full">
              نفدت الكمية
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              متبقي {product.stock_quantity} فقط
            </span>
          ) : null}
        </div>

        {/* Hover Action Buttons */}
        <div
          className="absolute inset-0 bg-stone-950/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onOpenDetails(product)}
            className="bg-stone-900/90 hover:bg-stone-900 text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200"
          >
            <span>التفاصيل الكاملة</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onQuickView(product)}
            className="bg-white/95 hover:bg-white text-stone-900 px-3 py-2 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-1 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200"
          >
            <Eye className="w-3.5 h-3.5 text-rose-600" />
            <span>نظرة سريعة</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-2 mb-2 text-xs">
            <span className="text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg font-medium">
              {product.category_name}
            </span>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="font-bold text-stone-800 text-xs">{product.rating || '4.9'}</span>
              <span className="text-stone-400 text-[11px]">({product.reviews_count || '25'})</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onOpenDetails(product)}
            className="font-bold text-stone-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-rose-600 cursor-pointer transition-colors mb-1.5"
            title={product.title_ar}
          >
            {product.title_ar}
          </h3>

          {/* Volume or Skin type tag if present */}
          {product.size_or_volume && (
            <span className="text-[11px] text-stone-400 block mb-1.5 font-medium">
              {product.size_or_volume}
            </span>
          )}

          {/* Description Excerpt */}
          <p className="text-xs text-stone-500 line-clamp-2 mb-3 leading-relaxed">
            {product.description_ar}
          </p>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3.5 pt-2 border-t border-stone-100">
            <span className="text-xl sm:text-2xl font-black text-rose-600">
              {currentPrice} {settings.currency}
            </span>
            {hasDiscount && (
              <span className="text-xs text-stone-400 line-through">
                {product.original_price} {settings.currency}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`col-span-4 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : isInCart
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs hover:shadow-md'
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>في السلة +1</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-rose-300" />
                  <span>أضف للسلة</span>
                </>
              )}
            </button>

            {/* Direct WhatsApp purchase icon */}
            <a
              href={singleWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="طلب مباشر وسريع عبر واتساب"
              className="col-span-1 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
