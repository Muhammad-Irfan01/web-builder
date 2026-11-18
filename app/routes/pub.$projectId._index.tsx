/**
 * Standalone Published Storefront — /pub/:projectId
 *
 * This is the pristine customer-facing homepage for a published merchant site.
 * Served at both:
 *   • http://localhost:3030/pub/:projectId   (development / hosted SaaS)
 *   • https://customerdomain.com/            (custom domain via host-header routing)
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import type { Route } from '../+types/root';
import { products as productsApi, teams as teamsApi, bookings as bookingsApi, getProductName, getProductPrice, getProductImage } from '../lib/api';
import type { Product } from '../lib/api';
import { StorefrontLayout, useCart, useStorefrontTheme, useStorefrontLink } from '../storefront/StorefrontLayout';
import { ComponentRenderer } from '../storefront/ComponentRenderer';
import { resolveProject } from '../lib/project.server';
import '../storefront/storefront.css';


// ── SSR Loader ─────────────────────────────────────────────────────────────
export async function loader({ params, request }: { params: { projectId: string }; request: Request }) {
  const resolved = await resolveProject(request, params.projectId);

  if (!resolved) throw new Response('Published site not found', { status: 404 });

  let featuredProducts: Product[] = [];
  try {
    const { data } = await productsApi.list({ limit: 8 }, resolved.apiKey, resolved.storeId);
    featuredProducts = data;
  } catch {}

  let staffList: any[] = [];
  try {
    const fetchedStaff = await teamsApi.listStaff(resolved.storeId, resolved.apiKey) as any;
    staffList = fetchedStaff?.data || (Array.isArray(fetchedStaff) ? fetchedStaff : []);
  } catch (e) {
    console.error("Failed to load staff in published home loader:", e);
  }

  let slotsList: any[] = [];
  try {
    const fetchedSlots = await bookingsApi.listSlots(resolved.storeId, resolved.apiKey) as any;
    slotsList = fetchedSlots?.data || (Array.isArray(fetchedSlots) ? fetchedSlots : []);
  } catch (e) {
    console.error("Failed to load slots in published home loader:", e);
  }

  return {
    products: featuredProducts,
    storeName: resolved.storeName,
    themeData: resolved.themeData,
    apiKey: resolved.apiKey,
    projectId: resolved.id,
    staff: staffList,
    slots: slotsList,
  };
}

export function meta({ data }: { data: any }) {
  const name = data?.storeName ?? 'Store';
  return [
    { title: name },
    { name: 'description', content: `Welcome to ${name}. Shop premium products online.` },
  ];
}

// ── Home Component ─────────────────────────────────────────────────────────
export default function PubHome({ loaderData }: Route.ComponentProps) {
  const { products, storeName, themeData, apiKey, staff, slots } = loaderData as any;

  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <PubHomeContent products={products} storeName={storeName} staff={staff} slots={slots} />
    </StorefrontLayout>
  );
}

function PubHomeContent({ products, storeName, staff, slots }: { products: Product[]; storeName: string; staff: any[]; slots: any[] }) {
  const { theme } = useStorefrontTheme();

  // If project has GrapesJS compiled HTML/CSS, render it with full fidelity
  if (theme?.version === 'grapesjs-v1' && theme?.html) {
    return (
      <div className="grapesjs-storefront-wrapper">
        {theme.css && <style dangerouslySetInnerHTML={{ __html: theme.css }} />}
        <div dangerouslySetInnerHTML={{ __html: theme.html }} />
      </div>
    );
  }

  const activeLayout = theme?.layout || [];
  const activeSections = theme?.sections || [];

  return (
    <>
      {activeLayout.length > 0 ? activeLayout.map((node: any) => (
        <ComponentRenderer key={node.id} node={node} data={{ products, staff, slots, storeName: theme?.storeName || storeName }} />
      )) : activeSections.map((section: any) => {
        if (!section.visible) return null;

        // Custom style overrides
        const sectionStyle: React.CSSProperties = {
          transition: 'all 0.3s ease',
        };
        if (section.settings?.bgOverride) {
          sectionStyle.background = section.settings.bgOverride;
        }
        if (section.settings?.bgGradient) {
          sectionStyle.background = section.settings.bgGradient;
        }
        if (section.settings?.textColorOverride) {
          sectionStyle.color = section.settings.textColorOverride;
        }
        if (section.settings?.fontSizeOverride) {
          sectionStyle.fontSize = section.settings.fontSizeOverride;
        }

        let component = null;

        switch (section.type) {
          case 'hero':
            component = (
              <HeroSection
                storeName={theme?.storeName || storeName}
                headline={theme?.heroHeadline}
                subheadline={theme?.heroSubheadline}
                image={theme?.heroImage}
                section={section}
              />
            );
            break;
          case 'categories':
            component = <CategoriesSection />;
            break;
          case 'featured-products':
            component = <FeaturedProductsSection products={products} settings={section.settings} />;
            break;
          case 'booking-calendar':
            component = <BookingCalendarSection products={products} staff={staff} slots={slots} />;
            break;
          case 'testimonials':
            component = <TestimonialsSection />;
            break;
          case 'cta-banner':
            component = <CTASection section={section} settings={section.settings} />;
            break;
          case 'rich-text':
            component = <RichTextSection section={section} settings={section.settings} />;
            break;
          case 'custom-button':
            component = <CustomButtonSection settings={section.settings} />;
            break;
          case 'typography':
            component = <TypographySection settings={section.settings} />;
            break;
          case 'custom-image':
            component = <CustomImageSection settings={section.settings} />;
            break;
          case 'custom-card':
            component = <CustomCardSection settings={section.settings} />;
            break;
          case 'services-list':
            component = <ServicesListSection settings={section.settings} />;
            break;
          case 'spacer':
            component = <SpacerSection settings={section.settings} />;
            break;
          default:
            component = null;
        }

        if (!component) return null;

        return (
          <div key={section.id} style={sectionStyle} className="sf-section-override">
            {component}
          </div>
        );
      })}
    </>
  );
}

// ── Hero Section ───────────────────────────────────────────────────────────
function HeroSection({ storeName, headline, subheadline, image, section }: {
  storeName: string; headline?: string; subheadline?: string; image?: string; section?: any;
}) {
  const getLink = useStorefrontLink();
  const hasBlocks = section && section.blocks && section.blocks.length > 0;

  return (
    <div className="sf-hero" style={{ backgroundImage: image ? `url(${image})` : undefined }}>
      <div className="sf-container sf-hero-content">
        {hasBlocks ? (
          section.blocks.map((block: any) => {
            const blockStyle: React.CSSProperties = {
              transition: 'all 0.2s ease',
            };
            if (block.settings?.color) blockStyle.color = block.settings.color;
            if (block.settings?.fontSize) blockStyle.fontSize = `${block.settings.fontSize}px`;
            if (block.settings?.textAlign) blockStyle.textAlign = block.settings.textAlign;

            const dataField = `sections.section-hero.blocks.${block.id}`;

            switch (block.type) {
              case 'headline':
                return (
                  <h1 
                    key={block.id} 
                    data-orcayo-field={dataField}
                    style={{ ...blockStyle, marginBottom: '16px' }}
                    className="sf-hero-title"
                  >
                    {block.settings?.text || 'Headline'}
                  </h1>
                );
              case 'paragraph':
                return (
                  <p 
                    key={block.id} 
                    data-orcayo-field={dataField}
                    style={{ ...blockStyle, marginBottom: '24px' }}
                    className="sf-hero-sub"
                  >
                    {block.settings?.text || 'Paragraph text'}
                  </p>
                );
              case 'button':
                const btnStyle: React.CSSProperties = {
                  display: 'inline-block',
                  padding: '12px 24px',
                  fontWeight: '700',
                  textAlign: block.settings?.textAlign || 'center',
                  backgroundColor: block.settings?.color || 'var(--sf-accent)',
                  color: block.settings?.textColor || '#ffffff',
                  borderRadius: block.settings?.borderRadius ? `${block.settings.borderRadius}px` : 'var(--sf-button-radius, 8px)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                  marginRight: '12px',
                  marginBottom: '12px',
                };
                return (
                  <Link 
                    key={block.id} 
                    to={getLink(block.settings?.link || 'products')} 
                    data-orcayo-field={dataField}
                    style={btnStyle}
                    className="sf-btn-block"
                  >
                    {block.settings?.text || 'Button'}
                  </Link>
                );
              case 'image':
                const imgStyle: React.CSSProperties = {
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: block.settings?.borderRadius ? `${block.settings.borderRadius}px` : '8px',
                  marginTop: '16px',
                  marginBottom: '16px',
                  textAlign: block.settings?.textAlign || 'left',
                };
                return (
                  <div key={block.id} style={{ textAlign: block.settings?.textAlign || 'left' }}>
                    <img 
                      src={block.settings?.src || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800'} 
                      alt="Hero custom block image"
                      data-orcayo-field={dataField}
                      style={imgStyle}
                    />
                  </div>
                );
              default:
                return null;
            }
          })
        ) : (
          <>
            <div className="sf-hero-badge">🛍️ Welcome to {storeName}</div>
            <h1 className="sf-hero-title">{headline || 'Discover Your Next Obsession'}</h1>
            <p className="sf-hero-sub">{subheadline || 'Curated products, seamless experience.'}</p>
            <div className="sf-hero-actions">
              <Link to={getLink('products')} className="sf-btn-primary">Shop Now →</Link>
              <Link to={getLink('about')} className="sf-btn-outline">Our Story</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CategoriesSection() {
  const getLink = useStorefrontLink();
  const categories = ['Electronics', 'Fashion', 'Home & Living', 'Sports', 'Beauty'];
  return (
    <div className="sf-container sf-section">
      <div className="sf-section-header">
        <div className="sf-section-title">Shop by Category</div>
        <div className="sf-section-sub">Explore our curated collections</div>
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {categories.map(c => (
          <Link key={c} to={getLink(`products?category=${encodeURIComponent(c)}`)}
            style={{ padding: '12px 24px', borderRadius: '50px', background: 'var(--sf-surface)',
                     border: '1px solid rgba(255,255,255,0.1)', color: 'var(--sf-text)',
                     textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            {c}
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeaturedProductsSection({ products, settings }: { products: Product[]; settings: any }) {
  const { addItem } = useCart();
  const { projectId } = useParams();
  const getLink = useStorefrontLink();
  const count = settings?.count ?? 8;
  const displayProducts = products.slice(0, count);

  if (!displayProducts.length) return null;
  return (
    <div className="sf-container sf-section">
      <div className="sf-section-header">
        <div className="sf-section-title">Featured Products</div>
        <div className="sf-section-sub">Handpicked just for you</div>
      </div>
      <div className="sf-products-grid">
        {displayProducts.map(p => {
          const name = getProductName(p);
          const price = getProductPrice(p);
          const imgUrl = getProductImage(p);
          return (
            <div className="sf-product-card" key={p.id}>
              <Link 
                to={getLink(`/pub/${projectId}/product/${p.slug ?? p.id}`)} 
                state={{ product: p }}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}
              >
                {imgUrl
                  ? <img className="sf-product-img" src={imgUrl} alt={name} loading="lazy" />
                  : <div className="sf-product-img-placeholder">🛍️</div>}
                <div className="sf-product-info">
                  <div className="sf-product-name">{name}</div>
                  <div className="sf-product-footer">
                    <span className="sf-product-price">${price.toFixed(2)}</span>
                    <button className="sf-add-btn"
                      onClick={e => { e.preventDefault(); addItem(p.id, name, price, imgUrl); }}>
                      + Add
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: 'center', marginTop: '48px' }}>
        <Link to={getLink(`/pub/${projectId}/products`)} className="sf-btn-outline">View All Products →</Link>
      </div>
    </div>
  );
}


function TestimonialsSection() {
  const testimonials = [
    { name: 'Sarah M.', text: 'Amazing quality products! Delivery was super fast.', rating: 5 },
    { name: 'James K.', text: 'Best shopping experience I\'ve had online. Highly recommended!', rating: 5 },
    { name: 'Emily R.', text: 'The products exceeded my expectations. Will definitely shop again.', rating: 5 },
  ];
  return (
    <div className="sf-container sf-section">
      <div className="sf-section-header">
        <div className="sf-section-title">What Our Customers Say</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {testimonials.map(t => (
          <div key={t.name} className="glass" style={{ padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#f59e0b', marginBottom: '12px', fontSize: '1.1rem' }}>{'★'.repeat(t.rating)}</div>
            <p style={{ color: 'var(--sf-text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>"{t.text}"</p>
            <div style={{ fontWeight: 700 }}>{t.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CTASection({ section, settings }: { section?: any; settings?: any }) {
  const hasBlocks = section && section.blocks && section.blocks.length > 0;

  return (
    <div style={{ background: 'linear-gradient(135deg, var(--sf-primary), var(--sf-secondary))', padding: '80px 24px', textAlign: 'center', marginTop: '40px' }}>
      <div className="sf-container">
        {hasBlocks ? (
          section.blocks.map((block: any) => {
            const blockStyle: React.CSSProperties = {
              transition: 'all 0.2s ease',
            };
            if (block.settings?.color) blockStyle.color = block.settings.color;
            if (block.settings?.fontSize) blockStyle.fontSize = `${block.settings.fontSize}px`;
            if (block.settings?.textAlign) blockStyle.textAlign = block.settings.textAlign;

            const dataField = `sections.${section.id}.blocks.${block.id}`;

            switch (block.type) {
              case 'headline':
                return (
                  <h2 
                    key={block.id} 
                    data-orcayo-field={dataField}
                    style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '16px', ...blockStyle }}
                  >
                    {block.settings?.text || 'Headline'}
                  </h2>
                );
              case 'paragraph':
                return (
                  <p 
                    key={block.id} 
                    data-orcayo-field={dataField}
                    style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', marginBottom: '24px', ...blockStyle }}
                  >
                    {block.settings?.text || 'Paragraph text'}
                  </p>
                );
              case 'button':
                const btnStyle: React.CSSProperties = {
                  display: 'inline-block',
                  padding: '16px 40px',
                  borderRadius: block.settings?.borderRadius ? `${block.settings.borderRadius}px` : '50px',
                  backgroundColor: block.settings?.color || '#ffffff',
                  color: block.settings?.textColor || 'var(--sf-primary)',
                  fontWeight: 800,
                  textDecoration: 'none',
                  fontSize: '1rem',
                  marginTop: '16px',
                  marginRight: '12px',
                  marginBottom: '12px',
                  textAlign: block.settings?.textAlign || 'center',
                };
                return (
                  <a 
                    key={block.id} 
                    href={block.settings?.link || 'products'} 
                    data-orcayo-field={dataField}
                    style={btnStyle}
                  >
                    {block.settings?.text || 'Button'}
                  </a>
                );
              case 'image':
                const imgStyle: React.CSSProperties = {
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: block.settings?.borderRadius ? `${block.settings.borderRadius}px` : '8px',
                  marginTop: '16px',
                  marginBottom: '16px',
                  textAlign: block.settings?.textAlign || 'center',
                };
                return (
                  <div key={block.id} style={{ textAlign: block.settings?.textAlign || 'center' }}>
                    <img 
                      src={block.settings?.src || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800'} 
                      alt="CTA custom block image"
                      data-orcayo-field={dataField}
                      style={imgStyle}
                    />
                  </div>
                );
              default:
                return null;
            }
          })
        ) : (
          <>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
              {settings?.headline || 'Ready to Get Started?'}
            </h2>
            <a href="products" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: '50px',
                                          background: '#fff', color: 'var(--sf-primary)', fontWeight: 800,
                                          textDecoration: 'none', fontSize: '1rem', marginTop: '16px' }}>
              {settings?.btnLabel || 'Shop Now'}
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function RichTextSection({ section, settings }: { section?: any; settings?: any }) {
  const hasBlocks = section && section.blocks && section.blocks.length > 0;

  return (
    <section className="sf-section" style={{ padding: '60px 24px' }}>
      <div className="sf-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="sf-rich-text">
          {hasBlocks ? (
            section.blocks.map((block: any) => {
              const blockStyle: React.CSSProperties = {
                transition: 'all 0.2s ease',
              };
              if (block.settings?.color) blockStyle.color = block.settings.color;
              if (block.settings?.fontSize) blockStyle.fontSize = `${block.settings.fontSize}px`;
              if (block.settings?.textAlign) blockStyle.textAlign = block.settings.textAlign;

              const dataField = `sections.${section.id}.blocks.${block.id}`;

              switch (block.type) {
                case 'headline':
                  return (
                    <h3 
                      key={block.id} 
                      data-orcayo-field={dataField}
                      style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '20px', ...blockStyle }}
                    >
                      {block.settings?.text || 'Headline'}
                    </h3>
                  );
                case 'paragraph':
                  return (
                    <p 
                      key={block.id} 
                      data-orcayo-field={dataField}
                      style={{ fontSize: '1.1rem', color: 'var(--sf-text-secondary)', lineHeight: 1.8, marginBottom: '20px', ...blockStyle }}
                    >
                      {block.settings?.text || 'Paragraph text'}
                    </p>
                  );
                case 'button':
                  const btnStyle: React.CSSProperties = {
                    display: 'inline-block',
                    padding: '12px 24px',
                    fontWeight: '700',
                    textAlign: block.settings?.textAlign || 'center',
                    backgroundColor: block.settings?.color || 'var(--sf-primary)',
                    color: block.settings?.textColor || '#ffffff',
                    borderRadius: block.settings?.borderRadius ? `${block.settings.borderRadius}px` : 'var(--sf-button-radius, 8px)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                    marginRight: '12px',
                    marginBottom: '12px',
                  };
                  return (
                    <a 
                      key={block.id} 
                      href={block.settings?.link || 'products'} 
                      data-orcayo-field={dataField}
                      style={btnStyle}
                      className="sf-btn-primary"
                    >
                      {block.settings?.text || 'Button'}
                    </a>
                  );
                case 'image':
                  const imgStyle: React.CSSProperties = {
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: block.settings?.borderRadius ? `${block.settings.borderRadius}px` : '8px',
                    marginTop: '16px',
                    marginBottom: '16px',
                    textAlign: block.settings?.textAlign || 'left',
                  };
                  return (
                    <div key={block.id} style={{ textAlign: block.settings?.textAlign || 'left' }}>
                      <img 
                        src={block.settings?.src || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800'} 
                        alt="Rich text custom block image"
                        data-orcayo-field={dataField}
                        style={imgStyle}
                      />
                    </div>
                  );
                default:
                  return null;
              }
            })
          ) : (
            <div dangerouslySetInnerHTML={{ __html: settings?.content || '<h3>Your Content Here</h3><p>Use the customizer to add your brand story or announcement.</p>' }} />
          )}
        </div>
      </div>
    </section>
  );
}

// ── Custom Button Block ──────────────────────────────────────────────────
function CustomButtonSection({ settings }: { settings: any }) {
  const label = settings?.label || 'Click Me';
  const url = settings?.url || 'products';
  const buttonStyle = settings?.style || 'primary';
  const align = settings?.align || 'center';
  const color = settings?.color || '';
  const textColor = settings?.textColor || '';

  const inlineStyle: React.CSSProperties = {
    backgroundColor: buttonStyle === 'primary' && color ? color : undefined,
    color: textColor || undefined,
    borderColor: buttonStyle === 'outline' && color ? color : undefined,
  };

  return (
    <div style={{ display: 'flex', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', padding: '24px 24px' }} className="sf-container">
      <a href={url} className={`sf-btn-${buttonStyle}`} style={inlineStyle}>
        {label}
      </a>
    </div>
  );
}

// ── Typography Block ──────────────────────────────────────────────────────
interface TypographySectionProps {
  settings?: {
    text?: string;
    tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
    align?: 'left' | 'center' | 'right';
    color?: string;
    fontSize?: string;
    margin?: string;
  };
}

function TypographySection({ settings }: TypographySectionProps) {
  const text = settings?.text || 'Insert premium text here';
  const Tag = settings?.tag || 'h2';
  const align = settings?.align || 'center';
  const color = settings?.color || 'var(--sf-text)';
  const fontSize = settings?.fontSize || '';
  const margin = settings?.margin || '20px 0';

  const inlineStyle: React.CSSProperties = {
    textAlign: align as any,
    color,
    fontSize: fontSize || undefined,
    margin,
    lineHeight: 1.5,
  };

  return (
    <div className="sf-container" style={{ padding: '8px 24px' }}>
      <Tag style={inlineStyle} dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

// ── Custom Image Block ────────────────────────────────────────────────────
function CustomImageSection({ settings }: { settings: any }) {
  const url = settings?.url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';
  const width = settings?.width || '100%';
  const align = settings?.align || 'center';
  const radius = settings?.radius || '12px';

  return (
    <div style={{ display: 'flex', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', padding: '24px 24px' }} className="sf-container">
      <img 
        src={url} 
        alt="Custom block" 
        style={{ 
          maxWidth: '100%', 
          width: width, 
          height: 'auto', 
          borderRadius: radius,
          objectFit: 'cover',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }} 
      />
    </div>
  );
}

// ── Custom Card Block ─────────────────────────────────────────────────────
function CustomCardSection({ settings }: { settings: any }) {
  const title = settings?.title || 'Feature Title';
  const description = settings?.description || 'Feature description details go here.';
  const icon = settings?.icon || '⭐';
  const link = settings?.link || '';

  const CardInner = (
    <div className="glass" style={{ padding: '32px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ marginBottom: '12px', color: 'var(--sf-text)' }}>{title}</h3>
      <p style={{ color: 'var(--sf-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{description}</p>
    </div>
  );

  return (
    <div className="sf-container" style={{ padding: '24px 24px' }}>
      {link ? (
        <a href={link} style={{ textDecoration: 'none', display: 'block' }}>
          {CardInner}
        </a>
      ) : (
        CardInner
      )}
    </div>
  );
}

// ── Spacer Block ──────────────────────────────────────────────────────────
function SpacerSection({ settings }: { settings: any }) {
  const height = settings?.height || 40;
  return <div style={{ height: `${height}px` }} />;
}

// ── Services List Block ───────────────────────────────────────────────────
function ServicesListSection({ settings }: { settings: any }) {
  const title = settings?.title || 'Our Services';
  const subtitle = settings?.subtitle || 'Indulge in our signature professional treatments';
  const services = settings?.services || [];

  return (
    <section className="sf-section sf-services-list">
      <div className="sf-container">
        <div className="sf-section-header centered">
          <div className="sf-section-title">{title}</div>
          <div className="sf-section-sub">{subtitle}</div>
        </div>

        <div className="sf-services-grid">
          {services.map((service: any, sIdx: number) => (
            <div key={sIdx} className="sf-service-item">
              <div className="sf-service-header">
                <span className="sf-service-name">{service.name}</span>
                <span className="sf-service-spacer"></span>
                <span className="sf-service-price">{service.price}</span>
              </div>
              {service.description && (
                <p className="sf-service-desc">{service.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Booking Calendar Section ─────────────────────────────────────────────
function BookingCalendarSection({ products = [], staff = [], slots = [] }: { products?: any[]; staff?: any[]; slots?: any[] }) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [isLoadingAvailabilities, setIsLoadingAvailabilities] = useState(false);

  // Load staff availability from DB dynamically
  useEffect(() => {
    let active = true;
    const fetchAvailabilities = async () => {
      setIsLoadingAvailabilities(true);
      try {
        const res = await bookingsApi.getAvailabilities(selectedStaffId || '');
        if (active && res && res.success && Array.isArray(res.data)) {
          setAvailabilities(res.data);
        } else if (active) {
          setAvailabilities([]);
        }
      } catch (err) {
        console.error("Failed to load staff availability in storefront calendar:", err);
        if (active) {
          setAvailabilities([]);
        }
      } finally {
        if (active) setIsLoadingAvailabilities(false);
      }
    };

    fetchAvailabilities();

    return () => {
      active = false;
    };
  }, [selectedStaffId]);

  // Auto-select first product / service
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      const firstService = products.find((p: any) => p.categoryId === 'services' || p.name?.toLowerCase().includes('booking') || p.title?.toLowerCase().includes('service')) || products[0];
      setSelectedProduct(firstService);
    }
  }, [products, selectedProduct]);

  // Generate dynamic staff list with premium fallbacks if empty
  const getStaffMembers = (): { id: string; name: string; role: string; avatar: string }[] => {
    if (staff && staff.length > 0) {
      return staff.map((s: any) => ({
        id: s.id,
        name: s.name || s.fullName || 'Staff Member',
        role: s.role || s.title || 'Specialist',
        avatar: s.avatar || s.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id || s.name}`,
      }));
    }
    return [
      { id: 'staff-1', name: 'Alex Rivera', role: 'Senior Stylist', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
      { id: 'staff-2', name: 'Jordan Chen', role: 'Wellness Expert', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
      { id: 'staff-3', name: 'Taylor Swift', role: 'Care Coordinator', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor' }
    ];
  };

  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('am') || timeStr.includes('pm')) {
      return timeStr;
    }
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      let hour = parseInt(parts[0], 10);
      const min = parts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12; // the hour '0' should be '12'
      return `${hour}:${parts[1].substring(0, 2)} ${ampm}`;
    }
    return timeStr;
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    let cleaned = timeStr.trim().toUpperCase();
    let isPM = false;
    if (cleaned.endsWith('PM')) {
      isPM = true;
      cleaned = cleaned.replace('PM', '').trim();
    } else if (cleaned.endsWith('AM')) {
      cleaned = cleaned.replace('AM', '').trim();
    }
    const parts = cleaned.split(':');
    if (parts.length >= 1) {
      let hour = parseInt(parts[0], 10) || 0;
      const min = parts.length >= 2 ? parseInt(parts[1], 10) || 0 : 0;
      if (isPM && hour < 12) {
        hour += 12;
      } else if (!isPM && hour === 12) {
        hour = 0;
      }
      return hour * 60 + min;
    }
    return 0;
  };

  const generateIntervalsFromTimes = (startTimeStr: string, endTimeStr: string, durationMin: number) => {
    const startMin = parseTimeToMinutes(startTimeStr);
    const endMin = parseTimeToMinutes(endTimeStr);
    if (endMin <= startMin || durationMin <= 0) {
      return [];
    }
    const list = [];
    for (let current = startMin; current < endMin; current += durationMin) {
      const hh = String(Math.floor(current / 60)).padStart(2, '0');
      const mm = String(current % 60).padStart(2, '0');
      list.push(`${hh}:${mm}`);
    }
    return list;
  };

  const getSelectedProductSlot = () => {
    if (!slots || slots.length === 0) return null;
    if (!selectedProduct) return slots[0];
    const prodName = (getProductName(selectedProduct) || '').toLowerCase();
    const matchingSlot = slots.find((s: any) => {
      const slotName = (s.name || '').toLowerCase();
      return slotName && (prodName.includes(slotName) || slotName.includes(prodName));
    });
    return matchingSlot || slots[0];
  };

  const activeSlot = getSelectedProductSlot();
  
  const getDisplaySlots = () => {
    if (!activeSlot) {
      return ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'];
    }

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay(); // 0-6

    // Filter staff availabilities
    const staffAvails = selectedStaffId 
      ? availabilities.filter((a: any) => a.staffId === selectedStaffId)
      : availabilities;

    if (staffAvails.length > 0) {
      // Specialist has database availability configured!
      const dayAvail = staffAvails.find((a: any) => a.dayOfWeek === dayOfWeek);
      if (!dayAvail || !dayAvail.isAvailable) {
        // Closed/Unavailable on this day of the week
        return [];
      }
      return generateIntervalsFromTimes(dayAvail.startTime, dayAvail.endTime, activeSlot.duration || 30);
    }

    // Fallback when no database records exist for the specialist
    return generateIntervalsFromTimes(activeSlot.startTime, activeSlot.endTime, activeSlot.duration || 30);
  };

  const displaySlots = getDisplaySlots();

  // Handle CTA navigation to bookings checkout/confirmation flow
  const handleBookNowRedirect = () => {
    if (typeof window === 'undefined') return;
    
    const isPreview = window.location.pathname.includes('/storefront') || 
                      window.location.search.includes('projectId') || 
                      window.location.search.includes('templateId');
    const isPublished = !isPreview;
    const projectIdMatch = window.location.pathname.match(/\/pub\/([^/]+)/);
    const projectId = projectIdMatch ? projectIdMatch[1] : '';
    // For storefront preview mode, carry ?projectId from the current URL
    const currentParams = new URLSearchParams(window.location.search);
    const storefrontProjectId = currentParams.get('projectId') || '';
    
    let base = '/bookings';
    if (isPreview) {
      base = `/storefront/bookings`;
    } else if (projectId) {
      base = `/pub/${projectId}/bookings`;
    }
    
    const prodId = selectedProduct?.id || '';
    const dateStr = selectedDate;
    const timeStr = selectedTime ? selectedTime.replace(/\s*[APap][Mm]$/, '') : '';
    const staffIdStr = selectedStaffId || '';

    // Build query: carry projectId for storefront preview so the bookings loader can resolve the project
    let query = `productId=${prodId}&date=${dateStr}&time=${timeStr}&staffId=${staffIdStr}`;
    if (!isPublished && storefrontProjectId) {
      query += `&projectId=${storefrontProjectId}`;
    }

    // Direct user to full booking page with pre-filled service, slot, and staffId
    window.location.href = `${base}?${query}`;
  };

  const isMerchantConfigMissing = products.length === 0 || staff.length === 0 || slots.length === 0;

  return (
    <section className="sf-section" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
      <div className="sf-container" style={{ maxWidth: '900px' }}>
        
        {isMerchantConfigMissing && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.04)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
          }}>
            <h4 style={{
              color: '#ef4444',
              fontSize: '1.05rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 0 12px 0'
            }}>
              ⚙️ Merchant Setup Guide: Booking Flow Configuration
            </h4>
            <p style={{
              color: 'var(--sf-text-secondary)',
              fontSize: '0.88rem',
              margin: '0 0 16px 0',
              lineHeight: 1.5
            }}>
              Your booking calendar is currently running in <strong>Demo Mode</strong> with premium preview fallbacks. To fully launch this booking experience for your clients, please complete the following steps in your Orcayo Merchant Dashboard:
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Step 1: Products */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: products.length > 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: products.length > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <div style={{ fontSize: '1.2rem' }}>{products.length > 0 ? '✅' : '❌'}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: products.length > 0 ? '#10b981' : 'white' }}>
                    {products.length > 0 ? 'Bookable Services Configured' : 'Add Bookable Services'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)', marginTop: '2px' }}>
                    {products.length > 0 ? `Successfully loaded ${products.length} services from store database.` : 'Navigate to Products > Add Product and select "Service / Booking" to create your offerings.'}
                  </div>
                </div>
              </div>

              {/* Step 2: Staff */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: staff.length > 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: staff.length > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <div style={{ fontSize: '1.2rem' }}>{staff.length > 0 ? '✅' : '❌'}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: staff.length > 0 ? '#10b981' : 'white' }}>
                    {staff.length > 0 ? 'Staff & Specialists Added' : 'Invite Staff Members'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)', marginTop: '2px' }}>
                    {staff.length > 0 ? `Loaded ${staff.length} team members with dynamic user profiles.` : 'Go to Team Management > Invite Member to assign specialists to your branch.'}
                  </div>
                </div>
              </div>

              {/* Step 3: Slots */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: slots.length > 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: slots.length > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <div style={{ fontSize: '1.2rem' }}>{slots.length > 0 ? '✅' : '❌'}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: slots.length > 0 ? '#10b981' : 'white' }}>
                    {slots.length > 0 ? 'Active Booking Slots Generated' : 'Generate Booking Slots'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)', marginTop: '2px' }}>
                    {slots.length > 0 ? `Dynamic slot inventory active across store operating hours.` : 'Configure store timetables and branch hours under settings to open appointment slots.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="sf-section-header centered">
          <span className="sf-hero-eyebrow" style={{ display: 'inline-block', marginBottom: '8px' }}>⏰ Reserve Your Spot</span>
          <div className="sf-section-title">Online Booking & Services</div>
          <div className="sf-section-sub">Select a service and slot below to book your appointment instantly</div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginTop: '32px',
        }} className="sf-booking-grid">
          
          {/* Left Column: Services offered */}
          <div className="glass" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--sf-text-primary)' }}>Available Services</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              {products.length === 0 ? (
                <p style={{ color: 'var(--sf-text-muted)', fontSize: '0.9rem' }}>No services available at the moment.</p>
              ) : (
                products.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  const name = getProductName(p);
                  const price = getProductPrice(p);
                  const img = getProductImage(p);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid var(--sf-accent)' : '1px solid rgba(255,255,255,0.05)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {img ? (
                        <img src={img} alt={name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📅</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sf-text-primary)' }}>{name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--sf-accent)', fontWeight: 600 }}>${price.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Time slots */}
          <div className="glass" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--sf-text-primary)' }}>Select Date & Time</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input 
                  type="date" 
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Specialist Selection Carousel */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--sf-text-secondary)', marginBottom: '8px' }}>
                  👥 Choose Specialist
                </label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                }} className="sf-staff-carousel">
                  
                  {/* No Preference Card */}
                  <div 
                    onClick={() => setSelectedStaffId(null)}
                    style={{
                      flex: '0 0 auto',
                      width: '105px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '8px',
                      border: selectedStaffId === null ? '2px solid var(--sf-accent)' : '1px solid rgba(255,255,255,0.05)',
                      background: selectedStaffId === null ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', marginBottom: '4px' }}>⭐</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>No Preference</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--sf-text-muted)', textAlign: 'center' }}>Best Available</span>
                  </div>

                  {/* Specialist Cards */}
                  {getStaffMembers().map(s => {
                    const isSelected = selectedStaffId === s.id;
                    return (
                      <div 
                        key={s.id}
                        onClick={() => setSelectedStaffId(s.id)}
                        style={{
                          flex: '0 0 auto',
                          width: '105px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '8px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--sf-accent)' : '1px solid rgba(255,255,255,0.05)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <img src={s.avatar} alt={s.name} style={{ width: '28px', height: '28px', borderRadius: '50%', marginBottom: '4px' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>{s.name}</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--sf-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>{s.role}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--sf-text-secondary)', marginBottom: '8px' }}>
                  🕒 Available Slots
                </label>
                <div style={{ display: displaySlots.length > 0 ? 'grid' : 'block', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {displaySlots.length === 0 ? (
                    <div style={{
                      gridColumn: 'span 3',
                      textAlign: 'center',
                      padding: '20px',
                      color: 'var(--sf-text-secondary)',
                      fontSize: '0.85rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(255, 255, 255, 0.08)',
                    }}>
                      {isLoadingAvailabilities ? '🔄 Loading available slots...' : '❌ No slots available on this date.'}
                    </div>
                  ) : (
                    displaySlots.map(t => {
                      const isSelected = selectedTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTime(t)}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '6px',
                            border: isSelected ? '1px solid var(--sf-accent)' : '1px solid rgba(255,255,255,0.1)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            color: isSelected ? 'var(--sf-accent)' : 'var(--sf-text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            textAlign: 'center',
                          }}
                        >
                          {formatTimeSlot(t)}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                type="button"
                className="sf-btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '8px', justifyContent: 'center' }}
                onClick={handleBookNowRedirect}
              >
                Book Now ⚡
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
