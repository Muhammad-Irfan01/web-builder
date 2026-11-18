/**
 * SSR Products Listing — /storefront/products
 * Paginated, filterable product catalog with search.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import type { Route } from '../+types/root';
import { products as productsApi, getProductName, getProductPrice, getProductImage } from '../lib/api';
import type { Product } from '../lib/api';
import { StorefrontLayout, useCart, useStorefrontLink, useStorefrontTheme } from '../storefront/StorefrontLayout';
import '../storefront/storefront.css';



export async function loader({ request }: { request: Request }) {
  const url      = new URL(request.url);
  const page     = Number(url.searchParams.get('page') ?? 1);
  const search   = url.searchParams.get('search') ?? '';
  const category = url.searchParams.get('categoryId') ?? '';

  const { resolveStorefrontContext } = await import('../lib/project.server');
  const { storeId, apiKey, themeData, storeName } = await resolveStorefrontContext(request);

  try {
    const result = await productsApi.list(
      { page, limit: 12, search: search || undefined, categoryId: category || undefined },
      apiKey,
      storeId,
    );
    return { products: result.data, total: result.total, page, search, storeName,
             themeData, apiKey };
  } catch {
    return { products: [], total: 0, page: 1, search: '', storeName,
             themeData, apiKey };
  }
}

export function meta() {
  return [
    { title: 'All Products — Orcayo Store' },
    { name: 'description', content: 'Browse our full collection of premium products.' },
  ];
}

function ProductsListingContent({ 
  products, 
  total, 
  page, 
  initSearch, 
  searchInput, 
  setSearchInput, 
  handleSearch 
}: { 
  products: Product[]; 
  total: number; 
  page: number; 
  initSearch: string; 
  searchInput: string; 
  setSearchInput: (v: string) => void; 
  handleSearch: (e: React.FormEvent) => void; 
}) {
  const { addItem } = useCart();
  const getLink = useStorefrontLink();
  const { theme } = useStorefrontTheme();

  const subpageStyle: React.CSSProperties = {
    transition: 'all 0.3s ease',
  };
  if (theme?.productsPageBgOverride) subpageStyle.background = theme.productsPageBgOverride;
  if (theme?.productsPageBgGradient) subpageStyle.background = theme.productsPageBgGradient;
  if (theme?.productsPageTextColorOverride) subpageStyle.color = theme.productsPageTextColorOverride;
  if (theme?.productsPageFontSizeOverride) subpageStyle.fontSize = theme.productsPageFontSizeOverride;

  return (
    <div style={subpageStyle} className="sf-section-override">
      <div className="sf-container">
      <div className="sf-section">
        {/* Header */}
        <div className="sf-section-header">
          <div className="sf-section-title">All Products</div>
          <div className="sf-section-sub">{total} products available</div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: '40px', display: 'flex', gap: '12px', maxWidth: '520px' }}>
          <input
            className="sf-input"
            style={{ margin: 0 }}
            type="text"
            placeholder="Search products…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" className="sf-btn-primary" style={{ whiteSpace: 'nowrap' }}>
            Search
          </button>
        </form>

        {/* Grid */}
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--sf-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <p>No products found{initSearch ? ` for "${initSearch}"` : ''}.</p>
            {initSearch && <Link to={getLink('/storefront/products')} className="sf-btn-outline" style={{ marginTop: '20px', display: 'inline-block' }}>Clear Search</Link>}
          </div>
        ) : (
          <div className="sf-products-grid">
            {products.map((p: Product) => {
              const name = getProductName(p);
              const price = getProductPrice(p);
              const imgUrl = getProductImage(p);
              return (
                <div className="sf-product-card" key={p.id}>
                  <Link 
                    to={getLink(`/storefront/product/${p.slug ?? p.id}`)} 
                    state={{ product: p }}
                    style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}
                  >
                    {imgUrl
                      ? <img className="sf-product-img" src={imgUrl} alt={name} loading="lazy" />
                      : <div className="sf-product-img-placeholder">🛍️</div>
                    }
                    <div className="sf-product-info">
                      <div className="sf-product-name">{name}</div>
                      <div className="sf-product-desc">{p.description?.slice(0, 80)}{p.description && p.description.length > 80 ? '…' : ''}</div>
                      <div className="sf-product-footer">
                        <div>
                          <span className="sf-product-price">${price.toFixed(2)}</span>
                        </div>
                        <button
                          className="sf-add-btn"
                          onClick={e => { e.preventDefault(); addItem(p.id, name, price, imgUrl); }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

        )}

        {/* Pagination */}
        {total > 12 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '48px' }}>
            {page > 1 && (
              <Link to={getLink(`/storefront/products?page=${page - 1}`)} className="sf-btn-outline">← Previous</Link>
            )}
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: 'var(--sf-text-muted)' }}>
              Page {page} of {Math.ceil(total / 12)}
            </span>
            {page < Math.ceil(total / 12) && (
              <Link to={getLink(`/storefront/products?page=${page + 1}`)} className="sf-btn-outline">Next →</Link>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default function ProductsListing({ loaderData }: Route.ComponentProps) {
  const { products, total, page, search: initSearch, storeName, themeData, apiKey } = loaderData as any;
  const [searchInput, setSearchInput] = useState(initSearch ?? '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set('search', searchInput);
    url.searchParams.delete('page');
    window.location.href = url.toString();
  };

  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <ProductsListingContent 
        products={products}
        total={total}
        page={page}
        initSearch={initSearch}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
      />
    </StorefrontLayout>
  );
}
