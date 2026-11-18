import { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router';
import type { Route } from '../+types/root';
import { products as productsApi, getProductName, getProductPrice, getProductImage, getProductImages } from '../lib/api';
import type { Product } from '../lib/api';
import { StorefrontLayout, useCart, useStorefrontLink, useStorefrontTheme } from '../storefront/StorefrontLayout';
import { resolveProject } from '../lib/project.server';
import '../storefront/storefront.css';

export async function loader({ params, request }: { params: { projectId: string; slug: string }; request: Request }) {
  const resolved = await resolveProject(request, params.projectId);
  if (!resolved) throw new Response('Not Found', { status: 404 });

  let product: Product | null = null;
  try {
    product = await productsApi.getBySlug(params.slug, resolved.storeId, resolved.apiKey);
  } catch {
    try { product = await productsApi.get(params.slug, resolved.storeId, resolved.apiKey); } catch {}
  }

  if (!product) throw new Response('Product not found', { status: 404 });
  return { product, storeName: resolved.storeName, themeData: resolved.themeData, apiKey: resolved.apiKey };
}

export function meta({ data }: { data: any }) {
  return [{ title: `${data?.product ? getProductName(data.product) : 'Product'} — Store` }];
}

function ProductDetailContent({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { projectId } = useParams();
  const getLink = useStorefrontLink();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setVariant] = useState(product.variants?.[0]?.id ?? null);
  const [added, setAdded] = useState(false);

  const images = getProductImages(product);
  const mainImage = images[activeImg] || '';
  const displayName = getProductName(product);
  const basePrice = getProductPrice(product);
  const price = product.variants?.find((v: any) => v.id === selectedVariant)?.price ?? basePrice;

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
        <div className="sf-product-gallery">
          <div className="sf-gallery-main">
            {mainImage ? <img src={mainImage} alt={displayName} /> : '🛍️'}
          </div>
          {images.length > 1 && (
            <div className="sf-gallery-thumbs">
              {images.map((img: string, i: number) => (
                <div key={i} className={`sf-gallery-thumb${activeImg === i ? ' active' : ''}`} onClick={() => setActiveImg(i)}>
                  <img src={img} alt={`${displayName} ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sf-product-meta">
          <div style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)', marginBottom: '8px' }}>
            <Link to={getLink(`/pub/${projectId}`)} style={{ color: 'var(--sf-text-muted)', textDecoration: 'none' }}>Home</Link>
            {' / '}<Link to={getLink(`/pub/${projectId}/products`)} style={{ color: 'var(--sf-text-muted)', textDecoration: 'none' }}>Products</Link>
            {' / '}<span style={{ color: 'var(--sf-text)' }}>{displayName}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--sf-font-heading)', fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>{displayName}</h1>
          <div className="sf-price-block" style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--sf-primary)' }}>${(+(price??0)).toFixed(2)}</span>
            {product.compareAtPrice && <span className="sf-product-compare" style={{ fontSize: '1.1rem', marginLeft: '12px' }}>${(+((product as any)?.compareAtPrice??0)).toFixed(2)}</span>}
          </div>
          <p style={{ color: 'var(--sf-text-secondary)', lineHeight: 1.8, marginBottom: '28px' }}>{product.description}</p>
          {product.variants && product.variants.length > 0 && (product.variants.length > 1 || (product.variants[0].name !== 'Default' && product.variants[0].name !== 'default')) && (
            <div style={{ marginBottom: '20px' }}>
              <label className="sf-label">Option</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.variants.map((v: any) => (
                  <button key={v.id}
                    onClick={() => setVariant(v.id)}
                    style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                             background: selectedVariant === v.id ? 'var(--sf-primary)' : 'var(--sf-surface)',
                             border: `1px solid ${selectedVariant === v.id ? 'var(--sf-primary)' : 'rgba(255,255,255,0.1)'}`,
                             color: selectedVariant === v.id ? '#fff' : 'var(--sf-text)' }}>
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
            <div className="sf-qty-control">
              <button className="sf-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="sf-qty-val">{qty}</span>
              <button className="sf-qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <button 
              className="sf-btn-primary" 
              style={{ 
                flex: 1, 
                justifyContent: 'center',
                opacity: product.inStock === false ? 0.5 : 1,
                cursor: product.inStock === false ? 'not-allowed' : 'pointer'
              }} 
              onClick={handleAddToCart}
              disabled={product.inStock === false}
            >
              {product.inStock === false ? '⚠ Out of Stock' : added ? '✓ Added to Cart' : '🛒 Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

export default function PubProductDetail({ loaderData }: Route.ComponentProps) {
  const { product: loaderProduct, storeName, themeData, apiKey } = loaderData as any;
  const location = useLocation();
  const rawProduct = (location.state as any)?.product || loaderProduct;
  const product = rawProduct?.data || rawProduct;

  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <ProductDetailContent product={product} />
    </StorefrontLayout>
  );
}


