import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Order, OrderItem, OrderStatus } from '../types.ts';
import { adminFirestore } from './firebase-admin.ts';

export interface GuestTrackingRecord {
  id: string;
  order_number: string;
  tracking_token_hash: string; // Salted scrypt hash ("scrypt$<salt>$<hash>"), never plaintext
  status: OrderStatus;
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
  payment_method?: string;
  delivery_speed?: string;
  whatsapp_sent: boolean;
  created_at: string;
  updated_at?: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'guest-order-tracking.json');

// Lightweight per-IP rate limiting for order tracking endpoint
const TRACK_RATE_WINDOW_MS = 5 * 60 * 1000;
const TRACK_RATE_MAX_ATTEMPTS = 25;
const failedAttemptsByIp = new Map<string, { count: number; resetAt: number }>();

export function normalizeOrderNumber(value: string): string {
  return value.trim().replace(/^#/, '').toUpperCase();
}

export function generateGuestTrackingToken(): string {
  // 18 random bytes -> 24 base64url chars (144 bits of cryptographic entropy)
  return `AD-${crypto.randomBytes(18).toString('base64url')}`;
}

export function hashTrackingToken(token: string): string {
  const normalized = token.trim();
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(normalized, salt, 32).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyTrackingTokenHash(token: string, storedHash: string): boolean {
  if (!token || !storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex || expectedHex.length !== 64) {
    return false;
  }

  try {
    const derived = crypto.scryptSync(token.trim(), salt, 32);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) {
      return false;
    }
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function readStore(): Record<string, GuestTrackingRecord> {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn('[GuestTracking] Failed to read tracking store:', err);
    return {};
  }
}

function writeStore(records: Record<string, GuestTrackingRecord>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${STORE_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(records, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tmpFile, STORE_FILE);
  } catch (err) {
    console.warn('[GuestTracking] Failed to persist tracking store:', err);
  }
}

export function registerGuestOrder(orderInput: Partial<Order>): {
  trackingToken: string;
  trackingTokenHash: string;
  orderNumber: string;
} {
  const normalizedOrderNum = normalizeOrderNumber(String(orderInput.order_number || ''));
  if (!normalizedOrderNum) {
    throw new Error('order_number is required');
  }

  const trackingToken = generateGuestTrackingToken();
  const trackingTokenHash = hashTrackingToken(trackingToken);
  const nowIso = new Date().toISOString();

  const record: GuestTrackingRecord = {
    id: String(orderInput.id || `order-${Date.now()}`),
    order_number: normalizedOrderNum,
    tracking_token_hash: trackingTokenHash,
    status: (orderInput.status || 'pending') as OrderStatus,
    customer_name: String(orderInput.customer_name || 'عميل المتجر').slice(0, 120),
    customer_phone: String(orderInput.customer_phone || '').slice(0, 40),
    city: String(orderInput.city || '').slice(0, 80),
    address: String(orderInput.address || '').slice(0, 350),
    notes: orderInput.notes ? String(orderInput.notes).slice(0, 500) : '',
    items: Array.isArray(orderInput.items) ? orderInput.items : [],
    subtotal: Number(orderInput.subtotal || 0),
    discount_amount: Number(orderInput.discount_amount || 0),
    delivery_fee: Number(orderInput.delivery_fee || 0),
    total_amount: Number(orderInput.total_amount || 0),
    payment_method: orderInput.payment_method ? String(orderInput.payment_method) : undefined,
    delivery_speed: orderInput.delivery_speed ? String(orderInput.delivery_speed) : undefined,
    whatsapp_sent: Boolean(orderInput.whatsapp_sent ?? true),
    created_at: String(orderInput.created_at || nowIso),
    updated_at: nowIso,
  };

  const store = readStore();
  if (store[normalizedOrderNum]) {
    throw new Error('ORDER_NUMBER_EXISTS');
  }
  store[normalizedOrderNum] = record;
  writeStore(store);

  return {
    trackingToken,
    trackingTokenHash,
    orderNumber: normalizedOrderNum,
  };
}

export function updateGuestOrderStatus(orderNumberOrId: string, status: OrderStatus): boolean {
  const key = normalizeOrderNumber(orderNumberOrId);
  const store = readStore();

  let matchedKey: string | null = store[key] ? key : null;
  if (!matchedKey) {
    for (const [k, rec] of Object.entries(store)) {
      if (rec.id === orderNumberOrId || normalizeOrderNumber(rec.order_number) === key) {
        matchedKey = k;
        break;
      }
    }
  }

  if (!matchedKey) {
    return false;
  }

  store[matchedKey] = {
    ...store[matchedKey],
    status,
    updated_at: new Date().toISOString(),
  };
  writeStore(store);
  return true;
}

export function checkTrackRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const entry = failedAttemptsByIp.get(clientIp);
  if (!entry || now > entry.resetAt) {
    return true;
  }
  return entry.count < TRACK_RATE_MAX_ATTEMPTS;
}

export function recordTrackAttemptFailure(clientIp: string): void {
  const now = Date.now();
  const entry = failedAttemptsByIp.get(clientIp);
  if (!entry || now > entry.resetAt) {
    failedAttemptsByIp.set(clientIp, { count: 1, resetAt: now + TRACK_RATE_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearTrackAttemptFailures(clientIp: string): void {
  failedAttemptsByIp.delete(clientIp);
}

function sanitizeOrderResponse(record: GuestTrackingRecord): Omit<GuestTrackingRecord, 'tracking_token_hash'> {
  const { tracking_token_hash: _hiddenHash, ...safeOrder } = record;
  return safeOrder;
}

async function fetchGuestOrderFromFirestore(orderNumber: string): Promise<GuestTrackingRecord | null> {
  try {
    const snap = await adminFirestore
      .collection('orders')
      .where('order_number', '==', orderNumber)
      .limit(1)
      .get();

    if (snap.empty) {
      return null;
    }

    const docSnap = snap.docs[0];
    const d = docSnap.data();
    if (!d || typeof d.tracking_token_hash !== 'string' || !d.tracking_token_hash) {
      return null;
    }

    return {
      id: docSnap.id,
      order_number: String(d.order_number || orderNumber),
      tracking_token_hash: d.tracking_token_hash,
      status: (d.status || 'pending') as OrderStatus,
      customer_name: String(d.customer_name || 'عميل المتجر'),
      customer_phone: String(d.customer_phone || ''),
      city: String(d.customer_city || d.city || ''),
      address: String(d.customer_address || d.address || ''),
      notes: d.notes ? String(d.notes) : '',
      items: Array.isArray(d.items) ? d.items : [],
      subtotal: Number(d.subtotal || 0),
      discount_amount: Number(d.discount_amount || 0),
      delivery_fee: Number(d.delivery_fee || 0),
      total_amount: Number(d.total_amount || 0),
      payment_method: d.payment_method ? String(d.payment_method) : undefined,
      delivery_speed: d.delivery_speed ? String(d.delivery_speed) : undefined,
      whatsapp_sent: true,
      created_at: String(d.createdAt || d.created_at || new Date().toISOString()),
      updated_at: d.updatedAt ? String(d.updatedAt) : undefined,
    };
  } catch {
    // Preview ADC may lack Firestore read IAM permissions on external project;
    // falls back safely to server-side tracking store.
    return null;
  }
}

export async function verifyAndGetGuestOrder(
  rawOrderNumber: string,
  rawTrackingToken: string
): Promise<Omit<GuestTrackingRecord, 'tracking_token_hash'> | null> {
  const normalizedOrderNum = normalizeOrderNumber(rawOrderNumber);
  const trackingToken = rawTrackingToken.trim();

  if (!normalizedOrderNum || !trackingToken) {
    return null;
  }

  const store = readStore();
  const localRecord = store[normalizedOrderNum] || null;

  // Prefer live Firestore status if Admin SDK has access, while still enforcing hash match
  const firestoreRecord = await fetchGuestOrderFromFirestore(normalizedOrderNum);

  const candidate = firestoreRecord || localRecord;
  if (!candidate || !candidate.tracking_token_hash) {
    return null;
  }

  const isValid = verifyTrackingTokenHash(trackingToken, candidate.tracking_token_hash);
  if (!isValid) {
    return null;
  }

  // Merge latest status if both exist and local store has newer update
  if (firestoreRecord && localRecord && localRecord.updated_at && firestoreRecord.updated_at) {
    if (new Date(localRecord.updated_at).getTime() > new Date(firestoreRecord.updated_at).getTime()) {
      return sanitizeOrderResponse(localRecord);
    }
  }

  return sanitizeOrderResponse(candidate);
}
