import { db } from './index.ts';
import { products, reviews } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { Product } from '../types.ts';

export async function getAllProducts() {
  try {
    const records = await db.select().from(products).orderBy(desc(products.createdAt));
    return records;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getProductById(productId: string) {
  try {
    const records = await db.select().from(products).where(eq(products.productId, productId)).limit(1);
    return records[0] || null;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertProduct(product: Partial<Product> & { id: string; title_ar: string; category_id: string; category_name: string; original_price: number; image_url: string }) {
  try {
    const result = await db
      .insert(products)
      .values({
        productId: product.id,
        titleAr: product.title_ar,
        descriptionAr: product.description_ar || '',
        originalPrice: product.original_price,
        discountPrice: product.discount_price ?? null,
        stockQuantity: product.stock_quantity ?? 10,
        categoryId: product.category_id,
        categoryName: product.category_name,
        imageUrl: product.image_url,
        galleryImages: product.gallery_images || [],
        tags: product.tags || [],
        rating: product.rating ?? 5.0,
        reviewsCount: product.reviews_count ?? 0,
        aiGenerated: product.ai_generated ?? false,
        featured: product.featured ?? false,
        sizeOrVolume: product.size_or_volume || null,
        skinType: product.skin_type || null,
        keyBenefits: product.key_benefits || [],
        howToUse: product.how_to_use || null,
        ingredients: product.ingredients || null,
        badge: product.badge || null,
      })
      .onConflictDoUpdate({
        target: products.productId,
        set: {
          titleAr: product.title_ar,
          descriptionAr: product.description_ar || '',
          originalPrice: product.original_price,
          discountPrice: product.discount_price ?? null,
          stockQuantity: product.stock_quantity ?? 10,
          categoryId: product.category_id,
          categoryName: product.category_name,
          imageUrl: product.image_url,
          galleryImages: product.gallery_images || [],
          tags: product.tags || [],
          rating: product.rating ?? 5.0,
          reviewsCount: product.reviews_count ?? 0,
          aiGenerated: product.ai_generated ?? false,
          featured: product.featured ?? false,
          sizeOrVolume: product.size_or_volume || null,
          skinType: product.skin_type || null,
          keyBenefits: product.key_benefits || [],
          howToUse: product.how_to_use || null,
          ingredients: product.ingredients || null,
          badge: product.badge || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert product:', error);
    throw new Error('Database operation failed. Please try again later.', { cause: error });
  }
}
