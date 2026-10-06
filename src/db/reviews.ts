import { db } from './index.ts';
import { reviews } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { ProductReview } from '../types.ts';

export async function getReviewsForProduct(productId: string) {
  try {
    const records = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
    return records;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function createReviewInDb(productId: string, review: Omit<ProductReview, 'id'>) {
  try {
    const result = await db
      .insert(reviews)
      .values({
        productId,
        author: review.author,
        rating: Math.round(review.rating),
        comment: review.comment,
        verifiedPurchase: review.verifiedPurchase ?? true,
        title: review.title || null,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to create review:', error);
    throw new Error('Database operation failed. Please try again later.', { cause: error });
  }
}
