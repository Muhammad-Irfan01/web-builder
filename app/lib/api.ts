/**
 * Orcayo API Client
 * Injects `x-store-id` and `x-branch-id` on every request for multi-tenant isolation.
 * Customer JWTs are scoped to read-only profile/order access only.
 */

import { API_ORIGIN } from './origins';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return API_ORIGIN;
  }
  const envVal = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL)
    ? (import.meta as any).env.VITE_API_BASE_URL
    : '';
  if (envVal) return envVal.replace(/\/+$/, '');
  return 'http://localhost:3000';
};

const BASE_URL = getApiBaseUrl();

const STORE_ID = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_STORE_ID)
  ? (import.meta as any).env.VITE_STORE_ID
  : 'default-store';

const BRANCH_ID = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BRANCH_ID)
  ? (import.meta as any).env.VITE_BRANCH_ID
  : 'default-branch';

// ── Token & Session helpers (client-only) ──────────────────────────────────
function safeStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem(key, value);
    }
  } catch {}
}

function safeStorageRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
      window.localStorage.removeItem(key);
    }
  } catch {}
}

export function getCustomerToken(): string | null {
  return safeStorageGet('orcayo_customer_token');
}

export function setCustomerToken(token: string): void {
  safeStorageSet('orcayo_customer_token', token);
}

export function clearCustomerToken(): void {
  safeStorageRemove('orcayo_customer_token');
}

export function getSessionId(): string | null {
  return safeStorageGet('orcayo_session_id');
}

export function setSessionId(id: string): void {
  safeStorageSet('orcayo_session_id', id);
}

export function getBuilderApiKey(): string | null {
  return safeStorageGet('orcayo_builder_api_key');
}

export function setBuilderApiKey(key: string): void {
  safeStorageSet('orcayo_builder_api_key', key);
}

// ── Dynamic store ID override (client-side SPA state) ──────────────────────
// StorefrontLayout calls setClientStoreId() on mount so all subsequent
// client-side API calls (cart, checkout, auth) carry the correct tenant id.
let _activeStoreId: string | null = null;

export function setClientStoreId(id: string): void {
  if (id) _activeStoreId = id;
}

export function getClientStoreId(): string | null {
  return _activeStoreId;
}

// ── Base fetcher ──────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  explicitStoreId?: string | null,
): Promise<T> {
  const fullUrl = `${BASE_URL}${path}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-store-id': explicitStoreId ?? getClientStoreId() ?? STORE_ID,
    'x-branch-id': BRANCH_ID,
    ...(options.headers as Record<string, string> ?? {}),
  };

  const sessionId = getSessionId();
  if (sessionId) headers['x-session-id'] = sessionId;

  const builderApiKey = getBuilderApiKey();
  if (builderApiKey) headers['x-api-key'] = builderApiKey;

  const jwt = token ?? (typeof localStorage !== 'undefined' ? getCustomerToken() : null);
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  } else if (builderApiKey) {
    // Fallback: use site token as Authorization if no customer token exists
    headers['Authorization'] = `Bearer ${builderApiKey}`;
  }

  // LOG EVERYTHING for SSR debugging
  if (typeof window === 'undefined') {
    console.log(`[API Client] SSR FETCH: ${options.method || 'GET'} ${fullUrl}`);
    console.log(`[API Client] Headers: ${JSON.stringify({ 
      ...headers, 
      Authorization: headers.Authorization ? 'Bearer [REDACTED]' : 'NONE',
      'x-api-key': headers['x-api-key'] ? '[PRESENT]' : 'NONE'
    })}`);
  }

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = (errBody as any).message ?? res.statusText;
    if (typeof window === 'undefined') {
      console.error(`[API Client] SSR FETCH FAILED (${res.status}): ${msg}`);
    }
    throw new ApiError(res.status, msg);
  }

  const data = await res.json();
  
  // If the backend returned a new session ID, save it
  if (data && (data as any).newSessionId) {
    setSessionId((data as any).newSessionId);
  }

  return data as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Auth Service ──────────────────────────────────────────────────────────
export interface AuthPayload { token: string; customer: Customer; }
export interface Customer {
  id: string; email: string; firstName: string; lastName: string; phone?: string;
}

export const auth = {
  signup: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    request<AuthPayload>('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  signin: (data: { email: string; password: string }) =>
    request<AuthPayload>('/api/auth/signin', { method: 'POST', body: JSON.stringify(data) }),

  profile: (token: string) =>
    request<Customer>('/api/auth/profile', {}, token),

  logout: () =>
    request<void>('/api/auth/logout', { method: 'POST' }),
};

// ── Products Service ──────────────────────────────────────────────────────
export interface Variant {
  id: string;
  name?: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
}

export interface Product {
  id: string;
  slug?: string;
  // Backend returns 'title'; we also accept 'name' for forward-compat
  title?: string;
  name?: string;
  description?: string;
  // Flat price if present (some backends); otherwise derived from variants
  price?: number;
  compareAtPrice?: number;
  images?: string[];
  variants?: Variant[];
  categoryId?: string;
  // Backend uses 'status' string; inStock is derived
  status?: string;
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  [key: string]: unknown;
}

/** Get the display name from a product (handles title vs name) */
export function getProductName(p: Product): string {
  return (p.title || p.name || 'Unnamed Product');
}

/** Get the display price from a product (flat price or first variant price) */
export function getProductPrice(p: Product): number {
  if (typeof p.price === 'number' && p.price > 0) return p.price;
  const variantPrice = p.variants?.[0]?.price;
  if (typeof variantPrice === 'number') return variantPrice;
  // Try parsing string price
  const raw = (p as any).price ?? (p as any).variants?.[0]?.price;
  return +(raw ?? 0);
}

/** Get the display image URL from a product (handles raw strings, or objects with src) */
export function getProductImage(p: Product): string {
  const first = p.images?.[0];
  if (!first) return '';
  if (typeof first === 'string') return first;
  if (typeof first === 'object' && first !== null && 'src' in first) {
    return (first as any).src || '';
  }
  return '';
}

/** Get all product image URLs as strings */
export function getProductImages(p: Product): string[] {
  if (!p.images) return [];
  return p.images.map(img => {
    if (typeof img === 'string') return img;
    if (typeof img === 'object' && img !== null && 'src' in img) {
      return (img as any).src || '';
    }
    return '';
  }).filter(Boolean);
}


export interface ProductsResponse { data: Product[]; total: number; page: number; limit: number; }


export const products = {
  /**
   * List products.
   * @param storeId Optional explicit storeId override for SSR loaders.
   * @param ssrToken Optional Bearer token for SSR (project apiKey or admin JWT).
   */
  list: (params: { page?: number; limit?: number; categoryId?: string; search?: string } = {}, ssrToken?: string | null, storeId?: string | null) => {
    const q = new URLSearchParams();
    if (params.page)       q.set('page', String(params.page));
    if (params.limit)      q.set('limit', String(params.limit));
    if (params.categoryId) q.set('categoryId', params.categoryId);
    if (params.search)     q.set('search', params.search);
    return request<ProductsResponse>(`/api/products?${q}`, {}, ssrToken, storeId);
  },

  get: (id: string, storeId?: string | null, ssrToken?: string | null) => request<Product>(`/api/products/${id}`, {}, ssrToken, storeId),
  getBySlug: (slug: string, storeId?: string | null, ssrToken?: string | null) => request<Product>(`/api/products/by-slug/${slug}`, {}, ssrToken, storeId),
};

// ── Cart Service ──────────────────────────────────────────────────────────
export interface CartItem { id: string; productId: string; variantId?: string; name: string; price: number; quantity: number; image: string; }
export interface Cart { id: string; items: CartItem[]; subtotal: number; }

export const cart = {
  get:    ()                                         => request<Cart>('/api/cart'),
  add:    (item: { productId: string; variantId?: string; quantity: number; price?: number }) =>
            request<Cart>('/api/cart/items', { method: 'POST', body: JSON.stringify(item) }),
  update: (itemId: string, quantity: number) =>
            request<Cart>(`/api/cart/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  remove: (itemId: string) =>
            request<Cart>(`/api/cart/items/${itemId}`, { method: 'DELETE' }),
  clear:  ()                                         => request<Cart>('/api/cart', { method: 'DELETE' }),
  validate: () => request<{ valid: boolean; errors: string[] }>('/api/cart/validate'),
};

// ── Checkout Service ──────────────────────────────────────────────────────
export interface CheckoutSession { sessionId: string; total: number; currency: string; }
export interface ShippingRate { id: string; name: string; price: number; estimatedDays: string; }

export const checkout = {
  getRates: (cartId: string) =>
    request<ShippingRate[]>(`/api/shipments?cartId=${cartId}`),

  initiate: (data: { cartId: string; shippingRateId: string; shippingAddress: Address }) =>
    request<CheckoutSession>('/api/checkout/initiate', { method: 'POST', body: JSON.stringify(data) }),

  process: (data: { sessionId: string; paymentPayload: object }) =>
    request<Order>('/api/checkout/process', { method: 'POST', body: JSON.stringify(data) }),

  confirmOrder: (data: {
    customerPhone: string;
    orderDetails: {
      orderId: string;
      total: number;
      currency: string;
      items: Array<{ name: string; quantity: number; price: number }>;
    };
  }) => request<any>('/api/checkout/confirm-order', { method: 'POST', body: JSON.stringify(data) }),

  sendPaymentFlow: (data: {
    customerPhone: string;
    orderDetails: {
      orderId: string;
      total: number;
      currency: string;
    };
  }) => request<any>('/api/checkout/payment-flow', { method: 'POST', body: JSON.stringify(data) }),
};

export interface Address {
  fullName: string; line1: string; line2?: string;
  city: string; state: string; postalCode: string; country: string; phone: string;
}

// ── Orders Service ────────────────────────────────────────────────────────
export interface Order {
  id: string; status: string; items: CartItem[];
  total: number; createdAt: string; shippingAddress: Address;
  trackingNumber?: string;
  customerPhone?: string;
  storeId?: string;
  orderNumber?: string;
  currency?: string;
  orderItems?: CartItem[];
  paymentStatus?: string;
  subtotal?: number;
  shipping?: number;
  discount?: number;
}

export const orders = {
  get:  (orderId: string)   => request<Order>(`/api/orders/${orderId}`),
  list: ()                  => request<Order[]>('/api/orders'),
  create: (data: object)    => request<any>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  pay: (orderId: string, data: { paymentMethod: string; paymentMethodId?: string; returnUrl?: string; customerPhone?: string }) =>
    request<any>(`/api/orders/${orderId}/payment`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── Payment Gateways ──────────────────────────────────────────────────────
export interface PaymentGateway { id: string; type: string; name: string; icon: string; }

export const payments = {
  listGateways: ()          => request<PaymentGateway[]>('/api/payment-gateways/list'),
  validate:     (type: string, payload: object) =>
                  request<{ valid: boolean }>(`/api/payment-gateways/${type}/validate`, {
                    method: 'POST', body: JSON.stringify(payload),
                  }),
  process:      (payload: object) =>
                  request<{ transactionId: string }>('/api/payments', {
                    method: 'POST', body: JSON.stringify(payload),
                  }),
  getActiveConfig: (token?: string | null) =>
    request<{
      success: boolean;
      data: {
        gatewayType: string;
        publishableKey?: string;
        currency: string;
        isTestMode: boolean;
        enabledPaymentMethods?: string[];
        customPaymentMethods?: Array<{ id: string; name: string; description?: string }>;
      }
    }>('/api/payment-gateways/active', {}, token),
};

// ── Shipments ─────────────────────────────────────────────────────────────
export const shipments = {
  track: (shipmentId: string) =>
    request<{ status: string; events: { date: string; description: string }[] }>
      (`/api/shipments/${shipmentId}/tracking`),
};

// ── Files / Media ────────────────────────────────────────────────────────
export const files = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('files', file);

    const headers: Record<string, string> = {
      'x-store-id': STORE_ID,
      'x-branch-id': BRANCH_ID,
    };
    const jwt = getCustomerToken();
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

    const res = await fetch(`${BASE_URL}/api/files/products/general/files`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.data?.[0]?.url || URL.createObjectURL(file); // Fallback to blob if URL not returned
  }
};

// ── Store Service ────────────────────────────────────────────────────────
export interface StoreDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
}

export const store = {
  getDetails: () => request<{ success: boolean; data: StoreDetails }>('/api/store/me'), // Use special "me" alias or header-based lookup
};

// ── Bookings Service ──────────────────────────────────────────────────────
export interface BookingItem {
  productId?: string;
  price: number;
  startAt: string;
  endAt: string;
}

export interface Booking {
  id?: string;
  storeId?: string;
  customerId?: string;
  productId?: string;
  email?: string;
  phone?: string;
  name?: string;
  status: string;
  startAt: string;
  endAt: string;
  totalAmount?: number;
  notes?: string;
  staffId?: string;
  items?: BookingItem[];
}

export interface BookingSlot {
  id: string;
  name: string;
  description?: string;
  duration: number;
  startTime: string;
  endTime: string;
  capacity?: number;
  isAvailable?: boolean;
}

export const bookings = {
  listSlots: (storeId?: string | null, ssrToken?: string | null) => 
    request<BookingSlot[]>('/api/booking-slots', {}, ssrToken, storeId),
    
  create: (data: Booking, storeId?: string | null, ssrToken?: string | null) =>
    request<{ success: boolean; data: any }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    }, ssrToken, storeId),

  list: (storeId?: string | null, ssrToken?: string | null) =>
    request<any[]>('/api/bookings', {}, ssrToken, storeId),

  getAvailabilities: (staffId?: string, storeId?: string | null, ssrToken?: string | null) => 
    request<{ success: boolean; data: any[] }>(`/api/availabilities?staffId=${staffId || ''}`, {}, ssrToken, storeId),

  getStoreAvailabilities: (storeId?: string | null, ssrToken?: string | null) =>
    request<{ success: boolean; data: any[] }>('/api/store-availability', {}, ssrToken, storeId),
};

export const teams = {
  listStaff: (storeId?: string | null, ssrToken?: string | null) =>
    request<any[]>('/api/staff', {}, ssrToken, storeId),
  listBranchStaff: (branchId: string, storeId?: string | null, ssrToken?: string | null) =>
    request<any[]>(`/api/branch-staff/${branchId}`, {}, ssrToken, storeId),
};
