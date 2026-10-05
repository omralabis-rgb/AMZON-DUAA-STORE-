import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StoreFront } from './components/StoreFront';
import { ProductDetailsPage } from './components/ProductDetailsPage';
import { CheckoutPage } from './components/CheckoutPage';
import { CartDrawer } from './components/CartDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { AdminProductForm } from './components/AdminProductForm';
import { AdminProductList } from './components/AdminProductList';
import { AdminSettings } from './components/AdminSettings';
import { AdminOrders } from './components/AdminOrders';
import { AdminLogin } from './components/AdminLogin';
import { SupabaseCodeModal } from './components/SupabaseCodeModal';
import { AdminCopilotModal } from './components/AdminCopilotModal';
import { Product, StoreSettings, CartItem, Order, OrderStatus, AdminUser } from './types';
import { INITIAL_CATEGORIES } from './data/initialData';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredCart,
  saveStoredCart,
  getAdminSession,
  clearAdminSession,
  resetToDefaults,
} from './lib/storage';
import {
  fetchProductsCloud,
  saveProductCloud,
  deleteProductCloud,
  fetchOrdersCloud,
  createOrderCloud,
  updateOrderStatusCloud,
} from './lib/cloud';
import { Sparkles, MessageCircle, Heart, ShieldCheck, CheckCircle2, Bot } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(getStoredSettings);
  const [cart, setCart] = useState<CartItem[]>(getStoredCart);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(getAdminSession);

  const [activeTab, setActiveTab] = useState<'store' | 'product-detail' | 'checkout' | 'orders' | 'admin'>('store');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Navbar Global Search
  const handleNavbarSearch = (q: string) => {
    setSearchQuery(q);
    setActiveTab('store');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Initial load from cloud/local
  useEffect(() => {
    async function loadData() {
      const pResult = await fetchProductsCloud();
      setProducts(pResult.products);

      const oResult = await fetchOrdersCloud();
      setOrders(oResult.orders);
    }
    loadData();
  }, []);

  // Sync settings and cart
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredCart(cart);
  }, [cart]);

  // Open Full Product Details Page
  const handleOpenProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`تمت إضافة "${product.title_ar}" (${quantity}) إلى السلة`);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('تمت إزالة المنتج من السلة', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('تم إفراغ السلة بالكامل', 'info');
  };

  // When order is placed from CartDrawer or CheckoutPage
  const handleOrderPlaced = async (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    await createOrderCloud(newOrder);
    setCart([]);
    showToast(`تم تسجيل وتأكيد طلبكِ بنجاح #${newOrder.order_number}`);
  };

  // Product Admin Handlers
  const handleProductCreated = async (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    await saveProductCloud(newProduct);
    showToast(`تم نشر منتج "${newProduct.title_ar}" بنجاح في المتجر!`);
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    await deleteProductCloud(productId);
    showToast('تم حذف المنتج بنجاح', 'info');
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updated = { ...p, stock_quantity: newStock };
          saveProductCloud(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const handleToggleFeatured = async (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updated = { ...p, featured: !p.featured };
          saveProductCloud(updated);
          return updated;
        }
        return p;
      })
    );
    showToast('تم تحديث حالة تمييز المنتج', 'info');
  };

  // Order Admin Handlers
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    await updateOrderStatusCloud(orderId, status);
    showToast('تم تحديث حالة الطلب بنجاح');
  };

  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    showToast('تم حفظ إعدادات المتجر ورقم الواتساب بنجاح');
  };

  const handleResetData = () => {
    resetToDefaults();
    window.location.reload();
  };

  const handleLogoutAdmin = () => {
    clearAdminSession();
    setAdminUser(null);
    setActiveTab('store');
    showToast('تم تسجيل الخروج بنجاح', 'info');
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => {
    const price = item.product.discount_price ?? item.product.original_price;
    return sum + price * item.quantity;
  }, 0);

  const cartProductIds = new Set(cart.map((i) => i.product.id));

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between selection:bg-rose-100 selection:text-rose-900 font-['Cairo',sans-serif]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold border border-stone-800 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Navbar with Smart Search */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={totalCartCount}
        cartTotal={totalCartPrice}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
        onOpenDocs={() => setIsDocsOpen(true)}
        ordersCount={orders.length}
        adminUser={adminUser}
        onLogoutAdmin={handleLogoutAdmin}
        products={products}
        onSelectProduct={handleOpenProductDetails}
        onAddToCart={handleAddToCart}
        onSearchSubmit={handleNavbarSearch}
      />

      {/* Main Views Container */}
      <main className="flex-1">
        {/* Storefront View */}
        {activeTab === 'store' && (
          <StoreFront
            products={products}
            categories={INITIAL_CATEGORIES}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenDetails={handleOpenProductDetails}
            cartProductIds={cartProductIds}
            settings={settings}
            onOpenAdmin={() => setActiveTab('admin')}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        )}

        {/* Dedicated Product Details Page */}
        {activeTab === 'product-detail' && selectedProduct && (
          <ProductDetailsPage
            product={selectedProduct}
            allProducts={products}
            onBackToStore={() => {
              setActiveTab('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddToCart={handleAddToCart}
            onOpenCheckout={() => {
              setActiveTab('checkout');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectProduct={handleOpenProductDetails}
            settings={settings}
          />
        )}

        {/* Dedicated Full Checkout Page */}
        {activeTab === 'checkout' && (
          <CheckoutPage
            cartItems={cart}
            settings={settings}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onOrderPlaced={handleOrderPlaced}
            onBackToStore={() => {
              setActiveTab('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Orders View */}
        {activeTab === 'orders' &&
          (adminUser ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
              <AdminOrders
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                settings={settings}
              />
            </div>
          ) : (
            <AdminLogin
              settings={settings}
              onLoginSuccess={(user) => setAdminUser(user)}
              onBackToStore={() => setActiveTab('store')}
            />
          ))}

        {/* Admin Products View */}
        {activeTab === 'admin' &&
          (adminUser ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
              {/* Admin Header Notice */}
              <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-rose-300 font-bold text-xs uppercase tracking-wider block mb-1">
                    لوحة إدارة متجر التجميل بالذكاء الاصطناعي
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black">
                    تحليل المنتجات بالذكاء الاصطناعي وإدارة المخزون
                  </h1>
                  <p className="text-xs text-stone-300 mt-1">
                    مرحباً بك {adminUser.displayName}، المنتجات والطلبات متزامنة فورياً.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsCopilotOpen(true)}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Bot className="w-4 h-4 text-rose-400" />
                    <span>المساعد الذكي (AI Copilot)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 transition-colors cursor-pointer"
                  >
                    عرض الطلبات ({orders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('store')}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    معاينة المتجر للعملاء
                  </button>
                </div>
              </div>

              {/* AI Product Upload & Vision Form */}
              <AdminProductForm
                categories={INITIAL_CATEGORIES}
                onProductCreated={handleProductCreated}
                settings={settings}
              />

              {/* Product Management Table */}
              <AdminProductList
                products={products}
                categories={INITIAL_CATEGORIES}
                onDeleteProduct={handleDeleteProduct}
                onUpdateStock={handleUpdateStock}
                onToggleFeatured={handleToggleFeatured}
                settings={settings}
              />

              {/* Store & WhatsApp Settings */}
              <AdminSettings
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onResetData={handleResetData}
              />
            </div>
          ) : (
            <AdminLogin
              settings={settings}
              onLoginSuccess={(user) => setAdminUser(user)}
              onBackToStore={() => setActiveTab('store')}
            />
          ))}
      </main>

      {/* Cart Drawer Slide-Over */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        settings={settings}
        onOrderPlaced={handleOrderPlaced}
        onOpenFullCheckout={() => {
          setIsCartOpen(false);
          setActiveTab('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        settings={settings}
      />

      {/* Supabase & Bolt Code Modal */}
      <SupabaseCodeModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />

      {/* AI Admin Copilot Modal */}
      <AdminCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        products={products}
        orders={orders}
        settings={settings}
      />

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300 text-xs py-12 border-t border-stone-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-stone-800">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-black text-white text-lg">
                <Sparkles className="w-5 h-5 text-rose-500" />
                <span>{settings.storeName}</span>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">
                متجر إلكتروني فاخر لمنتجات التجميل والعناية الشخصية والعطور الأصلية 100%. نظام طلب مباشر فوري عبر واتساب مدعوم بالذكاء الاصطناعي.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">أقسام المتجر</h4>
              <ul className="space-y-2 text-stone-400 text-xs">
                {INITIAL_CATEGORIES.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setActiveTab('store');
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="hover:text-rose-400 transition-colors"
                    >
                      {c.name_ar}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">طرق الطلب والدفع</h4>
              <p className="text-stone-400 text-xs leading-relaxed mb-3">
                يتم حفظ كافة الطلبات آلياً وإرسال تفاصيل الطلب عبر واتساب مع خدمة عملاء لتأكيد الشحن والتوصيل.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <MessageCircle className="w-4 h-4" />
                <span>واتساب المتجر: {settings.whatsappNumber}</span>
              </div>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">تطوير وتكامل</h4>
              <p className="text-stone-400 text-xs leading-relaxed mb-3">
                مشروع مهيأ بالكامل للإنتاج مع Supabase و Next.js و Tailwind CSS و Gemini 3.8 Flash.
              </p>
              <button
                onClick={() => setIsDocsOpen(true)}
                className="bg-stone-800 hover:bg-stone-700 text-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-700 transition-colors"
              >
                عرض كود Supabase و Edge Function
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
            <p>© {new Date().getFullYear()} {settings.storeName}. جميع الحقوق محفوظة.</p>
            <p className="flex items-center gap-1">
              صُنع بعناية فائقة لتقديم تجربة تسوق راقية
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
