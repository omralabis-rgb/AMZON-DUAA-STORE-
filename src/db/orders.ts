import { db } from './index.ts';
import { orders } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { Order, OrderStatus } from '../types.ts';

export async function getAllOrders() {
  try {
    const records = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return records;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getOrderByNumber(orderNumber: string) {
  try {
    const records = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    return records[0] || null;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function createOrderInDb(order: Order) {
  try {
    const result = await db
      .insert(orders)
      .values({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        city: order.city,
        address: order.address,
        notes: order.notes || null,
        items: order.items,
        subtotal: order.subtotal,
        discountAmount: order.discount_amount || 0,
        deliveryFee: order.delivery_fee || 0,
        totalAmount: order.total_amount,
        status: order.status || 'pending',
        paymentMethod: order.payment_method || null,
        deliverySpeed: order.delivery_speed || null,
        whatsappSent: order.whatsapp_sent || false,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to create order:', error);
    throw new Error('Database operation failed. Please try again later.', { cause: error });
  }
}

export async function updateOrderStatusInDb(orderNumber: string, status: OrderStatus) {
  try {
    const result = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.orderNumber, orderNumber))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw new Error('Database operation failed. Please try again later.', { cause: error });
  }
}
