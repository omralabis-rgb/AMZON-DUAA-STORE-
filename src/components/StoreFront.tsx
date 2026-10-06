import React, { useState, useMemo } from 'react';
import { Sparkles, Search, SlidersHorizontal, ArrowUpDown, ShieldCheck, Truck, Gift, MessageCircle, X } from 'lucide-react';
import { Category, Product, StoreSettings } from '../types';
import { ProductCard } from './ProductCard';
import { searchProducts } from '../lib/search';
import { TrustBadgesBar } from './TrustBadgesBar';

interface StoreFrontProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
  cartProductIds: Set<string>;
  wishlistIds?: Set<string>;
  onToggleWishlist?: (product: Product) => void;
  settings: StoreSettings;
  onOpenAdmin: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

export const StoreFront: React.FC<StoreFrontProps> = ({
  products,
  categories,
  onAddToCart,
  onQuickView,
  onOpenDetails,
  cartProductIds,
  wishlistIds = new Set(),
  onToggleWishlist,
  settings,
  onOpenAdmin,
  searchQuery = '',
  onSearchQueryChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [internalSearch, setInternalSearch] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-low' | 'price-high' | 'discount'>('featured');

  const activeQuery = searchQuery !== undefined && onSearchQueryChange ? searchQuery : internalSearch;

  const handleQueryChange = (val: string) => {
    if (onSearchQueryChange) {
      onSearchQueryChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  // Filter & Sort using Semantic Search Engine
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category_id === selectedCategory);
    }

    // Semantic & Text Search
    if (activeQuery.trim()) {
      const searchMatches = searchProducts(list, activeQuery);
      list = searchMatches.map((m) => m.product);
    } else {
      // Sorting when not actively ranked by search relevance
      list.sort((a, b) => {
        const priceA = a.discount_price ?? a.original_price;
        const priceB = b.discount_price ?? b.original_price;

        if (sortBy === 'featured') {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'price-low') {
          return priceA - priceB;
        }
        if (sortBy === 'price-high') {
          return priceB - priceA;
        }
        if (sortBy === 'discount') {
          const discA = a.discount_price ? a.original_price - a.discount_price : 0;
          const discB = b.discount_price ? b.original_price - b.discount_price : 0;
          return discB - discA;
        }
        return 0;
      });
    }

    return list;
  }, [products, selectedCategory, activeQuery, sortBy]);

  return (
    <div className="pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-950 via-stone-900 to-rose-950 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 mb-10 rounded-3xl mx-4 sm:mx-6 lg:mx-8 shadow-xl mt-4">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-200 border border-white/10 mb-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>تسوق ذكي مدعوم بالذكاء الاصطناعي وبحث دلالي فوري</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-tight">
            جمالكِ يستحق الأفضل <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-rose-300 via-rose-100 to-amber-200 bg-clip-text text-transparent">
              عناية فائقة، عطور فاخرة، ومستحضرات أصلية 100%
            </span>
          </h1>

          <p className="text-sm sm:text-base text-rose-100/80 max-w-2xl mx-auto leading-relaxed">
            اختاري منتجاتكِ المفضلة وأضيفيها للسلة، ثم أتمي الطلب مباشرة عبر الواتساب مع حساب فوري للخصومات والتوصيل.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                'مرحباً، أود استشارة أخصائية العناية بالبشرة لاختيار المنتجات المناسبة لي.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>استشارة مجانية عبر واتساب</span>
            </a>

            <button
              onClick={onOpenAdmin}
              className="bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl flex items-center gap-2 border border-white/20 transition-all"
            >
              <Sparkles className="w-4 h-4 text-rose-300" />
              <span>لوحة إضافة المنتجات بالذكاء الاصطناعي</span>
            </button>
          </div>
        </div>
      </section>

      {/* Trust Badges Bar */}
      <TrustBadgesBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar scroll-smooth">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <span>الكل</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {products.length}
            </span>
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span>{cat.name_ar}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200/80 mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          {/* Quick filter input */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="تصفية بالكلمة أو الاحتياج..."
              value={activeQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full text-xs p-2.5 pr-8 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3" />
            {activeQuery && (
              <button
                onClick={() => handleQueryChange('')}
                className="absolute left-2.5 top-2.5 text-stone-400 hover:text-stone-700 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector & Count */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs">
            <span className="text-stone-500 text-xs hidden sm:inline">
              عرض {filteredProducts.length} من {products.length} منتج
              {activeQuery && ` (مطابقة لـ "${activeQuery}")`}
            </span>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-rose-500 text-xs font-semibold text-stone-800"
              >
                <option value="featured">الأكثر طلباً ومميز</option>
                <option value="newest">الأحدث وصولاً</option>
                <option value="price-low">السعر: من الأقل للأعلى</option>
                <option value="price-high">السعر: من الأعلى للأقل</option>
                <option value="discount">أعلى نسبة خصم</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-stone-800 text-base mb-1">لم نجد أي منتجات تطابق بحثك</h3>
            <p className="text-xs text-stone-500 mb-4">
              جربي البحث بكلمات أخرى أو تصفح قسم آخر من الأقسام المتاحة
            </p>
            <button
              onClick={() => {
                handleQueryChange('');
                setSelectedCategory('all');
              }}
              className="bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              عرض كافة المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(p) => onAddToCart(p)}
                onQuickView={onQuickView}
                onOpenDetails={onOpenDetails}
                settings={settings}
                isInCart={cartProductIds.has(product.id)}
                isWishlisted={wishlistIds.has(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating WhatsApp Bubble */}
      <a
        href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
          'مرحباً! أود الاستفسار عن منتجات متجر ' + settings.storeName
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        title="تواصل معنا عبر واتساب"
        className="fixed bottom-6 left-6 z-30 bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-16 bg-stone-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          تواصل معنا عبر واتساب
        </span>
      </a>
    </div>
  );
};
