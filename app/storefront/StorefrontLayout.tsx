/**
 * Storefront shared components
 * Header, CartDrawer, AuthModal, Footer
 * Receives live theme updates via postMessage from Builder Canvas
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useParams, useLocation } from 'react-router';
import { auth, cart as cartApi, getCustomerToken, setCustomerToken, clearCustomerToken, setBuilderApiKey, setClientStoreId } from '../lib/api';
import type { CartItem, Customer } from '../lib/api';

import { DEFAULT_THEME, themeToCSS } from '../lib/theme';
import { normalizeThemeLayout } from '../lib/component-tree';

// ── Storefront Theme Context & Bridge ─────────────────────────────────────
interface StorefrontThemeCtx {
  theme: any;
}

const StorefrontThemeContext = createContext<StorefrontThemeCtx | null>(null);

export function useStorefrontTheme() {
  const ctx = useContext(StorefrontThemeContext);
  if (!ctx) return { theme: DEFAULT_THEME };
  return ctx;
}

export function useStorefrontLink() {
  const params = useParams();
  const location = useLocation();

  const getLink = useCallback((path: string) => {
    let subpath = path.replace(/^\/storefront/, '');
    // Strip any legacy pub path prefix if present (e.g. /pub/some-id/products -> products)
    subpath = subpath.replace(/^\/pub\/[^/]+/, '');
    
    if (subpath.startsWith('/')) {
      subpath = subpath.substring(1);
    }

    // Resolve query parameters from location.search
    let queryProjectId = '';
    let queryTemplateId = '';
    if (typeof window !== 'undefined') {
      const queryParams = new URLSearchParams(window.location.search);
      queryProjectId = queryParams.get('projectId') || '';
      queryTemplateId = queryParams.get('templateId') || '';
    } else if (location.search) {
      const queryParams = new URLSearchParams(location.search);
      queryProjectId = queryParams.get('projectId') || '';
      queryTemplateId = queryParams.get('templateId') || '';
    }

    // 1. Resolve projectId from params or location pathname or query (fully SSR & client safe)
    let projectId = params.projectId || queryProjectId;
    if (!projectId) {
      const match = location.pathname.match(/\/pub\/([^/]+)/);
      if (match) projectId = match[1];
    }

    // 2. Detect if the current route has a /pub/ prefix (direct path-based sandbox testing)
    const isPathBasedPub = location.pathname.startsWith('/pub/') || location.pathname.includes('/pub/');

    // If we are browsing a path-prefixed testing URL, preserve the prefix to guarantee resolution on the sandbox host
    if (isPathBasedPub && projectId) {
      let targetPath = `/pub/${projectId}`;
      if (subpath) {
        targetPath = `/pub/${projectId}/${subpath}`;
      }
      try {
        const targetUrl = new URL(targetPath, 'http://dummy.com');
        return targetUrl.pathname + targetUrl.search + targetUrl.hash;
      } catch {
        return targetPath;
      }
    }

    // 3. Otherwise, use clean white-label routing
    const isPreview = location.pathname.startsWith('/storefront') || 
      (typeof window !== 'undefined' && (
        window.location.search.includes('projectId') || 
        window.location.search.includes('templateId') || 
        document.cookie.includes('orcayo_preview_project_id')
      ));

    if (isPreview) {
      let targetPath = `/storefront`;
      if (subpath) {
        targetPath = `/storefront/${subpath}`;
      }
      
      try {
        const targetUrl = new URL(targetPath, 'http://dummy.com');
        const targetParams = targetUrl.searchParams;
        
        if (queryProjectId) {
          targetParams.set('projectId', queryProjectId);
        } else if (queryTemplateId) {
          targetParams.set('templateId', queryTemplateId);
        }
        
        return targetUrl.pathname + targetUrl.search + targetUrl.hash;
      } catch {
        // Fallback if URL parsing fails
        let queryString = '';
        if (queryProjectId) {
          queryString = `projectId=${queryProjectId}`;
        } else if (queryTemplateId) {
          queryString = `templateId=${queryTemplateId}`;
        }
        if (queryString) {
          const sep = targetPath.includes('?') ? '&' : '?';
          return `${targetPath}${sep}${queryString}`;
        }
        return targetPath;
      }
    } else {
      // Clean white-label URL: domainname/product/product-slug
      if (!subpath) return `/`;
      return `/${subpath}`;
    }
  }, [params.projectId, location.pathname, location.search]);

  return getLink;
}

export function useThemeBridge(setTheme: (t: any) => void) {
  useEffect(() => {
    // Determine the isolated key for this project/template to prevent bleeding
    const getStorageKey = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const pId = urlParams.get('projectId');
        if (pId) return `orcayo_theme_project_${pId}`;
        const tId = urlParams.get('templateId');
        if (tId) return `orcayo_theme_template_${tId}`;
      }
      return 'orcayo_theme_default';
    };
    const storageKey = getStorageKey();

    // 1. Initial load: Load from isolated localStorage if present
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setTheme(normalizeThemeLayout({ ...DEFAULT_THEME, ...parsed }));
          
          // Inject stored styles immediately
          const cssVars = themeToCSS(parsed);
          document.documentElement.setAttribute('style', cssVars);
          
          const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(parsed.fontBody)}:wght@400;500;600;700&family=${encodeURIComponent(parsed.fontHeading)}:wght@600;700;800&display=swap`;
          let link = document.getElementById('sf-font-link') as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement('link');
            link.id = 'sf-font-link';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
          link.href = fontUrl;
        }
      } catch (err) {
        console.error('[ThemeBridge] Local storage parse error:', err);
      }
    }

    // 2. Real-time postMessage updates from builder customizer
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== 'orcayo:theme-update') return;
      const { cssVars, fontUrl, theme: newTheme } = e.data;

      // Inject CSS variables onto :root
      if (cssVars) document.documentElement.setAttribute('style', cssVars);

      // Swap Google Font link
      if (fontUrl) {
        let link = document.getElementById('sf-font-link') as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.id   = 'sf-font-link';
          link.rel  = 'stylesheet';
          document.head.appendChild(link);
        }
        link.href = fontUrl;
      }

      // Update state theme properties
      setTheme((prev: any) => {
        const base = prev || DEFAULT_THEME;
        return {
          ...base,
          ...normalizeThemeLayout(newTheme || {}),
        };
      });
    };
    
    window.addEventListener('message', handler);

    // 3. Emit a 'ready' handshake message to the parent builder customizer window
    if (typeof window !== 'undefined') {
      window.parent.postMessage({ type: 'orcayo:storefront-ready' }, '*');
    }

    return () => window.removeEventListener('message', handler);
  }, [setTheme]);
}

// ── Cart Context ─────────────────────────────────────────────────────────
interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (productId: string, name: string, price: number, image: string, variantId?: string) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  isLoading: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartCtx | null>(null);

const CART_STORAGE_KEY = 'orcayo_cart_data';
const CART_TTL = 24 * 60 * 60 * 1000; // 24 hours

const mapBackendCart = (backendCart: any, currentItems: CartItem[] = []): CartItem[] => {
  if (!backendCart) return [];
  // Support both backend payload formats: wrapped in success envelope or direct flat structure
  const rawCart = backendCart?.data || backendCart;
  const rawItems = rawCart?.cartItems || rawCart?.items || [];
  return rawItems.map((item: any) => {
    const localMatch = currentItems.find(
      (li) => li.productId === item.productId && (li.variantId === item.variantId || (!li.variantId && !item.variantId))
    );
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId || undefined,
      name: item.productName || item.name || 'Unnamed Product',
      price: typeof item.sellPrice === 'number' ? item.sellPrice : (typeof item.price === 'number' ? item.price : 0),
      quantity: item.quantity,
      image: item.image || localMatch?.image || '',
    };
  });
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]     = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen]   = useState(false);
  const { theme } = useStorefrontTheme();
  const storeId = (theme as any)?.storeId;

  // 1. Initial Load: Try LocalStorage first (with TTL check), then Sync with Backend
  useEffect(() => {
    if (!storeId) return;
    
    // Set client store ID globally for headers
    setClientStoreId(storeId);
    
    let localBackup: CartItem[] = [];
    // Try to restore from localStorage for instant UI feedback
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(`${CART_STORAGE_KEY}_${storeId}`);
      if (saved) {
        try {
          const { items: savedItems, timestamp } = JSON.parse(saved);
          const isExpired = Date.now() - timestamp > CART_TTL;
          
          if (!isExpired && Array.isArray(savedItems)) {
            setItems(savedItems);
            localBackup = savedItems;
          } else {
            console.log(`[Cart] Session expired for store ${storeId}, clearing local cart.`);
            localStorage.removeItem(`${CART_STORAGE_KEY}_${storeId}`);
          }
        } catch (e) {
          console.error('[Cart] Failed to parse local storage data:', e);
        }
      }
    }

    setIsLoading(true);
    cartApi.get()
      .then(c => {
        const mapped = mapBackendCart(c, localBackup);
        setItems(mapped);
        // Persist the fresh server state with current timestamp
        localStorage.setItem(`${CART_STORAGE_KEY}_${storeId}`, JSON.stringify({
          items: mapped,
          timestamp: Date.now()
        }));
      })
      .catch(err => {
        console.error('[Cart] Init fetch error:', err);
        // Don't clear items if fetch fails, keep local state for resilience
      })
      .finally(() => setIsLoading(false));
  }, [storeId]);

  // 2. Persist to LocalStorage on every change
  useEffect(() => {
    if (storeId && typeof localStorage !== 'undefined' && items.length > 0) {
      localStorage.setItem(`${CART_STORAGE_KEY}_${storeId}`, JSON.stringify({
        items,
        timestamp: Date.now()
      }));
    }
  }, [items, storeId]);

  const count    = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const addItem = useCallback(async (productId: string, name: string, price: number, image: string, variantId?: string) => {
    if (!storeId) return;
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    let optimisticItems: CartItem[] = [];
    setItems(prev => {
      const existing = prev.find(i => i.productId === productId && i.variantId === variantId);
      const updated = existing 
        ? prev.map(i => (i.productId === productId && i.variantId === variantId) ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { id: tempId, productId, variantId, name, price, image, quantity: 1 }];
      optimisticItems = updated;
      return updated;
    });
    setIsOpen(true);

    try {
      const updated = await cartApi.add({ productId, variantId, quantity: 1, price });
      setItems(mapBackendCart(updated, optimisticItems));
    } catch (err) {
      console.error('[Cart] Add error:', err);
      // Fallback: sync from server
      const fresh = await cartApi.get();
      setItems(mapBackendCart(fresh, optimisticItems));
    }
  }, [storeId]);

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    if (quantity < 1) return removeItem(itemId);

    let currentItems: CartItem[] = [];
    setItems(prev => {
      const updated = prev.map(i => i.id === itemId ? { ...i, quantity } : i);
      currentItems = updated;
      return updated;
    });

    try {
      const updated = await cartApi.update(itemId, quantity);
      setItems(mapBackendCart(updated, currentItems));
    } catch (err) {
      const fresh = await cartApi.get();
      setItems(mapBackendCart(fresh, currentItems));
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    let currentItems: CartItem[] = [];
    setItems(prev => {
      const updated = prev.filter(i => i.id !== itemId);
      currentItems = updated;
      return updated;
    });

    try {
      const updated = await cartApi.remove(itemId);
      setItems(mapBackendCart(updated, currentItems));
    } catch (err) {
      const fresh = await cartApi.get();
      setItems(mapBackendCart(fresh, currentItems));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (storeId && typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${CART_STORAGE_KEY}_${storeId}`);
    }
    cartApi.clear().catch(err => {
      console.error('[Cart] Clear server cart error:', err);
    });
  }, [storeId]);

  return (
    <CartContext.Provider value={{ 
      items, count, subtotal, addItem, updateItem, removeItem, clearCart,
      isLoading, isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}

// ── Auth Context ─────────────────────────────────────────────────────────
interface AuthCtx {
  customer: Customer | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    const token = getCustomerToken();
    if (!token) { setIsLoading(false); return; }
    auth.profile(token).then(c => setCustomer(c)).catch(() => clearCustomerToken()).finally(() => setIsLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const { token, customer: c } = await auth.signin({ email, password });
      setCustomerToken(token);
      setCustomer(c);
    } catch (e: any) { setError(e.message ?? 'Sign in failed'); throw e; }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setError(null);
    try {
      const { token, customer: c } = await auth.signup({ email, password, firstName, lastName });
      setCustomerToken(token);
      setCustomer(c);
    } catch (e: any) { setError(e.message ?? 'Sign up failed'); throw e; }
  };

  const logout = () => { clearCustomerToken(); setCustomer(null); };

  return (
    <AuthContext.Provider value={{ customer, isLoading, signIn, signUp, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

// ── StorefrontHeader ─────────────────────────────────────────────────────
interface HeaderProps { storeName: string; showAuth?: boolean; }

export function StorefrontHeader({ storeName, showAuth = true }: HeaderProps) {
  const { count, open } = useCart();
  const { customer, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const { theme } = useStorefrontTheme();
  const getLink = useStorefrontLink();

  const headerLinks = theme?.headerMenu || [];
  const headerStyle = theme?.headerStyle || 'default';
  const isSticky = theme?.headerSticky !== false;

  const headerClasses = [
    'sf-header',
    `sf-header--${headerStyle}`,
    isSticky ? 'sf-header--sticky' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <header className={headerClasses}>
        <div className="sf-container sf-header-inner">
          <a href={getLink('/storefront')} className="sf-logo">{storeName}</a>
          <nav className="sf-nav">
            {headerLinks.length > 0 ? (
              headerLinks.map((link: any) => (
                <a key={link.id} href={getLink(link.url)}>
                  {link.label}
                </a>
              ))
            ) : (
              <>
                <a href={getLink('/storefront')}>Home</a>
                <a href={getLink('/storefront/products')}>Products</a>
                <a href={getLink('/storefront/about')}>About</a>
              </>
            )}
          </nav>
          <div className="sf-header-actions">
            {showAuth && (
              customer
                ? <button className="sf-cart-btn" onClick={logout} style={{ fontSize: '0.8rem' }}>
                    {customer.firstName} · Sign out
                  </button>
                : <button className="sf-cart-btn" onClick={() => setAuthOpen(true)}>Sign In</button>
            )}
            <button className="sf-cart-btn" onClick={open} aria-label="Open cart">
              🛒 Cart
              {count > 0 && <span className="sf-cart-count">{count}</span>}
            </button>
          </div>
        </div>
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}

// ── Auth Modal ───────────────────────────────────────────────────────────
export function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp, error } = useAuth();
  const [mode, setMode]       = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ email: '', password: '', firstName: '', lastName: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') await signIn(form.email, form.password);
      else await signUp(form.email, form.password, form.firstName, form.lastName);
      onClose();
    } catch { /* error shown via context */ } finally { setLoading(false); }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="sf-auth-modal-overlay" onClick={onClose}>
      <div className="sf-auth-modal" onClick={e => e.stopPropagation()}>
        <h2>{mode === 'signin' ? 'Welcome back' : 'Create account'}</h2>
        <p>{mode === 'signin' ? 'Sign in to your account' : 'Join the store today'}</p>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '2px' }}>
              <input className="sf-input" placeholder="First name" value={form.firstName} onChange={e => set('firstName', e.target.value)} required style={{ marginBottom: 0 }} />
              <input className="sf-input" placeholder="Last name" value={form.lastName} onChange={e => set('lastName', e.target.value)} required style={{ marginBottom: 0 }} />
            </div>
          )}
          <input className="sf-input" type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} required />
          <input className="sf-input" type="password" placeholder="Password" value={form.password} onChange={e => set('password', e.target.value)} required />

          {error && <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '12px' }}>{error}</p>}

          <button className="sf-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Please wait…' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--sf-text-muted)' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
            style={{ background: 'none', border: 'none', color: 'var(--sf-primary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Cart Drawer ──────────────────────────────────────────────────────────
export function CartDrawer() {
  const { items, subtotal, updateItem, removeItem, isOpen, close, isLoading } = useCart();
  const getLink = useStorefrontLink();

  return (
    <div className={`sf-cart-drawer${isOpen ? ' open' : ''}`}>
      <div className="sf-cart-header">
        <h3>🛒 Your Cart ({items.length})</h3>
        <button className="sf-cart-close" onClick={close}>✕</button>
      </div>

      <div className="sf-cart-items">
        {isLoading ? (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div className="sf-skeleton" style={{ height: '100px', marginBottom: '10px' }} />
            <div className="sf-skeleton" style={{ height: '100px' }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '60px', color: 'var(--sf-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛍️</div>
            <p>Your cart is empty</p>
          </div>
        ) : items.map(item => (
          <div className="sf-cart-item" key={item.id}>
            <div className="sf-cart-item-img">
              {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} /> : '🛍️'}
            </div>
            <div className="sf-cart-item-details">
              <div className="sf-cart-item-name">{item.name}</div>
              <div className="sf-cart-item-price">${(item.price * item.quantity).toFixed(2)}</div>
              
              <div className="sf-qty-control" style={{ height: '28px', marginTop: '8px', maxWidth: '100px' }}>
                <button className="sf-qty-btn" onClick={() => updateItem(item.id, item.quantity - 1)}>−</button>
                <span className="sf-qty-val" style={{ fontSize: '0.8rem' }}>{item.quantity}</span>
                <button className="sf-qty-btn" onClick={() => updateItem(item.id, item.quantity + 1)}>+</button>
              </div>
            </div>
            <button onClick={() => removeItem(item.id)}
              style={{ background: 'none', border: 'none', color: 'var(--sf-text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px' }}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="sf-cart-footer">
        <div className="sf-cart-subtotal">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <a href={getLink('/storefront/checkout')} className="sf-btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '10px' }}>
          Checkout →
        </a>
        <button className="sf-btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={close}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

// ── StorefrontLayout wrapper ─────────────────────────────────────────────
interface LayoutProps {
  storeName: string;
  children: ReactNode;
  themeData?: any;
  apiKey?: string | null;
}

export function StorefrontLayout({ storeName, children, themeData, apiKey }: LayoutProps) {
  const [theme, setTheme] = useState<any>(() => {
    if (themeData) {
      return normalizeThemeLayout({
        ...DEFAULT_THEME,
        ...themeData,
        storeName: themeData.storeName || storeName || DEFAULT_THEME.storeName,
      });
    }
    return normalizeThemeLayout({
      ...DEFAULT_THEME,
      storeName: storeName || DEFAULT_THEME.storeName,
    });
  });
  
  useThemeBridge(setTheme);

  // Global WYSIWYG click-to-focus customizer elements bridge
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Only register handlers when inside the builder preview frame
    const isInsideBuilder = window.location.search.includes('projectId=') || window.location.search.includes('templateId=');
    if (!isInsideBuilder) return;

    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editableEl = target.closest('[data-orcayo-field]') as HTMLElement | null;
      if (editableEl) {
        const fieldName = editableEl.getAttribute('data-orcayo-field');
        if (fieldName) {
          e.preventDefault();
          e.stopPropagation();
          window.parent.postMessage({
            type: 'orcayo:field-selected',
            field: fieldName,
          }, '*');
          
          editableEl.focus();
        }
      }
    };

    const blurHandler = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.hasAttribute('data-orcayo-field')) {
        const fieldName = target.getAttribute('data-orcayo-field');
        const textContent = target.innerText || target.textContent || '';
        if (fieldName) {
          window.parent.postMessage({
            type: 'orcayo:field-update',
            field: fieldName,
            value: textContent.trim(),
          }, '*');
        }
      }
    };

    const hoverHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editableEl = target.closest('[data-orcayo-field]') as HTMLElement | null;
      if (editableEl && editableEl.getAttribute('contenteditable') !== 'true') {
        editableEl.setAttribute('contenteditable', 'true');
      }
    };

    const makeAllFieldsEditable = () => {
      document.querySelectorAll('[data-orcayo-field]').forEach((el) => {
        if (el.getAttribute('contenteditable') !== 'true') {
          el.setAttribute('contenteditable', 'true');
        }
      });
    };

    document.body.addEventListener('click', clickHandler, true);
    document.body.addEventListener('blur', blurHandler, true);
    document.body.addEventListener('mouseover', hoverHandler, true);
    
    makeAllFieldsEditable();
    const intervalId = setInterval(makeAllFieldsEditable, 1000);

    const styleEl = document.createElement('style');
    styleEl.id = 'orcayo-hover-styles';
    styleEl.innerHTML = `
      [data-orcayo-field] {
        cursor: pointer !important;
        position: relative !important;
        transition: outline 0.15s ease-in-out, box-shadow 0.15s ease-in-out !important;
      }
      [data-orcayo-field]:hover {
        outline: 2px dashed #6366f1 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.15) !important;
      }
      [data-orcayo-field]::after {
        content: "✏️ Click to Edit" !important;
        position: absolute !important;
        top: -24px !important;
        right: 0 !important;
        background: #6366f1 !important;
        color: #fff !important;
        font-size: 10px !important;
        font-family: sans-serif !important;
        font-weight: bold !important;
        padding: 2px 6px !important;
        border-radius: 4px !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.15s ease-in-out !important;
        z-index: 99999 !important;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
        white-space: nowrap !important;
      }
      [data-orcayo-field]:hover::after {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      document.body.removeEventListener('click', clickHandler, true);
      document.body.removeEventListener('blur', blurHandler, true);
      document.body.removeEventListener('mouseover', hoverHandler, true);
      clearInterval(intervalId);
      const style = document.getElementById('orcayo-hover-styles');
      if (style) style.remove();
    };
  }, []);

  // Save the apiKey in localStorage on mount if passed
  useEffect(() => {
    if (apiKey) {
      setBuilderApiKey(apiKey);
    }
  }, [apiKey]);

  // Sync loaded themeData changes
  useEffect(() => {
    if (themeData) {
      const isInsideBuilder = typeof window !== 'undefined' && (
        window.location.search.includes('projectId=') || 
        window.location.search.includes('templateId=') ||
        window.parent !== window
      );
      
      if (isInsideBuilder) {
        // Only set theme if it hasn't been initialized or if the theme/project context ID changed
        setTheme((prev: any) => {
          if (!prev || Object.keys(prev).length === 0 || prev === DEFAULT_THEME || prev.themeId !== themeData.themeId) {
            return normalizeThemeLayout(themeData);
          }
          return prev;
        });
      } else {
        setTheme(normalizeThemeLayout(themeData));
      }
      
      const cssVars = themeToCSS(themeData);
      document.documentElement.setAttribute('style', cssVars);
    }
  }, [themeData]);

  // Propagate storeId to client-side API state so all
  // cart / checkout / order calls carry the correct tenant x-store-id header.
  useEffect(() => {
    const sid = (theme as any)?.storeId;
    if (sid) setClientStoreId(sid);
  }, [(theme as any)?.storeId]);

  const finalStoreName = theme?.storeName || storeName || DEFAULT_THEME.storeName;

  return (
    <StorefrontThemeContext.Provider value={{ theme }}>
      <CartProvider>
        <AuthProvider>
          <StorefrontHeader storeName={finalStoreName} />
          <main>{children}</main>
          <CartDrawer />
          <StorefrontFooter storeName={finalStoreName} />
        </AuthProvider>
      </CartProvider>
    </StorefrontThemeContext.Provider>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────
export function StorefrontFooter({ storeName }: { storeName: string }) {
  const { theme } = useStorefrontTheme();
  const getLink = useStorefrontLink();
  const footerCols = theme?.footerMenuCols || [];
  const footerLayout = theme?.footerLayout || 'default';

  const footerClasses = [
    'sf-footer',
    `sf-footer--${footerLayout}`,
  ].filter(Boolean).join(' ');

  return (
    <footer className={footerClasses}>
      <div className="sf-container">
        {footerLayout === 'minimal' ? (
          <div className="sf-footer-minimal-row">
            <a href={getLink('/storefront')} className="sf-logo">{storeName}</a>
            <nav className="sf-footer-nav-minimal">
              {footerCols[0]?.links?.map((link: any) => (
                <a key={link.id} href={getLink(link.url)}>{link.label}</a>
              ))}
            </nav>
            <div className="sf-footer-copyright-minimal">
              © {new Date().getFullYear()} {storeName}
            </div>
          </div>
        ) : (
          <>
            <div className="sf-footer-grid">
              <div className="sf-footer-col sf-footer-brand">
                <a href={getLink('/storefront')} className="sf-logo" style={{ display: 'inline-block', marginBottom: '16px' }}>{storeName}</a>
                <p>Premium products, seamless shopping experience powered by Orcayo.</p>
              </div>
              {footerCols.length > 0 ? (
                footerCols.map((col: any) => (
                  <div key={col.id} className="sf-footer-col">
                    <h4>{col.title}</h4>
                    {col.links?.map((link: any) => (
                      <a key={link.id} href={getLink(link.url)}>
                        {link.label}
                      </a>
                    ))}
                  </div>
                ))
              ) : (
                <>
                  <div className="sf-footer-col">
                    <h4>Shop</h4>
                    <a href={getLink('/storefront/products')}>All Products</a>
                    <a href={getLink('/storefront/products?new=true')}>New Arrivals</a>
                    <a href={getLink('/storefront/products?sale=true')}>Sale</a>
                  </div>
                  <div className="sf-footer-col">
                    <h4>Account</h4>
                    <a href={getLink('/storefront/account')}>My Account</a>
                    <a href={getLink('/storefront/account/orders')}>Orders</a>
                    <a href={getLink('/storefront/account/tracking')}>Track Order</a>
                  </div>
                  <div className="sf-footer-col">
                    <h4>Support</h4>
                    <a href={getLink('/storefront/contact')}>Contact Us</a>
                    <a href={getLink('/storefront/faq')}>FAQ</a>
                    <a href={getLink('/storefront/returns')}>Returns</a>
                  </div>
                </>
              )}
            </div>
            <div className="sf-footer-bottom">
              <span>© {new Date().getFullYear()} {storeName}. All rights reserved.</span>
              <span>Powered by Orcayo</span>
            </div>
          </>
        )}
      </div>
    </footer>
  );
}
