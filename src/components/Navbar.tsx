import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ShoppingBag, SlidersHorizontal, Store, Code, Code2, ShieldCheck, Package, Cloud, Lock, LogOut, CreditCard, Search, X, Heart, Truck, User as UserIcon, LogIn, ChevronDown, Flame } from 'lucide-react';
import { StoreSettings, AdminUser, Product, UserProfile } from '../types';
import { env } from '../lib/env';
import { SmartSearchBar } from './SmartSearchBar';

interface NavbarProps {
  activeTab: 'store' | 'admin' | 'orders' | 'checkout' | 'product-detail' | 'dev-advisor' | 'track-order';
  setActiveTab: (tab: 'store' | 'admin' | 'orders' | 'checkout' | 'product-detail' | 'dev-advisor' | 'track-order') => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  settings: StoreSettings;
  onOpenDocs: () => void;
  ordersCount: number;
  adminUser: AdminUser | null;
  onLogoutAdmin: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onSearchSubmit: (query: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
  onLogoutUser?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  cartTotal,
  onOpenCart,
  wishlistCount,
  onOpenWishlist,
  settings,
  onOpenDocs,
  ordersCount,
  adminUser,
  onLogoutAdmin,
  products,
  onSelectProduct,
  onAddToCart,
  onSearchSubmit,
  currentUser,
  onOpenAuthModal,
  onLogoutUser,
}) => {
  const isCloud = env.isSupabaseConfigured();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-xs">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-rose-100 text-xs py-2 px-4 text-center flex items-center justify-between font-medium">
        <div className="hidden sm:flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-[10px]">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>سحابة Firebase متصلة (Auth & Firestore)</span>
          </span>
          {isCloud && (
            <span className="flex items-center gap-1 text-emerald-300 bg-stone-800/60 px-2 py-0.5 rounded-full text-[10px]">
              <Cloud className="w-3 h-3" />
              Supabase
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Sparkles className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
          <span>شحن مجاني لكافة الطلبات فوق {settings.freeDeliveryThreshold} {settings.currency}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-rose-300 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>مستحضرات أصلية 100% | واتساب: {settings.whatsappNumber}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          
          {/* Logo & Store Name */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('store')}
              className="flex items-center gap-2 sm:gap-3 text-right group transition-transform focus:outline-hidden"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-all shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="hidden xs:block sm:block">
                <div className="font-extrabold text-base sm:text-xl text-stone-900 tracking-tight flex items-center gap-1.5">
                  <span>{settings.storeName}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full border border-rose-200">
                    Atelier
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-1">{settings.tagline}</p>
              </div>
            </button>
          </div>

          {/* Desktop Smart Search Bar (Centered & Prominent) */}
          <div className="hidden md:block flex-1 max-w-xl mx-2">
            <SmartSearchBar
              products={products}
              onSelectProduct={onSelectProduct}
              onAddToCart={onAddToCart}
              onViewAllResults={onSearchSubmit}
              settings={settings}
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 bg-stone-100 rounded-xl"
              title="بحث"
            >
              {isMobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* View Switcher Pills */}
            <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('store')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all ${
                  activeTab === 'store' || activeTab === 'product-detail'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">المتجر</span>
              </button>

              <button
                onClick={() => setActiveTab('track-order')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all ${
                  activeTab === 'track-order'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="تتبع مسار وحالة طلباتك بدون تسجيل دخول"
              >
                <Truck className={`w-3.5 h-3.5 ${activeTab === 'track-order' ? 'text-white' : 'text-rose-600'}`} />
                <span className="hidden sm:inline">تتبع طلبك</span>
              </button>

              {cartCount > 0 && (
                <button
                  onClick={() => setActiveTab('checkout')}
                  className={`hidden sm:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all ${
                    activeTab === 'checkout'
                      ? 'bg-rose-600 text-white shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>الدفع</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all relative ${
                  activeTab === 'orders'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الطلبات</span>
                {ordersCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'orders' ? 'bg-white text-rose-600' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {ordersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all ${
                  activeTab === 'admin'
                    ? 'bg-stone-900 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">لوحة التحكم</span>
              </button>

              {adminUser && (
                <button
                  onClick={() => setActiveTab('dev-advisor')}
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all ${
                    activeTab === 'dev-advisor'
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                  title="المستشار البرمجي وتطوير المنصة"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold hidden md:inline">المستشار البرمجي</span>
                </button>
              )}
            </div>

            {/* Admin Logout button if logged in */}
            {adminUser && (
              <button
                onClick={onLogoutAdmin}
                title="تسجيل خروج الإدارة"
                className="hidden xl:flex items-center gap-1 p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 transition-colors text-xs font-medium"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Supabase Code & Export */}
            <button
              onClick={onOpenDocs}
              title="كود Supabase و Edge Function جاهز للنسخ"
              className="hidden 2xl:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors border border-stone-200"
            >
              <Code className="w-3.5 h-3.5 text-rose-600" />
              <span>أكواد النشر</span>
            </button>

            {/* Wishlist Trigger Button */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 sm:px-3 sm:py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl border border-rose-200/80 shadow-2xs transition-all hover:shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="المفضلة وقائمة الأمنيات"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden lg:inline text-xs font-bold">المفضلة</span>
              {wishlistCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.2 rounded-full border-2 border-white animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* User Account / Auth Trigger */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl border border-stone-200/80 transition-all cursor-pointer"
                  title="حسابي"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      (currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden xl:inline text-xs font-bold max-w-[90px] truncate">
                    {currentUser.name || 'حسابي'}
                  </span>
                  {currentUser.role === 'admin' && (
                    <span className="hidden sm:inline bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0.2 rounded font-black">
                      مشرف
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 text-right animate-in fade-in zoom-in-95">
                    <div className="p-2 border-b border-stone-100 mb-1">
                      <p className="text-xs font-extrabold text-stone-900 truncate">
                        {currentUser.name || 'عميل أمازون دعاء'}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate" dir="ltr">
                        {currentUser.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('orders');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-stone-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-stone-400" />
                      <span>طلباتي السابقة</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenWishlist();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-stone-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>قائمة المفضلة</span>
                    </button>

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-stone-500" />
                        <span>لوحة تحكم الإدارة</span>
                      </button>
                    )}

                    <div className="border-t border-stone-100 my-1"></div>

                    <button
                      onClick={() => {
                        if (onLogoutUser) onLogoutUser();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl border border-rose-200 shadow-2xs transition-all hover:shadow-xs active:scale-95 cursor-pointer text-xs font-bold"
                title="تسجيل الدخول / إنشاء حساب"
              >
                <UserIcon className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">تسجيل الدخول</span>
              </button>
            )}

            {/* Cart Trigger Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 sm:gap-2 bg-stone-900 hover:bg-stone-800 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm transition-all hover:shadow-md active:scale-95 cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] sm:text-[11px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-stone-900 animate-bounce">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold">السلة</span>
              {cartCount > 0 && (
                <span className="text-[11px] sm:text-xs font-semibold text-rose-200 border-r border-stone-700 pr-2 mr-0.5">
                  {cartTotal} {settings.currency}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown Row */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-stone-100 animate-in fade-in slide-in-from-top-2">
            <SmartSearchBar
              products={products}
              onSelectProduct={(p) => {
                onSelectProduct(p);
                setIsMobileSearchOpen(false);
              }}
              onAddToCart={onAddToCart}
              onViewAllResults={(q) => {
                onSearchSubmit(q);
                setIsMobileSearchOpen(false);
              }}
              settings={settings}
            />
          </div>
        )}
      </div>
    </header>
  );
};
