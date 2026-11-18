import React, { useState } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, PieChart, Calendar, Award, DollarSign } from 'lucide-react';
import { Order, Product, StoreSettings } from '../types';

interface AdminAnalyticsChartsProps {
  orders: Order[];
  products: Product[];
  settings: StoreSettings;
}

export const AdminAnalyticsCharts: React.FC<AdminAnalyticsChartsProps> = ({
  orders,
  products,
  settings,
}) => {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('30days');
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'status'>('sales');

  // Filter orders by time range
  const now = Date.now();
  const rangeMs = timeRange === '7days' ? 7 * 86400000 : timeRange === '30days' ? 30 * 86400000 : Number.MAX_SAFE_INTEGER;
  const filteredOrders = orders.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return now - t <= rangeMs;
  });

  const activeOrders = filteredOrders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = activeOrders.reduce((acc, o) => acc + o.total_amount, 0);
  const totalItemsSold = activeOrders.reduce((acc, o) => acc + o.items.reduce((sum, item) => sum + item.quantity, 0), 0);
  const avgOrderValue = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;

  // 1. Daily Sales aggregation
  const dailySalesMap: Record<string, { revenue: number; count: number }> = {};
  // Initialize last 7 or 30 days
  const daysCount = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 14;
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().split('T')[0];
    dailySalesMap[key] = { revenue: 0, count: 0 };
  }

  activeOrders.forEach((o) => {
    const dayKey = o.created_at.split('T')[0];
    if (!dailySalesMap[dayKey]) {
      dailySalesMap[dayKey] = { revenue: 0, count: 0 };
    }
    dailySalesMap[dayKey].revenue += o.total_amount;
    dailySalesMap[dayKey].count += 1;
  });

  const dailySalesArray = Object.entries(dailySalesMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-daysCount);

  const maxRevenue = Math.max(1, ...dailySalesArray.map(([, v]) => v.revenue));

  // 2. Top-Selling Products aggregation
  const productSalesMap: Record<string, { title: string; quantity: number; revenue: number; image: string }> = {};
  activeOrders.forEach((o) => {
    o.items.forEach((item) => {
      const pid = item.product_id;
      if (!productSalesMap[pid]) {
        productSalesMap[pid] = {
          title: item.title_ar,
          quantity: 0,
          revenue: 0,
          image: item.image_url,
        };
      }
      productSalesMap[pid].quantity += item.quantity;
      productSalesMap[pid].revenue += item.price * item.quantity;
    });
  });

  const topProductsArray = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const maxProductQty = Math.max(1, ...topProductsArray.map((p) => p.quantity));

  // 3. Order Status Breakdown
  const statusCounts = {
    pending: filteredOrders.filter((o) => o.status === 'pending').length,
    processing: filteredOrders.filter((o) => o.status === 'processing').length,
    shipped: filteredOrders.filter((o) => o.status === 'shipped').length,
    delivered: filteredOrders.filter((o) => o.status === 'delivered').length,
    cancelled: filteredOrders.filter((o) => o.status === 'cancelled').length,
  };
  const totalFilteredCount = Math.max(1, filteredOrders.length);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            <span>لوحة التحليلات والرسوم البيانية المتقدمة</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            تحليل بصري تفاعلي للمبيعات اليومية، المنتجات الأكثر طلباً، واتجاهات الحالات
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center bg-stone-100 p-1 rounded-2xl text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setTimeRange('7days')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeRange === '7days' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            آخر 7 أيام
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('30days')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeRange === '30days' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            آخر 30 يوماً
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeRange === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            الكل
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-5 rounded-2xl border border-rose-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-800 block mb-1">إجمالي المبيعات بالفترة</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900">
              {totalRevenue} {settings.currency}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-800 block mb-1">إجمالي القطع المباعة</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900">{totalItemsSold} قطعة</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 block mb-1">متوسط قيمة الطلب</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900">
              {avgOrderValue} {settings.currency}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-stone-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'sales'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>مخطط المبيعات اليومية</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>المنتجات الأكثر مبيعاً</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'status'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>توزيع حالات الطلبات</span>
        </button>
      </div>

      {/* Tab 1: Daily Sales Chart */}
      {activeTab === 'sales' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>حجم المبيعات اليومية ({settings.currency})</span>
            <span>عدد الأيام: {dailySalesArray.length}</span>
          </div>

          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200/80">
            <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 px-2 overflow-x-auto no-scrollbar">
              {dailySalesArray.map(([dateStr, data]) => {
                const heightPct = Math.max(8, Math.round((data.revenue / maxRevenue) * 100));
                const shortDate = dateStr.split('-').slice(1).join('/');

                return (
                  <div key={dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group min-w-[36px]">
                    <div className="text-[10px] font-bold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1.5 py-0.5 rounded shadow-xs">
                      {data.revenue}
                    </div>

                    <div
                      className="w-full bg-gradient-to-t from-rose-600 to-rose-500 rounded-xl transition-all duration-500 group-hover:from-rose-700 group-hover:to-rose-600 shadow-sm"
                      style={{ height: `${heightPct}%` }}
                      title={`${dateStr}: ${data.revenue} ${settings.currency} (${data.count} طلب)`}
                    />

                    <span className="text-[10px] font-mono text-stone-500 truncate max-w-full" title={dateStr}>
                      {shortDate}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Top Selling Products */}
      {activeTab === 'products' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>المنتجات الأكثر طلباً حسب الكمية المباعة</span>
            <span>أبرز 5 منتجات</span>
          </div>

          <div className="space-y-3">
            {topProductsArray.length === 0 ? (
              <div className="text-center py-12 text-xs text-stone-400">لا توجد بيانات مبيعات كافية بعد.</div>
            ) : (
              topProductsArray.map((p, idx) => {
                const widthPct = Math.round((p.quantity / maxProductQty) * 100);

                return (
                  <div key={idx} className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1">{p.title}</span>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="font-black text-rose-600 text-xs sm:text-sm">{p.quantity} قطعة</span>
                        <span className="text-[11px] text-stone-400 block">({p.revenue} {settings.currency})</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-rose-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, widthPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Order Status Breakdown */}
      {activeTab === 'status' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>توزيع حالات الطلبات في الفترة المحددة</span>
            <span>الإجمالي: {filteredOrders.length} طلب</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-center space-y-1">
              <span className="text-xs font-bold text-amber-800">قيد المراجعة</span>
              <span className="text-2xl font-black text-amber-900 block">{statusCounts.pending}</span>
              <span className="text-[10px] text-amber-700">
                ({Math.round((statusCounts.pending / totalFilteredCount) * 100)}%)
              </span>
            </div>

            <div className="bg-sky-50/80 p-4 rounded-2xl border border-sky-200 text-center space-y-1">
              <span className="text-xs font-bold text-sky-800">جاري التجهيز</span>
              <span className="text-2xl font-black text-sky-900 block">{statusCounts.processing}</span>
              <span className="text-[10px] text-sky-700">
                ({Math.round((statusCounts.processing / totalFilteredCount) * 100)}%)
              </span>
            </div>

            <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200 text-center space-y-1">
              <span className="text-xs font-bold text-purple-800">تم الشحن</span>
              <span className="text-2xl font-black text-purple-900 block">{statusCounts.shipped}</span>
              <span className="text-[10px] text-purple-700">
                ({Math.round((statusCounts.shipped / totalFilteredCount) * 100)}%)
              </span>
            </div>

            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-800">تم التوصيل</span>
              <span className="text-2xl font-black text-emerald-900 block">{statusCounts.delivered}</span>
              <span className="text-[10px] text-emerald-700">
                ({Math.round((statusCounts.delivered / totalFilteredCount) * 100)}%)
              </span>
            </div>

            <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 text-center space-y-1 sm:col-span-2 md:col-span-1">
              <span className="text-xs font-bold text-rose-800">ملغي</span>
              <span className="text-2xl font-black text-rose-900 block">{statusCounts.cancelled}</span>
              <span className="text-[10px] text-rose-700">
                ({Math.round((statusCounts.cancelled / totalFilteredCount) * 100)}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsCharts;
