import { getSupabase } from './supabase';
import { Product, Order, OrderStatus } from '../types';
import { getStoredProducts, saveStoredProducts, getStoredOrders, saveStoredOrders } from './storage';

export async function fetchProductsCloud(): Promise<{ products: Product[]; isCloud: boolean }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { products: getStoredProducts(), isCloud: false };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return { products: getStoredProducts(), isCloud: false };
    }

    const mapped: Product[] = data.map((item) => ({
      id: item.id,
      title_ar: item.title_ar,
      description_ar: item.description_ar,
      original_price: Number(item.original_price),
      discount_price: item.discount_price ? Number(item.discount_price) : null,
      stock_quantity: item.stock_quantity,
      category_id: item.category_id || 'skincare',
      category_name: item.category_name || 'عناية بالبشرة',
      tags: item.tags || [],
      image_url: item.image_url,
      ai_generated: Boolean(item.ai_generated),
      rating: item.rating ? Number(item.rating) : 5.0,
      reviews_count: item.reviews_count || 1,
      how_to_use: item.how_to_use,
      ingredients: item.ingredients,
      created_at: item.created_at,
      featured: Boolean(item.featured),
    }));

    // Cache locally
    saveStoredProducts(mapped);
    return { products: mapped, isCloud: true };
  } catch (e) {
    console.warn('Error fetching products from cloud, falling back to local:', e);
    return { products: getStoredProducts(), isCloud: false };
  }
}

export async function searchProductsFuzzyCloud(
  searchQuery: string
): Promise<{ products: Product[]; isCloud: boolean }> {
  const supabase = getSupabase();
  if (!supabase || !searchQuery.trim()) {
    return { products: [], isCloud: false };
  }

  try {
    const { data, error } = await supabase.rpc('search_products_fuzzy', {
      search_query: searchQuery.trim(),
      similarity_threshold: 0.1,
      max_results: 20,
    });

    if (error || !data || data.length === 0) {
      return { products: [], isCloud: false };
    }

    const mapped: Product[] = data.map((item: any) => ({
      id: item.id,
      title_ar: item.title_ar,
      description_ar: item.description_ar,
      original_price: Number(item.original_price),
      discount_price: item.discount_price ? Number(item.discount_price) : null,
      stock_quantity: item.stock_quantity,
      category_id: item.category_id || 'skincare',
      category_name: item.category_name || 'عناية بالبشرة',
      tags: item.tags || [],
      image_url: item.image_url,
      ai_generated: Boolean(item.ai_generated),
      rating: item.rating ? Number(item.rating) : 5.0,
      reviews_count: item.reviews_count || 1,
      how_to_use: item.how_to_use,
      ingredients: item.ingredients,
      created_at: item.created_at,
      featured: Boolean(item.featured),
    }));

    return { products: mapped, isCloud: true };
  } catch (e) {
    console.warn('Error in cloud fuzzy search:', e);
    return { products: [], isCloud: false };
  }
}

export async function saveProductCloud(product: Product): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('products').upsert({
        id: product.id,
        title_ar: product.title_ar,
        description_ar: product.description_ar,
        original_price: product.original_price,
        discount_price: product.discount_price,
        stock_quantity: product.stock_quantity,
        category_id: product.category_id,
        category_name: product.category_name,
        tags: product.tags,
        image_url: product.image_url,
        ai_generated: product.ai_generated,
        rating: product.rating,
        reviews_count: product.reviews_count,
        how_to_use: product.how_to_use,
        ingredients: product.ingredients,
        featured: product.featured,
      });
    } catch (e) {
      console.warn('Failed to upsert to cloud, saved locally:', e);
    }
  }
}

export async function deleteProductCloud(productId: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('products').delete().eq('id', productId);
    } catch (e) {
      console.warn('Failed to delete from cloud:', e);
    }
  }
}

export async function createOrderCloud(order: Order): Promise<void> {
  // Always save locally first for instant reliability
  const currentOrders = getStoredOrders();
  saveStoredOrders([order, ...currentOrders]);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('orders').insert({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        city: order.city,
        address: order.address,
        notes: order.notes,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        delivery_fee: order.delivery_fee,
        total_amount: order.total_amount,
        status: order.status,
        items: order.items,
        whatsapp_sent: order.whatsapp_sent,
      });
    } catch (e) {
      console.warn('Could not sync order to Supabase:', e);
    }
  }
}

export async function fetchOrdersCloud(): Promise<{ orders: Order[]; isCloud: boolean }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { orders: getStoredOrders(), isCloud: false };
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return { orders: getStoredOrders(), isCloud: false };
    }

    const mapped: Order[] = data.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      city: o.city,
      address: o.address,
      notes: o.notes,
      items: o.items || [],
      subtotal: Number(o.subtotal),
      discount_amount: Number(o.discount_amount),
      delivery_fee: Number(o.delivery_fee),
      total_amount: Number(o.total_amount),
      status: o.status as OrderStatus,
      whatsapp_sent: Boolean(o.whatsapp_sent),
      created_at: o.created_at,
      updated_at: o.updated_at,
    }));

    saveStoredOrders(mapped);
    return { orders: mapped, isCloud: true };
  } catch (e) {
    console.warn('Error fetching orders from cloud:', e);
    return { orders: getStoredOrders(), isCloud: false };
  }
}

export async function updateOrderStatusCloud(orderId: string, status: OrderStatus): Promise<void> {
  const orders = getStoredOrders();
  const updated = orders.map((o) => (o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o));
  saveStoredOrders(updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
    } catch (e) {
      console.warn('Failed to update order status in cloud:', e);
    }
  }
}

export async function trackOrdersCloud(
  orderNumber: string,
  phone: string
): Promise<{ orders: Order[]; isCloud: boolean }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { orders: [], isCloud: false };
  }

  try {
    let query = supabase.from('orders').select('*');

    const num = orderNumber.trim();
    const ph = phone.trim();

    if (num) {
      query = query.ilike('order_number', `%${num}%`);
    }
    if (ph) {
      query = query.ilike('customer_phone', `%${ph}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) {
      return { orders: [], isCloud: true };
    }

    const mapped: Order[] = data.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      city: o.city,
      address: o.address,
      notes: o.notes,
      items: o.items || [],
      subtotal: Number(o.subtotal),
      discount_amount: Number(o.discount_amount),
      delivery_fee: Number(o.delivery_fee),
      total_amount: Number(o.total_amount),
      status: o.status as OrderStatus,
      whatsapp_sent: Boolean(o.whatsapp_sent),
      created_at: o.created_at,
      updated_at: o.updated_at,
    }));

    return { orders: mapped, isCloud: true };
  } catch (e) {
    console.warn('Error tracking orders cloud:', e);
    return { orders: [], isCloud: false };
  }
}
