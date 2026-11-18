/**
 * SSR Home Page — /storefront
 * Loads featured products and renders all active sections dynamically.
 * Synchronizes in real-time with Customizer Parent via postMessage.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import type { Route } from '../+types/root';
import { products as productsApi, teams as teamsApi, bookings as bookingsApi, getProductName, getProductPrice, getProductImage } from '../lib/api';
import type { Product } from '../lib/api';
import { StorefrontLayout, useCart, useStorefrontTheme, useStorefrontLink } from '../storefront/StorefrontLayout';
import { ComponentRenderer } from '../storefront/ComponentRenderer';
import '../storefront/storefront.css';


// ── Server Loader (SSR) ──────────────────────────────────────────────────
export async function loader({ request }: { request: Request }): Promise<{
  products: Product[];
  storeName: string;
  theme: any | null;
  apiKey: string | null;
  staff: any[];
  slots: any[];
}> {
  const { resolveStorefrontContext } = await import('../lib/project.server');
  const { storeId, apiKey, themeData: theme, storeName } = await resolveStorefrontContext(request);

  let staffList: any[] = [];
  try {
    const fetchedStaff = await teamsApi.listStaff(storeId, apiKey) as any;
    staffList = fetchedStaff?.data || (Array.isArray(fetchedStaff) ? fetchedStaff : []);
  } catch (e: any) {
    console.error(`[Storefront Home] Failed to load staff (Status: ${e?.status || 'Unknown'}):`, e.message);
    staffList = []; // Resilient fallback
  }

  let slotsList: any[] = [];
  try {
    const fetchedSlots = await bookingsApi.listSlots(storeId, apiKey) as any;
    slotsList = fetchedSlots?.data || (Array.isArray(fetchedSlots) ? fetchedSlots : []);
  } catch (e: any) {
    console.error(`[Storefront Home] Failed to load slots (Status: ${e?.status || 'Unknown'}):`, e.message);
    slotsList = []; // Resilient fallback
  }

  try {
    const { data } = await productsApi.list({ limit: 8 }, apiKey, storeId);
    return {
      products: data,
      storeName,
      theme,
      apiKey,
      staff: staffList,
      slots: slotsList,
    };
  } catch {
    return {
      products: [],
      storeName,
      theme,
      apiKey,
      staff: staffList,
      slots: slotsList,
    };
  }
}


export default function StorefrontHome({ loaderData }: Route.ComponentProps) {
  const { products, storeName, theme: loadedTheme, apiKey, staff, slots } = loaderData as any;

  return (
    <StorefrontLayout storeName={loadedTheme?.storeName || storeName} themeData={loadedTheme} apiKey={apiKey}>
      <StorefrontHomeContent products={products} storeName={storeName} staff={staff} slots={slots} />
    </StorefrontLayout>
  );
}

function StorefrontHomeContent({ products, storeName, staff, slots }: { products: any[]; storeName: string; staff: any[]; slots: any[] }) {
  const { theme } = useStorefrontTheme();
  const activeLayout = theme?.layout || [];

  return (
    <>
      {activeLayout.length > 0 ? activeLayout.map((node: any) => (
        <ComponentRenderer key={node.id} node={node} data={{ products, staff, slots, storeName: theme?.storeName || storeName }} />
      )) : (theme?.sections || []).map((section: any) => {
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
          case 'image-gallery':
            component = <ImageGallerySection settings={section.settings} />;
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


// ── Hero Section ─────────────────────────────────────────────────────────
function HeroSection({ 
  storeName, 
  headline, 
  subheadline, 
  image,
  section,
}: { 
  storeName: string; 
  headline?: string; 
  subheadline?: string; 
  image?: string; 
  section?: any;
}) {
  const getLink = useStorefrontLink();
  const defaultHeadline = 'Discover Your Next Obsession';
  const defaultSubheadline = `Curated products, seamless experience. Shop the latest from ${storeName} and enjoy lightning-fast delivery.`;

  const hasBlocks = section && section.blocks && section.blocks.length > 0;

  return (
    <section className="sf-hero">
      {image ? (
        <div 
          className="sf-hero-bg" 
          data-orcayo-field="heroImage"
          style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(8, 11, 20, 0.4), rgba(8, 11, 20, 0.95)), url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} 
        />
      ) : (
        <div className="sf-hero-bg" data-orcayo-field="heroImage" />
      )}
      <div className="sf-container">
        <div className="sf-hero-content">
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
                      style={blockStyle}
                    >
                      {block.settings?.text || 'Headline'}
                    </h1>
                  );
                case 'paragraph':
                  return (
                    <p 
                      key={block.id} 
                      data-orcayo-field={dataField}
                      style={blockStyle}
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
                    <a 
                      key={block.id} 
                      href={getLink(block.settings?.link || '/storefront/products')} 
                      data-orcayo-field={dataField}
                      style={btnStyle}
                      className="sf-btn-block"
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
              <div className="sf-hero-eyebrow">
                ✨ New Collection Available
              </div>
              <h1 data-orcayo-field="heroHeadline">
                {headline || defaultHeadline}
              </h1>
              <p data-orcayo-field="heroSubheadline">
                {subheadline || defaultSubheadline}
              </p>
              <div className="sf-hero-ctas">
                <a href={getLink('/storefront/products')} className="sf-btn-primary">
                  Shop Now →
                </a>
                <a href="#featured" className="sf-btn-outline">
                  Explore Collection
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Categories Section ───────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Wellness & Beauty', count: 12, icon: '🌿', bg: 'linear-gradient(135deg, #1e1b4b, #311042)' },
  { id: 'cat-2', name: 'Modern Accessories', count: 8, icon: '⌚', bg: 'linear-gradient(135deg, #062f4f, #001f3f)' },
  { id: 'cat-3', name: 'Apparel & Comfort', count: 15, icon: '🧥', bg: 'linear-gradient(135deg, #3b0a1a, #5c0620)' },
  { id: 'cat-4', name: 'Tech & Home Decor', count: 6, icon: '🛋️', bg: 'linear-gradient(135deg, #052e16, #022c22)' },
];

function CategoriesSection() {
  const getLink = useStorefrontLink();
  return (
    <section className="sf-section" style={{ background: 'color-mix(in srgb, var(--sf-text) 1%, transparent)' }}>
      <div className="sf-container">
        <div className="sf-section-header centered">
          <div className="sf-section-title">Shop by Category</div>
          <div className="sf-section-sub">Find exactly what you need in our curated folders</div>
        </div>

        <div className="sf-categories-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          marginTop: '32px',
        }}>
          {DEFAULT_CATEGORIES.map(cat => (
            <Link 
              key={cat.id} 
              to={getLink(`/storefront/products?categoryId=${cat.id}`)} 
              className="sf-category-tile"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                borderRadius: 'var(--sf-radius)',
                background: cat.bg,
                border: '1px solid rgba(255,255,255,0.05)',
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              }}
            >
              <span style={{ fontSize: '3rem', marginBottom: '16px', display: 'block', transform: 'scale(1)', transition: 'transform 0.3s' }}>
                {cat.icon}
              </span>
              <span style={{ 
                fontFamily: 'var(--sf-font-heading)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--sf-text)',
                marginBottom: '4px'
              }}>
                {cat.name}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)', fontWeight: 500 }}>
                {cat.count} Items
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Featured Products ────────────────────────────────────────────────────
function FeaturedProductsSection({ products, settings }: { products: Product[]; settings?: any }) {
  const getLink = useStorefrontLink();
  const count = settings?.count || 8;
  const displayProducts = products.slice(0, count);

  return (
    <section className="sf-section" id="featured">
      <div className="sf-container">
        <div className="sf-section-header">
          <div className="sf-section-title">Featured Products</div>
          <div className="sf-section-sub">Hand-picked favourites, just for you</div>
        </div>
        {displayProducts.length === 0 ? (
          <SkeletonGrid count={count} />
        ) : (
          <div className="sf-products-grid">
            {displayProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link to={getLink('/storefront/products')} className="sf-btn-outline">View All Products</Link>
        </div>
      </div>
    </section>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const getLink = useStorefrontLink();
  const displayName = getProductName(product);
  const displayPrice = getProductPrice(product);
  const comparePrice = +(product.compareAtPrice ?? (product.variants?.[0] as any)?.compareAtPrice ?? 0);
  const imgUrl = getProductImage(product);
  return (
    <div className="sf-product-card">
      <Link 
        to={getLink(`/storefront/product/${product.slug ?? product.id}`)} 
        state={{ product }}
        style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        {imgUrl
          ? <img className="sf-product-img" src={imgUrl} alt={displayName} loading="lazy" />
          : <div className="sf-product-img-placeholder">🛍️</div>
        }
        <div className="sf-product-info">
          <div className="sf-product-name">{displayName}</div>
          <div className="sf-product-desc">{product.description?.slice(0, 80)}{product.description && product.description.length > 80 ? '…' : ''}</div>
          <div className="sf-product-footer">
            <div>
              <span className="sf-product-price">${displayPrice.toFixed(2)}</span>
              {comparePrice > 0 && comparePrice > displayPrice && (
                <span className="sf-product-compare">${comparePrice.toFixed(2)}</span>
              )}
            </div>
            <button
              className="sf-add-btn"
              onClick={e => {
                e.preventDefault();
                addItem(product.id, displayName, displayPrice, imgUrl);
              }}
            >
              + Add
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}



// ── Skeleton ─────────────────────────────────────────────────────────────
function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="sf-products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sf-product-card" style={{ overflow: 'hidden' }}>
          <div className="sf-skeleton" style={{ width: '100%', aspectRatio: '1' }} />
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="sf-skeleton" style={{ height: '16px', width: '80%' }} />
            <div className="sf-skeleton" style={{ height: '12px', width: '100%' }} />
            <div className="sf-skeleton" style={{ height: '12px', width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Sarah M.',  text: 'Absolutely love the quality and the fast shipping. Will definitely order again!', stars: 5 },
  { name: 'James K.', text: 'Incredible store experience. The products exceeded my expectations.', stars: 5 },
  { name: 'Priya L.', text: 'Smooth checkout and the item was exactly as described. Highly recommend.', stars: 5 },
];

function TestimonialsSection() {
  return (
    <section className="sf-section" style={{ background: 'color-mix(in srgb, var(--sf-primary) 2%, transparent)', borderTop: '1px solid color-mix(in srgb, var(--sf-text) 2%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--sf-text) 2%, transparent)' }}>
      <div className="sf-container">
        <div className="sf-section-header centered">
          <div className="sf-section-title">What Customers Say</div>
          <div className="sf-section-sub">Real reviews from real shoppers</div>
        </div>
        <div className="sf-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div className="sf-testimonial-card" key={i}>
              <div className="sf-stars">{'★'.repeat(t.stars)}</div>
              <p className="sf-testimonial-text">"{t.text}"</p>
              <div className="sf-testimonial-author">{t.name}</div>
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
    const isPublished = window.location.pathname.includes('/pub/');
    const projectIdMatch = window.location.pathname.match(/\/pub\/([^/]+)/);
    const projectId = projectIdMatch ? projectIdMatch[1] : '';
    // For storefront preview mode, carry ?projectId or ?templateId from the current URL
    const currentParams = new URLSearchParams(window.location.search);
    const storefrontProjectId = currentParams.get('projectId') || '';
    const storefrontTemplateId = currentParams.get('templateId') || '';
    
    const base = isPublished ? `/pub/${projectId}/bookings` : `/storefront/bookings`;
    const prodId = selectedProduct?.id || '';
    const dateStr = selectedDate;
    const timeStr = selectedTime ? selectedTime.replace(/\s*[APap][Mm]$/, '') : '';
    const staffIdStr = selectedStaffId || '';

    // Build query: carry projectId or templateId for storefront preview so the bookings loader can resolve the project
    let query = `productId=${prodId}&date=${dateStr}&time=${timeStr}&staffId=${staffIdStr}`;
    if (!isPublished) {
      if (storefrontProjectId) {
        query += `&projectId=${storefrontProjectId}`;
      } else if (storefrontTemplateId) {
        query += `&templateId=${storefrontTemplateId}`;
      }
    }

    // Direct user to full booking page with pre-filled service, slot, and staffId
    window.location.href = `${base}?${query}`;
  };

  const isMerchantConfigMissing = products.length === 0 || staff.length === 0 || slots.length === 0;

  return (
    <section className="sf-section" style={{ background: 'color-mix(in srgb, var(--sf-text) 1%, transparent)', borderTop: '1px solid color-mix(in srgb, var(--sf-text) 3%, transparent)' }}>
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
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--sf-radius)', border: '1px solid color-mix(in srgb, var(--sf-text) 5%, transparent)', background: 'var(--sf-surface)' }}>
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
                        border: isSelected ? '1px solid var(--sf-accent)' : '1px solid color-mix(in srgb, var(--sf-text) 5%, transparent)',
                        background: isSelected ? 'color-mix(in srgb, var(--sf-primary) 8%, transparent)' : 'color-mix(in srgb, var(--sf-text) 1%, transparent)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {img ? (
                        <img src={img} alt={name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'color-mix(in srgb, var(--sf-text) 5%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📅</div>
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
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--sf-radius)', border: '1px solid color-mix(in srgb, var(--sf-text) 5%, transparent)', background: 'var(--sf-surface)' }}>
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
                    background: 'var(--sf-bg)',
                    border: '1px solid color-mix(in srgb, var(--sf-primary) 20%, transparent)',
                    color: 'var(--sf-text)',
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
                      border: selectedStaffId === null ? '2px solid var(--sf-accent)' : '1px solid color-mix(in srgb, var(--sf-text) 5%, transparent)',
                      background: selectedStaffId === null ? 'color-mix(in srgb, var(--sf-primary) 12%, transparent)' : 'color-mix(in srgb, var(--sf-text) 2%, transparent)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--sf-primary), var(--sf-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', marginBottom: '4px' }}>⭐</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>No Preference</span>
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
                          border: isSelected ? '2px solid var(--sf-accent)' : '1px solid color-mix(in srgb, var(--sf-text) 5%, transparent)',
                          background: isSelected ? 'color-mix(in srgb, var(--sf-primary) 12%, transparent)' : 'color-mix(in srgb, var(--sf-text) 2%, transparent)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <img src={s.avatar} alt={s.name} style={{ width: '28px', height: '28px', borderRadius: '50%', marginBottom: '4px' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>{s.name}</span>
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
                      background: 'color-mix(in srgb, var(--sf-text) 2%, transparent)',
                      borderRadius: '8px',
                      border: '1px dashed color-mix(in srgb, var(--sf-text) 8%, transparent)',
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
                            border: isSelected ? '1px solid var(--sf-accent)' : '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)',
                            background: isSelected ? 'color-mix(in srgb, var(--sf-primary) 15%, transparent)' : 'transparent',
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

// ── CTA Banner ───────────────────────────────────────────────────────────
function CTASection({ section, settings }: { section?: any; settings?: any }) {
  const getLink = useStorefrontLink();
  const hasBlocks = section && section.blocks && section.blocks.length > 0;

  return (
    <section className="sf-section">
      <div className="sf-container">
        <div className="sf-cta">
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
                      style={blockStyle}
                    >
                      {block.settings?.text || 'Headline'}
                    </h2>
                  );
                case 'paragraph':
                  return (
                    <p 
                      key={block.id} 
                      data-orcayo-field={dataField}
                      style={blockStyle}
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
                    backgroundColor: block.settings?.color || '#ffffff',
                    color: block.settings?.textColor || 'var(--sf-primary)',
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
                      href={getLink(block.settings?.link || '/storefront/products')} 
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
              <h2>{settings?.headline || 'Ready to Start Shopping?'}</h2>
              <p>Browse our full catalog and find something you'll love.</p>
              <a href={getLink('/storefront/products')} className="sf-btn-primary">{settings?.btnLabel || 'Explore All Products →'}</a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Rich Text Section ────────────────────────────────────────────────────
function RichTextSection({ section, settings }: { section?: any; settings?: any }) {
  const getLink = useStorefrontLink();
  const hasBlocks = section && section.blocks && section.blocks.length > 0;
  
  return (
    <section className="sf-section">
      <div className="sf-container" style={{ maxWidth: '800px' }}>
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
                      style={blockStyle}
                    >
                      {block.settings?.text || 'Headline'}
                    </h3>
                  );
                case 'paragraph':
                  return (
                    <p 
                      key={block.id} 
                      data-orcayo-field={dataField}
                      style={blockStyle}
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
                      href={getLink(block.settings?.link || '/storefront/products')} 
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

// ── Image Gallery Section ────────────────────────────────────────────────
function ImageGallerySection({ settings }: { settings?: any }) {
  const images = settings?.images || [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800',
  ];

  return (
    <section className="sf-section">
      <div className="sf-container">
        <div className="sf-gallery-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {images.map((img: string, i: number) => (
            <div key={i} className="glass" style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: 'var(--sf-radius)' }}>
              <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Gallery ${i+1}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Custom Button Block ──────────────────────────────────────────────────
function CustomButtonSection({ settings }: { settings: any }) {
  const getLink = useStorefrontLink();
  const label = settings?.label || 'Click Me';
  const url = settings?.url || '/storefront/products';
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
      <a href={getLink(url)} className={`sf-btn-${buttonStyle}`} style={inlineStyle}>
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

// SEO meta
export function meta() {
  return [
    { title: 'Orcayo Store — Home' },
    { name: 'description', content: 'Discover premium products at our Orcayo-powered store.' },
  ];
}
