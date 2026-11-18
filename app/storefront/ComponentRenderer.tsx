import { Link } from 'react-router';
import type { ComponentNode } from '../lib/component-tree';
import { canHaveChildren, nodeSettingsToStyle } from '../lib/component-tree';
import { getProductImage, getProductName, getProductPrice, type Product } from '../lib/api';
import { useCart, useStorefrontLink } from './StorefrontLayout';

interface RendererData {
  products: Product[];
  staff: any[];
  slots: any[];
  storeName: string;
}

export function ComponentRenderer({ node, data }: { node: ComponentNode; data: RendererData }) {
  if (!node.visible) return null;
  const settings = node.settings || {};
  const style = nodeSettingsToStyle(settings);
  const children = node.children?.map((child) => <ComponentRenderer key={child.id} node={child} data={data} />);
  const getLink = useStorefrontLink();

  switch (node.type) {
    case 'container':
      return (
        <section className={`sf-tree-container preset-${settings.preset || 'custom'}`} style={style} data-orcayo-node={node.id}>
          <div className="sf-container" style={{ maxWidth: (settings.maxWidth as string) || undefined }}>
            {children}
          </div>
        </section>
      );
    case 'row':
      return <div className="sf-tree-row" style={{ display: 'flex', gap: '24px', ...style }} data-orcayo-node={node.id}>{children}</div>;
    case 'column':
      return <div className="sf-tree-column" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, ...style }} data-orcayo-node={node.id}>{children}</div>;
    case 'headline': {
      const Tag = (settings.tag as any) || 'h2';
      return <Tag style={style} data-orcayo-field={`layout.${node.id}.settings.text`}>{String(settings.text || 'Headline')}</Tag>;
    }
    case 'paragraph':
      return <p style={{ lineHeight: 1.7, ...style }} data-orcayo-field={`layout.${node.id}.settings.text`}>{String(settings.text || 'Paragraph text')}</p>;
    case 'button':
      return (
        <a
          href={getLink(String(settings.link || '/storefront/products'))}
          className="sf-btn-primary"
          style={{
            display: 'inline-block',
            backgroundColor: String(settings.color || 'var(--sf-primary)'),
            color: String(settings.textColor || '#ffffff'),
            borderRadius: String(settings.borderRadius || 'var(--sf-btn-radius)'),
            textDecoration: 'none',
            ...style,
          }}
          data-orcayo-field={`layout.${node.id}.settings.text`}
        >
          {String(settings.text || 'Button')}
        </a>
      );
    case 'image':
      return (
        <img
          src={String(settings.url || settings.src || '')}
          alt={String(settings.alt || node.label)}
          style={{ maxWidth: '100%', height: 'auto', objectFit: 'cover', ...style }}
          data-orcayo-field={`layout.${node.id}.settings.url`}
        />
      );
    case 'spacer':
      return <div style={{ height: `${settings.height || 40}px` }} data-orcayo-node={node.id} />;
    case 'divider':
      return <hr style={{ border: 0, borderTop: `1px solid ${settings.borderColor || 'color-mix(in srgb, var(--sf-text) 12%, transparent)'}`, ...style }} data-orcayo-node={node.id} />;
    case 'custom-code':
      return <div style={style} dangerouslySetInnerHTML={{ __html: String(settings.html || '') }} data-orcayo-node={node.id} />;
    case 'featured-products':
      return <FeaturedProductsNode node={node} products={data.products} />;
    case 'categories':
      return <CategoriesNode node={node} />;
    case 'booking-calendar':
      return <BookingNode node={node} products={data.products} staff={data.staff} slots={data.slots} />;
    case 'testimonials':
      return <TestimonialsNode node={node} />;
    case 'services-list':
      return <ServicesNode node={node} />;
    case 'footer':
      return null;
    default:
      return canHaveChildren(node.type) ? <>{children}</> : null;
  }
}

function FeaturedProductsNode({ node, products }: { node: ComponentNode; products: Product[] }) {
  const count = Number(node.settings.count || 8);
  const displayProducts = products.slice(0, count);
  const getLink = useStorefrontLink();
  return (
    <section className="sf-section" data-orcayo-node={node.id}>
      <div className="sf-container">
        <div className="sf-section-header">
          <div className="sf-section-title">{String(node.settings.title || 'Featured Products')}</div>
          <div className="sf-section-sub">{String(node.settings.subtitle || 'Hand-picked favourites, just for you')}</div>
        </div>
        <div className="sf-products-grid">
          {displayProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link to={getLink('/storefront/products')} className="sf-btn-outline">View All Products</Link>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const getLink = useStorefrontLink();
  const name = getProductName(product);
  const price = getProductPrice(product);
  const img = getProductImage(product);
  return (
    <div className="sf-product-card">
      <Link to={getLink(`/storefront/product/${product.slug ?? product.id}`)} state={{ product }} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {img ? <img className="sf-product-img" src={img} alt={name} loading="lazy" /> : <div className="sf-product-img-placeholder">Store item</div>}
        <div className="sf-product-info">
          <div className="sf-product-name">{name}</div>
          <div className="sf-product-footer">
            <span className="sf-product-price">${price.toFixed(2)}</span>
            <button className="sf-add-btn" onClick={(e) => { e.preventDefault(); addItem(product.id, name, price, img); }}>+ Add</button>
          </div>
        </div>
      </Link>
    </div>
  );
}

function CategoriesNode({ node }: { node: ComponentNode }) {
  const getLink = useStorefrontLink();
  const categories = (node.settings.categories as any[]) || ['Wellness & Beauty', 'Modern Accessories', 'Apparel', 'Home Decor'];
  return (
    <section className="sf-section" data-orcayo-node={node.id}>
      <div className="sf-container">
        <div className="sf-section-header centered">
          <div className="sf-section-title">{String(node.settings.title || 'Shop by Category')}</div>
          <div className="sf-section-sub">{String(node.settings.subtitle || 'Find exactly what you need')}</div>
        </div>
        <div className="sf-tree-category-list">
          {categories.map((category: any, index) => {
            const name = typeof category === 'string' ? category : category.name;
            return <Link key={`${name}-${index}`} to={getLink(`/storefront/products?category=${encodeURIComponent(name)}`)}>{name}</Link>;
          })}
        </div>
      </div>
    </section>
  );
}

function BookingNode({ node }: { node: ComponentNode; products: Product[]; staff: any[]; slots: any[] }) {
  return (
    <section className="sf-section" data-orcayo-node={node.id}>
      <div className="sf-container">
        <div className="sf-section-header centered">
          <div className="sf-section-title">{String(node.settings.title || 'Online Booking & Services')}</div>
          <div className="sf-section-sub">{String(node.settings.subtitle || 'Open the booking page to reserve a service')}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <a className="sf-btn-primary" href="/storefront/bookings">Book Appointment</a>
        </div>
      </div>
    </section>
  );
}

function TestimonialsNode({ node }: { node: ComponentNode }) {
  const testimonials = (node.settings.testimonials as any[]) || [
    { name: 'Sarah M.', text: 'Absolutely love the quality and the fast shipping.', stars: 5 },
    { name: 'James K.', text: 'Incredible store experience.', stars: 5 },
    { name: 'Priya L.', text: 'Smooth checkout and exactly as described.', stars: 5 },
  ];
  return (
    <section className="sf-section" data-orcayo-node={node.id}>
      <div className="sf-container">
        <div className="sf-section-header centered">
          <div className="sf-section-title">{String(node.settings.title || 'What Customers Say')}</div>
        </div>
        <div className="sf-testimonials-grid">
          {testimonials.map((t, i) => (
            <div className="sf-testimonial-card" key={i}>
              <div className="sf-stars">{'★'.repeat(Number(t.stars || 5))}</div>
              <p className="sf-testimonial-text">"{t.text}"</p>
              <div className="sf-testimonial-author">{t.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesNode({ node }: { node: ComponentNode }) {
  const services = (node.settings.services as any[]) || [];
  return (
    <section className="sf-section" data-orcayo-node={node.id}>
      <div className="sf-container">
        <div className="sf-section-header centered">
          <div className="sf-section-title">{String(node.settings.title || 'Our Services')}</div>
          <div className="sf-section-sub">{String(node.settings.subtitle || 'Explore our signature services')}</div>
        </div>
        <div className="sf-tree-services">
          {services.map((service, index) => (
            <div className="glass" key={index}>
              <strong>{service.name}</strong>
              <span>{service.price}</span>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
