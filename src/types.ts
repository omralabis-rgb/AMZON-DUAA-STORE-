export interface Category {
  id: string;
  name_ar: string;
  slug: string;
  icon?: string;
  count?: number;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
  avatar?: string;
  title?: string;
  helpfulCount?: number;
  wouldRecommend?: boolean;
}

export interface Product {
  id: string;
  title_ar: string;
  description_ar: string;
  original_price: number;
  discount_price: number | null;
  stock_quantity: number;
  category_id: string;
  category_name: string;
  tags: string[];
  image_url: string;
  gallery_images?: string[];
  size_or_volume?: string;
  skin_type?: string;
  key_benefits?: string[];
  reviews_list?: ProductReview[];
  badge?: string;
  ai_generated: boolean;
  rating?: number;
  reviews_count?: number;
  how_to_use?: string;
  ingredients?: string;
  created_at: string;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  currency: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  welcomeMessage: string;
  adminPassword?: string;
}

export interface CustomerOrderInfo {
  customerName: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  paymentMethod?: 'cod' | 'bank_transfer' | 'mada';
  deliverySpeed?: 'standard' | 'express';
  deliveryTimePreference?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  product_id: string;
  title_ar: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  address: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  status: OrderStatus;
  whatsapp_sent: boolean;
  payment_method?: string;
  delivery_speed?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: 'superadmin' | 'manager' | 'editor';
}

export interface AIAnalysisResult {
  title_ar: string;
  description_ar: string;
  category_name: string;
  tags: string[];
  suggested_price?: number;
}
