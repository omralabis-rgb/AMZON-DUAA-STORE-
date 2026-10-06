import React, { useState } from 'react';
import { Search, Trash2, Edit3, Plus, Sparkles, Star, Package, Eye, MessageCircle, AlertTriangle } from 'lucide-react';
import { Category, Product, StoreSettings } from '../types';
import { generateSingleProductWhatsAppUrl } from '../lib/whatsapp';

interface AdminProductListProps {
  products: Product[];
  categories: Category[];
  onDeleteProduct: (id: string) => void;
  onUpdateStock: (id: string, newStock: number) => void;
  onToggleFeatured: (id: string) => void;
  settings: StoreSettings;
}

export const AdminProductList: React.FC<AdminProductListProps> = ({
  products,
  categories,
  onDeleteProduct,
  onUpdateStock,
  onToggleFeatured,
  settings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-rose-600" />
            <span>إدارة المنتجات والمخزون ({products.length})</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            عرض وتعديل ومراقبة المنتجات والكميات المخزنة في المتجر
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="بحث بالاسم أو الوسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs p-2.5 pr-8 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-rose-500"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3" />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-rose-500"
          >
            <option value="all">كل الأقسام</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table or Cards */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-stone-500 text-xs">
          لا توجد منتجات مطابقة لخيارات البحث
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                <th className="py-3 px-4 rounded-r-xl">المنتج</th>
                <th className="py-3 px-3">القسم</th>
                <th className="py-3 px-3">السعر</th>
                <th className="py-3 px-3">المخزون</th>
                <th className="py-3 px-3">النوع</th>
                <th className="py-3 px-4 rounded-l-xl text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.map((p) => {
                const currentPrice = p.discount_price ?? p.original_price;
                const singleWhatsApp = generateSingleProductWhatsAppUrl(p, settings);

                return (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                    {/* Product Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url}
                          alt={p.title_ar}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-stone-900 max-w-xs sm:max-w-md truncate">
                            {p.title_ar}
                          </h4>
                          <span className="text-[10px] text-stone-400">
                            ID: {p.id.slice(0, 12)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-lg font-medium">
                        {p.category_name}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 font-bold text-stone-900">
                      <div>
                        <span>
                          {currentPrice} {settings.currency}
                        </span>
                        {p.discount_price && (
                          <span className="block text-[10px] text-stone-400 line-through">
                            {p.original_price} {settings.currency}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock & Quick Adjust */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateStock(p.id, Math.max(0, p.stock_quantity - 1))}
                          className="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                        >
                          -
                        </button>
                        <span
                          className={`w-8 text-center font-bold ${
                            p.stock_quantity <= 0
                              ? 'text-rose-600'
                              : p.stock_quantity <= 5
                              ? 'text-amber-600'
                              : 'text-stone-800'
                          }`}
                        >
                          {p.stock_quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateStock(p.id, p.stock_quantity + 1)}
                          className="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Type / AI */}
                    <td className="py-3 px-3">
                      {p.ai_generated ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Gemini
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[10px]">يدوي</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onToggleFeatured(p.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.featured
                              ? 'text-amber-500 bg-amber-50'
                              : 'text-stone-400 hover:text-stone-600'
                          }`}
                          title={p.featured ? 'إلغاء التمييز' : 'تمييز المنتج في المتجر'}
                        >
                          <Star className={`w-4 h-4 ${p.featured ? 'fill-amber-400' : ''}`} />
                        </button>

                        <a
                          href={singleWhatsApp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="تجربة رابط الواتساب لهذا المنتج"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف المنتج: ${p.title_ar}؟`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="حذف المنتج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProductList;
