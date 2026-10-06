import React, { useState } from 'react';
import { Package, MessageCircle, Eye, Search, Filter, CheckCircle2, Clock, Truck, XCircle, ArrowUpRight, DollarSign, Code2 } from 'lucide-react';
import { Order, OrderStatus, StoreSettings } from '../types';
import { generateOrderStatusWhatsAppUrl } from '../lib/whatsapp';
import { ShippingRouteMap } from './ShippingRouteMap';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  settings: StoreSettings;
  onOpenDevAdvisor?: () => void;
  onBackToAdmin?: () => void;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: 'قيد المراجعة', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  processing: { label: 'جاري التجهيز', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200', icon: Package },
  shipped: { label: 'تم الشحن', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Truck },
  delivered: { label: 'تم التوصيل', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: XCircle },
};

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  onUpdateStatus,
  settings,
  onOpenDevAdvisor,
  onBackToAdmin,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Statistics
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.total_amount, 0);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const completedCount = orders.filter((o) => o.status === 'delivered').length;

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q) ||
      (o.city && o.city.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-rose-600" />
            <span>إدارة وتتبع طلبات العملاء ({orders.length})</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            سجل كافة الطلبات المحفوظة آلياً عند إتمام العميل للطلب عبر الواتساب مع إمكانية تحديث الحالة
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenDevAdvisor && (
            <button
              onClick={onOpenDevAdvisor}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-200" />
              <span>المستشار البرمجي</span>
            </button>
          )}
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              إدارة المنتجات
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
          <span className="text-[11px] font-bold text-stone-500 block mb-1">إجمالي المبيعات النشطة</span>
          <span className="text-xl sm:text-2xl font-black text-stone-900">
            {totalRevenue} {settings.currency}
          </span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
          <span className="text-[11px] font-bold text-amber-700 block mb-1">طلبات قيد المراجعة</span>
          <span className="text-xl sm:text-2xl font-black text-amber-900">{pendingCount}</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80">
          <span className="text-[11px] font-bold text-emerald-700 block mb-1">طلبات تم تسليمها</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-900">{completedCount}</span>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80">
          <span className="text-[11px] font-bold text-rose-700 block mb-1">إجمالي عدد الطلبات</span>
          <span className="text-xl sm:text-2xl font-black text-rose-900">{orders.length}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedStatus === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            الكل ({orders.length})
          </button>

          {(Object.keys(statusConfig) as OrderStatus[]).map((st) => {
            const count = orders.filter((o) => o.status === st).length;
            const cfg = statusConfig[st];
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedStatus === st
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="بحث برقم الطلب، اسم العميل، الجوال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs p-2.5 pr-8 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-rose-500"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3" />
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-xs">
          لا توجد طلبات مطابقة حالياً
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                <th className="py-3 px-4 rounded-r-xl">رقم الطلب والتاريخ</th>
                <th className="py-3 px-3">العميل والجوال</th>
                <th className="py-3 px-3">المدينة</th>
                <th className="py-3 px-3">المنتجات</th>
                <th className="py-3 px-3">الإجمالي</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-4 rounded-l-xl text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => {
                const cfg = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                const dateStr = new Date(order.created_at).toLocaleDateString('ar-SA', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const whatsappUrl = generateOrderStatusWhatsAppUrl(order, settings);

                return (
                  <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      <div>
                        <span>#{order.order_number}</span>
                        <span className="block font-sans text-[11px] text-stone-400 font-normal">
                          {dateStr}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-stone-800">{order.customer_name}</div>
                      <div className="text-[11px] text-stone-400 font-mono" dir="ltr">
                        {order.customer_phone}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-stone-600">{order.city || 'غير محدد'}</td>

                    <td className="py-3.5 px-3">
                      <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} عنصر
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-black text-rose-600 text-sm">
                      {order.total_amount} {settings.currency}
                    </td>

                    <td className="py-3.5 px-3">
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${cfg.bg} ${cfg.color} focus:outline-hidden cursor-pointer`}
                      >
                        <option value="pending">قيد المراجعة</option>
                        <option value="processing">جاري التجهيز</option>
                        <option value="shipped">تم الشحن</option>
                        <option value="delivered">تم التوصيل</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          title="عرض تفاصيل الطلب"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="تحديث العميل عبر واتساب بحالة الطلب"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <div>
                <span className="text-xs text-rose-600 font-bold">تفاصيل الطلب</span>
                <h3 className="text-lg font-black text-stone-900">
                  #{selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div className="bg-stone-50 p-4 rounded-2xl mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">اسم العميل:</span>
                <span className="font-bold text-stone-800">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">الجوال:</span>
                <span className="font-bold text-stone-800" dir="ltr">{selectedOrder.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">العنوان والمدينة:</span>
                <span className="font-bold text-stone-800">
                  {[selectedOrder.city, selectedOrder.address].filter(Boolean).join(' - ')}
                </span>
              </div>
              {selectedOrder.notes && (
                <div className="pt-2 border-t border-stone-200">
                  <span className="text-stone-500 block mb-0.5">ملاحظات العميل:</span>
                  <p className="text-stone-700">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Live GPS Shipping Map when shipped */}
            {selectedOrder.status === 'shipped' && (
              <div className="mb-4">
                <ShippingRouteMap order={selectedOrder} />
              </div>
            )}

            {/* Items */}
            <h4 className="text-xs font-bold text-stone-700 mb-2">قائمة المنتجات المطلوبة:</h4>
            <div className="divide-y divide-stone-100 mb-4 max-h-48 overflow-y-auto">
              {selectedOrder.items.map((it, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={it.image_url}
                      alt={it.title_ar}
                      className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-stone-800 line-clamp-1">{it.title_ar}</div>
                      <div className="text-stone-400">الكمية: {it.quantity}</div>
                    </div>
                  </div>
                  <div className="font-bold text-stone-900">
                    {it.price * it.quantity} {settings.currency}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculation */}
            <div className="bg-rose-50/50 p-4 rounded-2xl space-y-1.5 text-xs border border-rose-100 mb-6">
              <div className="flex justify-between text-stone-600">
                <span>المجموع الفرعي:</span>
                <span>{selectedOrder.subtotal} {settings.currency}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>الخصم:</span>
                  <span>-{selectedOrder.discount_amount} {settings.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>رسوم التوصيل:</span>
                <span>{selectedOrder.delivery_fee} {settings.currency}</span>
              </div>
              <div className="flex justify-between font-black text-stone-900 text-sm pt-2 border-t border-rose-200">
                <span>الإجمالي:</span>
                <span className="text-rose-600">{selectedOrder.total_amount} {settings.currency}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <a
                href={generateOrderStatusWhatsAppUrl(selectedOrder, settings)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال تحديث للعميل بالواتساب</span>
              </a>
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-3 rounded-2xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
