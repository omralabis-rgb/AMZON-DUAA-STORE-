import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Sparkles, Star, ShoppingBag, ArrowUpRight, Check, Flame, ChevronLeft } from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { searchProducts, POPULAR_SEARCH_TAGS } from '../lib/search';
import { searchProductsFuzzyCloud } from '../lib/cloud';

interface SmartSearchBarProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewAllResults: (query: string) => void;
  settings: StoreSettings;
  className?: string;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onViewAllResults,
  settings,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [cloudMatches, setCloudMatches] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic live search as user types: local fuzzy/trigram + cloud tsvector RPC
  useEffect(() => {
    if (!query.trim()) {
      setCloudMatches([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const { products: fetchedCloud, isCloud } = await searchProductsFuzzyCloud(query);
      if (isCloud && fetchedCloud.length > 0) {
        setCloudMatches(fetchedCloud);
      } else {
        setCloudMatches([]);
      }
    }, 150);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  // Compute live local matches
  const localMatches = searchProducts(products, query);

  // Combine cloud & local matches without duplicates
  const matches = React.useMemo(() => {
    if (!query.trim()) return [];
    if (cloudMatches.length === 0) return localMatches;

    const localMap = new Map(localMatches.map((m) => [m.product.id, m]));
    const combined: typeof localMatches = [];

    // Add cloud results first
    cloudMatches.forEach((cp) => {
      const existing = localMap.get(cp.id);
      combined.push({
        product: cp,
        score: existing ? existing.score + 20 : 80,
        matchedReason: existing?.matchedReason || 'تطابق سحابي متقدم (Supabase FTS + Trigram)',
      });
      localMap.delete(cp.id);
    });

    // Add remaining local matches
    localMap.forEach((m) => combined.push(m));
    combined.sort((a, b) => b.score - a.score);
    return combined;
  }, [query, localMatches, cloudMatches]);

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setIsOpen(false);
    setQuery('');
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onViewAllResults(query.trim());
    setIsOpen(false);
  };

  const handleTagClick = (tagQuery: string) => {
    setQuery(tagQuery);
    onViewAllResults(tagQuery);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="بحث ذكي: ابحثي عن منتج، مكون، أو احتياج (مثال: ترطيب، عطر، أرغان...)"
            className="w-full bg-stone-100 hover:bg-stone-50 focus:bg-white border border-stone-200 focus:border-rose-500 rounded-2xl py-2.5 pr-11 pl-10 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden transition-all shadow-2xs focus:shadow-md"
          />

          {/* Search Icon */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
            <Search className="w-4 h-4 text-rose-600" />
          </div>

          {/* Clear or Submit buttons */}
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-5 h-5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center text-[10px]"
                title="مسح"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl p-1.5 transition-colors shadow-2xs"
              title="بحث"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Dropdown Live Results & Suggestions */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 left-0 bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[80vh] flex flex-col">
          
          {/* State 1: When user hasn't typed yet (Popular searches & beauty shortcuts) */}
          {!query.trim() && (
            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <span className="text-xs font-black text-stone-900 flex items-center gap-1.5 mb-2.5">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>الأكثر رواجاً في الأتيليه:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCH_TAGS.map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTagClick(tag.query)}
                      className="text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-stone-200/80 px-3 py-1.5 rounded-xl transition-all"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100">
                <span className="text-xs font-black text-stone-900 flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>البحث الدلالي الذكي:</span>
                </span>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  يمكنكِ البحث بأسماء المشاكل أو النتائج المرجوة مثل: <em>"ترطيب البشرة الجافة"</em>، <em>"علاج تقصف الشعر"</em>، <em>"ثبات فواح"</em>، وسيتعرف محرك البحث على المنتجات الملائمة فورياً.
                </p>
              </div>
            </div>
          )}

          {/* State 2: When user is typing and results exist */}
          {query.trim() && matches.length > 0 && (
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
              <div className="p-3 bg-stone-50/80 flex items-center justify-between text-xs font-bold text-stone-600">
                <span>النتائج المطابقة ({matches.length} منتج)</span>
                <button
                  type="button"
                  onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
                  className="text-rose-600 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>عرض الكل في المتجر</span>
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-stone-100 p-2">
                {matches.slice(0, 5).map(({ product, matchedReason }) => {
                  const currentPrice = product.discount_price ?? product.original_price;
                  const hasDiscount = product.discount_price !== null && product.discount_price < product.original_price;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelect(product)}
                      className="p-3 rounded-2xl hover:bg-stone-50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      {/* Thumbnail & Titles */}
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={product.image_url}
                          alt={product.title_ar}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.2 rounded font-bold">
                              {product.category_name}
                            </span>
                            {matchedReason && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                {matchedReason}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-stone-900 group-hover:text-rose-600 transition-colors truncate">
                            {product.title_ar}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-black text-rose-600 text-xs">
                              {currentPrice} {settings.currency}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-stone-400 line-through">
                                {product.original_price} {settings.currency}
                              </span>
                            )}
                            <div className="flex items-center gap-0.5 text-[10px] text-amber-500 mr-2">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span className="font-bold text-stone-700">{product.rating || '4.9'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Add to Cart Button */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, product)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all ${
                            addedProductId === product.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700'
                          }`}
                          title="إضافة سريعة للسلة"
                        >
                          {addedProductId === product.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <ShoppingBag className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View All Bottom Bar */}
              {matches.length > 5 && (
                <div className="p-3 bg-stone-50 text-center">
                  <button
                    type="button"
                    onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    عرض كافة النتائج المتبقية ({matches.length} منتج) ←
                  </button>
                </div>
              )}
            </div>
          )}

          {/* State 3: When user is typing but NO results found */}
          {query.trim() && matches.length === 0 && (
            <div className="p-8 text-center text-xs text-stone-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-bold text-stone-800">لم نجد أي منتج يطابق "{query}"</p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                جربي البحث بكلمات أخرى مثل "سيروم"، "ترطيب"، "عطور"، أو اضغطي على أحد الاقتراحات السريعة أدناه.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {POPULAR_SEARCH_TAGS.slice(0, 4).map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTagClick(tag.query)}
                    className="text-[11px] bg-stone-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 rounded-lg"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
