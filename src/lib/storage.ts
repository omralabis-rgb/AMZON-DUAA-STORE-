import { Product, StoreSettings, CartItem, Order } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialData';
import { getSafeImageSrc } from './image';

const PRODUCTS_KEY = 'elen_beauty_products_v1';
const SETTINGS_KEY = 'elen_beauty_settings_v1';
const CART_KEY = 'elen_beauty_cart_v1';
const WISHLIST_KEY = 'amazon_duaa_wishlist_v1';
const ORDERS_KEY = 'elen_beauty_orders_v1';
const LEGACY_ADMIN_SESSION_KEY = 'elen_beauty_admin_session_v1';

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

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return INITIAL_PRODUCTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_PRODUCTS;
    return parsed.map((p: Product) => ({
      ...p,
      image_url: getSafeImageSrc(p?.image_url),
    }));
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
    if (!raw) return { ...INITIAL_SETTINGS };
    const parsed = JSON.parse(raw);
    const { adminPassword: _removedPassword, ...cleanParsed } = parsed || {};
    if (cleanParsed.whatsappNumber === '966500000000' || cleanParsed.storeName?.includes('إيلين')) {
      cleanParsed.whatsappNumber = INITIAL_SETTINGS.whatsappNumber;
      cleanParsed.storeName = INITIAL_SETTINGS.storeName;
      cleanParsed.tagline = INITIAL_SETTINGS.tagline;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...INITIAL_SETTINGS, ...cleanParsed }));
    } else if (_removedPassword !== undefined) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...INITIAL_SETTINGS, ...cleanParsed }));
    }
    return { ...INITIAL_SETTINGS, ...cleanParsed };
  } catch (e) {
    console.error('Error loading settings from storage:', e);
    return { ...INITIAL_SETTINGS };
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

export function purgeLegacyAdminStorage(): void {
  try {
    localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
  } catch (e) {
    console.error('Error clearing legacy admin session:', e);
  }
}

export function resetToDefaults(): void {
  try {
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(ORDERS_KEY);
    localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
  } catch (e) {
    console.error('Error resetting storage:', e);
  }
}
