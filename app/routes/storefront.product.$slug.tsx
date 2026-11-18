/**
 * SSR Product Detail Page — /storefront/product/:slug
 * Resolves by slug first, falls back to ID.
 * Secure: injects x-store-id on all API calls via lib/api.ts
 */
import { useState } from 'react';
import { useLocation, Link } from 'react-router';
import type { Route } from '../+types/root';
import { products as productsApi, getProductName, getProductPrice, getProductImage, getProductImages } from '../lib/api';
import type { Product } from '../lib/api';
import { StorefrontLayout, useCart, useStorefrontLink, useStorefrontTheme } from '../storefront/StorefrontLayout';
import '../storefront/storefront.css';

// ── SSR Loader ────────────────────────────────────────────────────────────
export async function loader({ params, request }: { params: { slug: string }; request: Request }) {
  const { slug } = params;
  let product: Product | null = null;

  const { resolveStorefrontContext } = await import('../lib/project.server');
  const { storeId, apiKey, themeData, storeName } = await resolveStorefrontContext(request);

  try {
    // 1. Try by slug first (preferred for SEO)
    product = await productsApi.getBySlug(slug, storeId, apiKey);
  } catch (e: any) {
    if (e.status !== 404) {
      console.warn(`[Product Detail] Slug lookup failed with ${e.status} for ${slug}, trying ID lookup...`);
    }
    
    // 2. Fallback to ID lookup (for backward compatibility)
    try {
      product = await productsApi.get(slug, storeId, apiKey);
    } catch (e2: any) {
      console.error(`[Product Detail] Both slug and ID lookup failed for ${slug}. Final error:`, e2.message);
      product = null;
    }
  }


  if (!product) {
    throw new Response(`Product with slug or ID "${slug}" not found in your store.`, { status: 404 });
  }
  return { product, storeName, themeData, apiKey };
}

export function meta({ data }: { data: { product: Product } | null }) {
  const name = data?.product ? getProductName(data.product) : 'Product';
  return [
    { title: `${name} — Orcayo Store` },
    { name: 'description', content: data?.product?.description?.slice(0, 155) ?? '' },
  ];
}

function ProductDetailContent({ product }: { product: Product }) {
  const { addItem } = useCart();
  const getLink = useStorefrontLink();

  const [qty, setQty]               = useState(1);
  const [activeImg, setActiveImg]   = useState(0);
  const [selectedVariant, setVariant] = useState(product.variants?.[0]?.id ?? null);
  const [added, setAdded]           = useState(false);

  const images = getProductImages(product);
  const mainImage = images[activeImg] || '';
  const displayName = getProductName(product);
  const basePrice = getProductPrice(product);
  const price = product.variants?.find(v => v.id === selectedVariant)?.price ?? basePrice;

  const handleAddToCart = async () => {
    for (let i = 0; i < qty; i++) {
      await addItem(product.id, displayName, price, mainImage, selectedVariant ?? undefined);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const { theme } = useStorefrontTheme();

  const subpageStyle: React.CSSProperties = {
    transition: 'all 0.3s ease',
  };
  if (theme?.productDetailPageBgOverride) subpageStyle.background = theme.productDetailPageBgOverride;
  if (theme?.productDetailPageBgGradient) subpageStyle.background = theme.productDetailPageBgGradient;
  if (theme?.productDetailPageTextColorOverride) subpageStyle.color = theme.productDetailPageTextColorOverride;
  if (theme?.productDetailPageFontSizeOverride) subpageStyle.fontSize = theme.productDetailPageFontSizeOverride;

  return (
    <div style={subpageStyle} className="sf-section-override">
      <div className="sf-container">
        <div className="sf-product-detail">
        {/* ── Gallery ────────────────────────────────────────────────── */}
        <div className="sf-product-gallery">
          <div className="sf-gallery-main">
            {mainImage ? <img src={mainImage} alt={displayName} /> : '🛍️'}
          </div>
          {images.length > 1 && (
            <div className="sf-gallery-thumbs">
              {images.map((img: string, i: number) => (
                <div
                  key={i}
                  className={`sf-gallery-thumb${activeImg === i ? ' active' : ''}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={img} alt={`${displayName} ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Meta ──────────────────────────────────────────── */}
        <div className="sf-product-meta">
          {/* Breadcrumb */}
          <div style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)' }}>
            <Link to={getLink('/storefront')} style={{ color: 'var(--sf-text-muted)', textDecoration: 'none' }}>Home</Link>
            {' / '}
            <Link to={getLink('/storefront/products')} style={{ color: 'var(--sf-text-muted)', textDecoration: 'none' }}>Products</Link>
            {' / '}
            <span style={{ color: 'var(--sf-text)' }}>{displayName}</span>
          </div>

          <div>
            <h1 style={{ fontFamily: 'var(--sf-font-heading)', fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
              {displayName}
            </h1>
            {product.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: '#fbbf24' }}>{'★'.repeat(Math.round(product.rating))}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--sf-text-muted)' }}>
                  {(+((product as any)?.rating??0)).toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            )}
          </div>

          <div className="sf-product-pricing">
            <span className="sf-price-main">${(+(price??0)).toFixed(2)}</span>
            {product.compareAtPrice && (
              <span className="sf-price-compare">${(+((product as any)?.compareAtPrice??0)).toFixed(2)}</span>
            )}
            {product.compareAtPrice && (
              <span style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '99px' }}>
                Save ${(product.compareAtPrice - price).toFixed(2)}
              </span>
            )}
          </div>

          <p className="sf-product-desc-full">{product.description}</p>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (product.variants.length > 1 || (product.variants[0].name !== 'Default' && product.variants[0].name !== 'default')) && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sf-text-muted)', marginBottom: '10px' }}>
                Options
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVariant(v.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: `1px solid ${selectedVariant === v.id ? 'var(--sf-primary)' : 'color-mix(in srgb, var(--sf-primary) 20%, transparent)'}`,
                      background: selectedVariant === v.id ? 'color-mix(in srgb, var(--sf-primary) 15%, transparent)' : 'transparent',
                      color: 'var(--sf-text)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + Add to Cart */}
          <div className="sf-qty-row">
            <div className="sf-qty-control">
              <button className="sf-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="sf-qty-val">{qty}</span>
              <button className="sf-qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <button
              className="sf-add-cart-btn"
              onClick={handleAddToCart}
              disabled={product.inStock === false}
              style={product.inStock === false ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              {product.inStock === false ? '⚠ Out of Stock' : added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
            </button>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '8px' }}>
            {['🚚 Free shipping over $50', '🔒 Secure checkout', '↩ 30-day returns'].map(b => (
              <span key={b} style={{ fontSize: '0.78rem', color: 'var(--sf-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
  const { product: loaderProduct, storeName, themeData, apiKey } = loaderData as unknown as { product: Product; storeName: string; themeData: any; apiKey: string | null };
  const location = useLocation();
  const rawProduct = (location.state as any)?.product || loaderProduct;
  const product = rawProduct?.data || rawProduct;

  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <ProductDetailContent product={product} />
    </StorefrontLayout>
  );
}
