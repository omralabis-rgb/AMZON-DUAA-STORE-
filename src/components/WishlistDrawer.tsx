import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight, Sparkles, Check } from 'lucide-react';
import { Product, StoreSettings } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistProducts: Product[];
  onRemoveFromWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onClearWishlist: () => void;
  onOpenDetails: (product: Product) => void;
  settings: StoreSettings;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistProducts,
  onRemoveFromWishlist,
  onAddToCart,
  onClearWishlist,
  onOpenDetails,
  settings,
}) => {
  if (!isOpen) return null;

  const handleAddAllToCart = () => {
    wishlistProducts.forEach((product) => {
      if (product.stock_quantity > 0) {
        onAddToCart(product, 1);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-rose-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shadow-xs">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-stone-900">المفضلة وقائمة الأمنيات</h2>
              <p className="text-xs text-stone-500">تم حفظ {wishlistProducts.length} منتجاً</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {wishlistProducts.length > 0 && (
              <button
                onClick={onClearWishlist}
                className="text-stone-400 hover:text-rose-600 p-2 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="إفراغ المفضلة"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">إفراغ</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border border-stone-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-stone-100">
          {wishlistProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mb-2 border border-rose-100 shadow-sm">
                <Heart className="w-10 h-10 text-rose-300" />
              </div>
              <h3 className="font-black text-stone-800 text-base sm:text-lg">قائمة المفضلة فارغة حالياً</h3>
              <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                انقر على أيقونة القلب ❤️ على أي منتج يحوز على إعجابك لحفظه هنا والرجوع إليه في أي وقت!
              </p>
              <button
                onClick={onClose}
                className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer mt-2"
              >
                تصفح المنتجات الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlistProducts.map((product) => {
                const currentPrice = product.discount_price ?? product.original_price;
                const isOutOfStock = product.stock_quantity <= 0;

                return (
                  <div key={product.id} className="pt-3 first:pt-0 flex gap-3 sm:gap-4 items-center">
                    <img
                      src={product.image_url}
                      alt={product.title_ar}
                      onClick={() => {
                        onOpenDetails(product);
                        onClose();
                      }}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover bg-stone-100 shrink-0 border border-stone-200/60 cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => {
                              onOpenDetails(product);
                              onClose();
                            }}
                            className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1 leading-snug cursor-pointer hover:text-rose-600 transition-colors"
                          >
                            {product.title_ar}
                          </h4>
                          <button
                            onClick={() => onRemoveFromWishlist(product)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer shrink-0"
                            title="إزالة من المفضلة"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-rose-600">
                            {currentPrice} {settings.currency}
                          </span>
                          {product.discount_price && (
                            <span className="text-[10px] text-stone-400 line-through">
                              {product.original_price} {settings.currency}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
                        <span className="text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-medium">
                          {product.category_name}
                        </span>

                        <button
                          onClick={() => onAddToCart(product, 1)}
                          disabled={isOutOfStock}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isOutOfStock
                              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              : 'bg-stone-900 hover:bg-stone-800 text-white shadow-2xs'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-rose-300" />
                          <span>{isOutOfStock ? 'نفدت الكمية' : 'أضف للسلة'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlistProducts.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3">
            <button
              onClick={handleAddAllToCart}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span>إضافة جميع المنتجات للسلة ({wishlistProducts.length})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
