import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, boolean, jsonb } from 'drizzle-orm/pg-core';

// Users table (identifying with Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('customer'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  icon: text('icon'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  productId: text('product_id').notNull().unique(),
  titleAr: text('title_ar').notNull(),
  descriptionAr: text('description_ar').notNull(),
  originalPrice: doublePrecision('original_price').notNull(),
  discountPrice: doublePrecision('discount_price'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  categoryId: text('category_id').notNull(),
  categoryName: text('category_name').notNull(),
  imageUrl: text('image_url').notNull(),
  galleryImages: jsonb('gallery_images').$type<string[]>(),
  tags: jsonb('tags').$type<string[]>(),
  rating: doublePrecision('rating').default(5.0),
  reviewsCount: integer('reviews_count').default(0),
  aiGenerated: boolean('ai_generated').default(false),
  featured: boolean('featured').default(false),
  sizeOrVolume: text('size_or_volume'),
  skinType: text('skin_type'),
  keyBenefits: jsonb('key_benefits').$type<string[]>(),
  howToUse: text('how_to_use'),
  ingredients: text('ingredients'),
  badge: text('badge'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  notes: text('notes'),
  items: jsonb('items').notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
  discountAmount: doublePrecision('discount_amount').default(0),
  deliveryFee: doublePrecision('delivery_fee').default(0),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: text('status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  deliverySpeed: text('delivery_speed'),
  whatsappSent: boolean('whatsapp_sent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Reviews table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productId: text('product_id').notNull(),
  author: text('author').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  verifiedPurchase: boolean('verified_purchase').default(true),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.productId],
  }),
}));
