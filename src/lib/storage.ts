import { Product, StoreSettings, CartItem, Order, AdminUser } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialData';

const PRODUCTS_KEY = 'elen_beauty_products_v1';
const SETTINGS_KEY = 'elen_beauty_settings_v1';
const CART_KEY = 'elen_beauty_cart_v1';
const WISHLIST_KEY = 'amazon_duaa_wishlist_v1';
const ORDERS_KEY = 'elen_beauty_orders_v1';

export function getStoredWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading wishlist from storage:', e);
    return [];
  }
}

export function saveStoredWishlist(wishlistIds: string[]): void {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistIds));
  } catch (e) {
    console.error('Error saving wishlist to storage:', e);
  }
}
const ADMIN_SESSION_KEY = 'elen_beauty_admin_session_v1';

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return INITIAL_PRODUCTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch (e) {
    console.error('Error loading products from storage:', e);
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to storage:', e);
  }
}

export function getStoredSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...INITIAL_SETTINGS, adminPassword: 'admin' };
    const parsed = JSON.parse(raw);
    if (parsed.whatsappNumber === '966500000000' || parsed.storeName?.includes('إيلين')) {
      parsed.whatsappNumber = INITIAL_SETTINGS.whatsappNumber;
      parsed.storeName = INITIAL_SETTINGS.storeName;
      parsed.tagline = INITIAL_SETTINGS.tagline;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...INITIAL_SETTINGS, ...parsed }));
    }
    return { ...INITIAL_SETTINGS, adminPassword: 'admin', ...parsed };
  } catch (e) {
    console.error('Error loading settings from storage:', e);
    return { ...INITIAL_SETTINGS, adminPassword: 'admin' };
  }
}

export function saveStoredSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to storage:', e);
  }
}

export function getStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading cart from storage:', e);
    return [];
  }
}

export function saveStoredCart(cart: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error('Error saving cart to storage:', e);
  }
}

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading orders from storage:', e);
    return [];
  }
}

export function saveStoredOrders(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders to storage:', e);
  }
}

export function getAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setAdminSession(user: AdminUser): void {
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Error setting admin session:', e);
  }
}

export function clearAdminSession(): void {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (e) {
    console.error('Error clearing admin session:', e);
  }
}

export function resetToDefaults(): void {
  try {
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(ORDERS_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (e) {
    console.error('Error resetting storage:', e);
  }
}
