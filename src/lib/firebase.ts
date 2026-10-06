import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, CartItem, Order, OrderStatus, UserProfile } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialData';
import { getStoredProducts, saveStoredProducts, getStoredOrders, saveStoredOrders } from './storage';

// =========================================================================
// 1. FIREBASE SINGLETON INITIALIZATION WITH EXACT PROJECT CONFIGURATION
// =========================================================================

// Ensure single instance across the entire application runtime
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth Instance
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Firestore Instance with exact Database ID from firebase-applet-config.json
export const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId || '(default)';
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection verification test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Firestore client connection probe:', error.message);
    }
    return false;
  }
}
testConnection();

// =========================================================================
// 2. ERROR TRANSLATION (ARABIC USER-FRIENDLY MESSAGES)
// =========================================================================

export function getFriendlyFirebaseErrorMessage(err: any): string {
  if (!err) return 'حدث خطأ غير متوقع، يرجى المحاولة ثانية.';
  const code = err.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة، يرجى التحقق والمحاولة مجدداً.';
    case 'auth/user-not-found':
      return 'لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني. يمكنك إنشاء حساب جديد الآن.';
    case 'auth/email-already-in-use':
      return 'هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول أو استعادة كلمة المرور.';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور تحتوي على 6 خانات على الأقل.';
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة. يرجى إدخال بريد صالح مثل name@example.com.';
    case 'auth/operation-not-allowed':
      return 'طريقة تسجيل الدخول هذه غير مفعلة حالياً في إعدادات المشروع.';
    case 'auth/network-request-failed':
      return 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت والمحاولة ثانية.';
    case 'auth/too-many-requests':
      return 'تمت محاولة تسجيل الدخول عدة مرات بشكل خاطئ. تم إيقاف الحساب مؤقتاً لحمايتك، يرجى المحاولة بعد قليل.';
    case 'auth/user-disabled':
      return 'تم تعطيل هذا الحساب من قِبل إدارة النظام.';
    case 'permission-denied':
      return 'ليس لديك الصلاحيات الكافية لتنفيذ هذه العملية.';
    case 'unavailable':
      return 'الخدمة غير متوفرة حالياً، يرجى المحاولة بعد لحظات.';
    default:
      if (err.message && typeof err.message === 'string') {
        if (err.message.includes('offline')) {
          return 'أنت في وضع عدم الاتصال بالإنترنت، تعذر إتمام العملية.';
        }
      }
      return err.message || 'حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة لاحقاً.';
  }
}

// =========================================================================
// 3. FIREBASE AUTHENTICATION SERVICES
// =========================================================================

export async function registerWithEmail(
  name: string,
  email: string,
  pass: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name.trim()) {
    try {
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch (e) {
      console.warn('Failed to update displayName on auth user:', e);
    }
  }
  const profile = await syncUserProfile(cred.user, name.trim());
  return { user: cred.user, profile };
}

export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const profile = await syncUserProfile(cred.user);
  return { user: cred.user, profile };
}

export async function loginWithGooglePopup(): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const cred = await signInWithPopup(auth, googleAuthProvider);
  const profile = await syncUserProfile(cred.user);
  return { user: cred.user, profile };
}

export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export async function syncUserProfile(
  firebaseUser: FirebaseUser,
  customName?: string
): Promise<UserProfile> {
  const isAdminEmail = firebaseUser.email?.toLowerCase() === 'omralabis@gmail.com';
  const role: 'admin' | 'user' = isAdminEmail ? 'admin' : 'user';

  const userRef = doc(db, 'users', firebaseUser.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: firebaseUser.uid,
        name: data.name || customName || firebaseUser.displayName || 'مستخدم أمازون دعاء',
        email: data.email || firebaseUser.email || '',
        photoURL: data.photoURL || firebaseUser.photoURL || undefined,
        role: data.role || role,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }
  } catch (err) {
    console.warn('Could not read user profile from Firestore:', err);
  }

  // Create clean user document matching Firestore Schema without password
  const newProfile: UserProfile = {
    uid: firebaseUser.uid,
    name: customName || firebaseUser.displayName || 'مستخدم أمازون دعاء',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || undefined,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, newProfile);
    if (role === 'admin') {
      await setDoc(doc(db, 'admins', firebaseUser.uid), {
        email: firebaseUser.email,
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Could not persist new user profile in Firestore:', err);
  }

  return newProfile;
}

export function subscribeToAuthState(
  callback: (user: FirebaseUser | null, profile: UserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null, null);
      return;
    }
    try {
      const profile = await syncUserProfile(firebaseUser);
      callback(firebaseUser, profile);
    } catch {
      callback(firebaseUser, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'مستخدم أمازون دعاء',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || undefined,
        role: firebaseUser.email === 'omralabis@gmail.com' ? 'admin' : 'user',
      });
    }
  });
}

// =========================================================================
// 4. CLOUD FIRESTORE CART SERVICES & REAL-TIME SYNC
// =========================================================================

/**
 * Real-time listener for user cart across devices using onSnapshot.
 * Any add/remove/quantity change from another tab or device is broadcasted immediately.
 */
export function subscribeToCartFirestore(
  userId: string,
  allProducts: Product[],
  onUpdate: (items: CartItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    return () => {};
  }

  const cartCol = collection(db, 'users', userId, 'cart');
  return onSnapshot(
    cartCol,
    (snapshot) => {
      const items: CartItem[] = [];
      snapshot.forEach((docItem) => {
        const d = docItem.data();
        const product = allProducts.find((p) => p.id === d.productId) || {
          id: d.productId,
          title_ar: d.title_ar || 'منتج',
          description_ar: '',
          original_price: Number(d.price || 0),
          discount_price: null,
          stock_quantity: 10,
          category_id: 'skincare',
          category_name: 'عناية',
          tags: [],
          image_url: d.image_url || '',
          ai_generated: false,
          created_at: new Date().toISOString(),
        };

        items.push({
          product,
          quantity: Number(d.quantity || 1),
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.warn('[Firebase] Real-time cart onSnapshot error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Fetch one-time cart snapshot from Firestore
 */
export async function fetchCartFirestore(userId: string, allProducts: Product[]): Promise<CartItem[]> {
  if (!userId) return [];
  try {
    const cartCol = collection(db, 'users', userId, 'cart');
    const snap = await getDocs(cartCol);
    if (snap.empty) return [];

    const cartItems: CartItem[] = [];
    snap.forEach((docItem) => {
      const d = docItem.data();
      const product = allProducts.find((p) => p.id === d.productId) || {
        id: d.productId,
        title_ar: d.title_ar || 'منتج',
        description_ar: '',
        original_price: Number(d.price || 0),
        discount_price: null,
        stock_quantity: 10,
        category_id: 'skincare',
        category_name: 'عناية',
        tags: [],
        image_url: d.image_url || '',
        ai_generated: false,
        created_at: new Date().toISOString(),
      };

      cartItems.push({
        product,
        quantity: Number(d.quantity || 1),
      });
    });
    return cartItems;
  } catch (err) {
    console.warn('Failed to load cart from Firestore:', err);
    return [];
  }
}

/**
 * Save single cart item with updated quantity in Firestore
 */
export async function saveCartItemFirestore(userId: string, item: CartItem): Promise<void> {
  if (!userId || !item.product?.id) return;
  try {
    const docRef = doc(db, 'users', userId, 'cart', item.product.id);
    await setDoc(docRef, {
      productId: item.product.id,
      quantity: item.quantity,
      title_ar: item.product.title_ar,
      price: item.product.discount_price ?? item.product.original_price,
      image_url: item.product.image_url,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to save cart item in Firestore:', err);
  }
}

/**
 * Remove single item from user cart in Firestore
 */
export async function removeCartItemFirestore(userId: string, productId: string): Promise<void> {
  if (!userId || !productId) return;
  try {
    await deleteDoc(doc(db, 'users', userId, 'cart', productId));
  } catch (err) {
    console.warn('Failed to remove cart item from Firestore:', err);
  }
}

/**
 * Clear all cart items in Firestore
 */
export async function clearCartFirestore(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const cartCol = collection(db, 'users', userId, 'cart');
    const snap = await getDocs(cartCol);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Failed to clear cart in Firestore:', err);
  }
}

/**
 * Safe merge policy on login: Combines guest items with Firestore items without loss or duplication.
 */
export async function mergeCartOnLogin(
  userId: string,
  guestCart: CartItem[],
  allProducts: Product[]
): Promise<CartItem[]> {
  if (!userId) return guestCart;
  try {
    const serverCart = await fetchCartFirestore(userId, allProducts);
    const mergedMap = new Map<string, CartItem>();

    // 1. Add existing Firestore items
    for (const item of serverCart) {
      mergedMap.set(item.product.id, { ...item });
    }

    // 2. Merge guest items: sum quantities if item already exists in server cart
    for (const guestItem of guestCart) {
      if (mergedMap.has(guestItem.product.id)) {
        const existing = mergedMap.get(guestItem.product.id)!;
        existing.quantity = Math.max(existing.quantity, guestItem.quantity);
      } else {
        mergedMap.set(guestItem.product.id, { ...guestItem });
      }
    }

    const mergedList = Array.from(mergedMap.values());

    // 3. Persist merged result back to Firestore
    for (const item of mergedList) {
      await saveCartItemFirestore(userId, item);
    }

    return mergedList;
  } catch (err) {
    console.warn('Failed to merge cart on login:', err);
    return guestCart;
  }
}

export async function syncCartFirestore(userId: string, items: CartItem[]): Promise<void> {
  if (!userId) return;
  try {
    for (const it of items) {
      await saveCartItemFirestore(userId, it);
    }
  } catch (err) {
    console.warn('Failed to sync cart to Firestore:', err);
  }
}

// =========================================================================
// 5. CLOUD FIRESTORE WISHLIST SERVICES
// =========================================================================

export async function fetchWishlistFirestore(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const favCol = collection(db, 'users', userId, 'favorites');
    const snap = await getDocs(favCol);
    if (snap.empty) return [];

    const ids: string[] = [];
    snap.forEach((docItem) => {
      ids.push(docItem.id);
    });
    return ids;
  } catch (err) {
    console.warn('Failed to load wishlist from Firestore:', err);
    return [];
  }
}

export async function addWishlistFirestore(userId: string, product: Product): Promise<void> {
  if (!userId || !product?.id) return;
  try {
    const docRef = doc(db, 'users', userId, 'favorites', product.id);
    await setDoc(docRef, {
      productId: product.id,
      title_ar: product.title_ar,
      price: product.discount_price ?? product.original_price,
      image_url: product.image_url,
      addedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to add to wishlist in Firestore:', err);
  }
}

export async function removeWishlistFirestore(userId: string, productId: string): Promise<void> {
  if (!userId || !productId) return;
  try {
    await deleteDoc(doc(db, 'users', userId, 'favorites', productId));
  } catch (err) {
    console.warn('Failed to remove from wishlist in Firestore:', err);
  }
}

// =========================================================================
// 6. CLOUD FIRESTORE PRODUCTS SERVICES
// =========================================================================

export async function fetchProductsFirestore(): Promise<{ products: Product[]; isFirebase: boolean }> {
  try {
    const productsRef = collection(db, 'products');
    const snap = await getDocs(productsRef);

    if (snap.empty) {
      const seeded = await seedInitialProductsFirestore(INITIAL_PRODUCTS);
      if (seeded) {
        saveStoredProducts(INITIAL_PRODUCTS);
        return { products: INITIAL_PRODUCTS, isFirebase: true };
      }
      return { products: getStoredProducts(), isFirebase: false };
    }

    const items: Product[] = [];
    snap.forEach((docItem) => {
      const d = docItem.data();
      items.push({
        id: docItem.id,
        title_ar: d.title_ar || 'منتج غير مسمى',
        description_ar: d.description_ar || '',
        original_price: Number(d.original_price || 0),
        discount_price: d.discount_price !== undefined && d.discount_price !== null ? Number(d.discount_price) : null,
        stock_quantity: Number(d.stock_quantity ?? 10),
        category_id: d.category_id || 'skincare',
        category_name: d.category_name || 'عناية بالبشرة',
        tags: Array.isArray(d.tags) ? d.tags : [],
        image_url: d.image_url || '',
        gallery_images: Array.isArray(d.gallery_images) ? d.gallery_images : undefined,
        video_url: d.video_url || undefined,
        video_duration: d.video_duration || undefined,
        size_or_volume: d.size_or_volume || undefined,
        skin_type: d.skin_type || undefined,
        key_benefits: Array.isArray(d.key_benefits) ? d.key_benefits : undefined,
        ai_generated: Boolean(d.ai_generated),
        rating: Number(d.rating ?? 5.0),
        reviews_count: Number(d.reviews_count ?? 1),
        how_to_use: d.how_to_use || undefined,
        ingredients: d.ingredients || undefined,
        created_at: d.createdAt || d.created_at || new Date().toISOString(),
        featured: Boolean(d.featured),
      });
    });

    saveStoredProducts(items);
    return { products: items, isFirebase: true };
  } catch (err) {
    console.warn('Error fetching products from Firestore, using local fallback:', err);
    return { products: getStoredProducts(), isFirebase: false };
  }
}

export async function seedInitialProductsFirestore(productsList: Product[]): Promise<boolean> {
  try {
    for (const p of productsList) {
      await setDoc(doc(db, 'products', p.id), {
        id: p.id,
        title_ar: p.title_ar,
        description_ar: p.description_ar,
        original_price: p.original_price,
        discount_price: p.discount_price ?? null,
        stock_quantity: p.stock_quantity,
        category_id: p.category_id,
        category_name: p.category_name,
        image_url: p.image_url,
        video_url: p.video_url || null,
        tags: p.tags || [],
        rating: p.rating ?? 5.0,
        reviews_count: p.reviews_count ?? 1,
        featured: Boolean(p.featured),
        ai_generated: Boolean(p.ai_generated),
        createdAt: p.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return true;
  } catch (e) {
    console.warn('Could not seed initial products to Firestore:', e);
    return false;
  }
}

export async function saveProductFirestore(product: Product): Promise<void> {
  try {
    await setDoc(doc(db, 'products', product.id), {
      id: product.id,
      title_ar: product.title_ar,
      description_ar: product.description_ar,
      original_price: product.original_price,
      discount_price: product.discount_price ?? null,
      stock_quantity: product.stock_quantity,
      category_id: product.category_id,
      category_name: product.category_name,
      image_url: product.image_url,
      video_url: product.video_url || null,
      tags: product.tags || [],
      rating: product.rating ?? 5.0,
      reviews_count: product.reviews_count ?? 1,
      featured: Boolean(product.featured),
      ai_generated: Boolean(product.ai_generated),
      createdAt: product.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to save product in Firestore:', err);
  }
}

export async function deleteProductFirestore(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.warn('Failed to delete product in Firestore:', err);
  }
}

// =========================================================================
// 7. CLOUD FIRESTORE ORDERS SERVICES
// =========================================================================

export async function createOrderFirestore(order: Order, userId?: string): Promise<void> {
  const currentOrders = getStoredOrders();
  saveStoredOrders([order, ...currentOrders]);

  try {
    const orderDocRef = doc(db, 'orders', order.id);
    await setDoc(orderDocRef, {
      id: order.id,
      order_number: order.order_number,
      userId: userId || order.userId || 'guest',
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_city: order.city,
      customer_address: order.address,
      items: order.items || [],
      subtotal: Number(order.subtotal || 0),
      delivery_fee: Number(order.delivery_fee || 0),
      total_amount: Number(order.total_amount || 0),
      currency: 'ريال',
      status: order.status || 'pending',
      payment_method: order.payment_method || 'cod',
      notes: order.notes || '',
      createdAt: order.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to save order to Firestore, cached locally:', err);
  }
}

export async function fetchOrdersFirestore(
  userId?: string,
  isAdmin?: boolean
): Promise<{ orders: Order[]; isFirebase: boolean }> {
  try {
    const ordersCol = collection(db, 'orders');
    let q = query(ordersCol);

    if (!isAdmin && userId) {
      q = query(ordersCol, where('userId', '==', userId));
    }

    const snap = await getDocs(q);
    if (snap.empty) {
      return { orders: getStoredOrders(), isFirebase: true };
    }

    const items: Order[] = [];
    snap.forEach((docItem) => {
      const d = docItem.data();
      items.push({
        id: docItem.id,
        order_number: d.order_number || docItem.id,
        userId: d.userId,
        customer_name: d.customer_name || 'عميل',
        customer_phone: d.customer_phone || '',
        city: d.customer_city || '',
        address: d.customer_address || '',
        notes: d.notes || '',
        items: Array.isArray(d.items) ? d.items : [],
        subtotal: Number(d.subtotal || 0),
        discount_amount: 0,
        delivery_fee: Number(d.delivery_fee || 0),
        total_amount: Number(d.total_amount || 0),
        status: (d.status || 'pending') as OrderStatus,
        whatsapp_sent: true,
        payment_method: d.payment_method,
        created_at: d.createdAt || new Date().toISOString(),
        updated_at: d.updatedAt,
      });
    });

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    saveStoredOrders(items);
    return { orders: items, isFirebase: true };
  } catch (err) {
    console.warn('Failed to load orders from Firestore:', err);
    return { orders: getStoredOrders(), isFirebase: false };
  }
}

export async function updateOrderStatusFirestore(orderId: string, status: OrderStatus): Promise<void> {
  const orders = getStoredOrders();
  const updated = orders.map((o) => (o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o));
  saveStoredOrders(updated);

  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to update order status in Firestore:', err);
  }
}
