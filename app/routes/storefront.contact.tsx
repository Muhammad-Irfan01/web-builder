import { useState, useEffect } from 'react';
import type { Route } from '../+types/root';
import { StorefrontLayout, useStorefrontTheme } from '../storefront/StorefrontLayout';
import { store as storeApi } from '../lib/api';
import type { StoreDetails } from '../lib/api';
import '../storefront/storefront.css';

export async function loader({ request }: { request: Request }) {
  const { resolveStorefrontContext } = await import('../lib/project.server');
  const { storeId, apiKey, themeData, storeName } = await resolveStorefrontContext(request);
  return {
    storeName,
    themeData,
    apiKey,
  };
}

function ContactPageContent({ storeName }: { storeName: string }) {
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useStorefrontTheme();

  useEffect(() => {
    storeApi.getDetails()
      .then(res => setStore(res.data))
      .catch(() => {
        // Fallback mock
        setStore({
          id: 'default',
          name: 'Orcayo Store',
          email: 'hello@orcayo.com',
          phone: '+1 (555) 123-4567',
          address: '123 Commerce St, Digital City, 90210',
          description: 'A premier shopping destination powered by Orcayo.'
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const subpageStyle: React.CSSProperties = {
    transition: 'all 0.3s ease',
  };
  if (theme?.contactPageBgOverride) subpageStyle.background = theme.contactPageBgOverride;
  if (theme?.contactPageBgGradient) subpageStyle.background = theme.contactPageBgGradient;
  if (theme?.contactPageTextColorOverride) subpageStyle.color = theme.contactPageTextColorOverride;
  if (theme?.contactPageFontSizeOverride) subpageStyle.fontSize = theme.contactPageFontSizeOverride;

  return (
    <div style={subpageStyle} className="sf-section-override">
        <div className="sf-container" style={{ padding: '60px 24px' }}>
          <div className="sf-section-header centered">
            <h1 className="sf-section-title" data-orcayo-field="contactPageHeadline">{theme?.contactPageHeadline || 'Get in Touch'}</h1>
            <p className="sf-section-sub">We'd love to hear from you. Reach out via any of the channels below.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', marginTop: '40px' }}>
          
          {/* ── Contact Details ────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {loading ? (
              <div className="sf-skeleton" style={{ height: '300px' }} />
            ) : (
              <>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Store Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>📍</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>Our Address</div>
                        <div style={{ color: 'var(--sf-text-muted)' }} data-orcayo-field="contactPageAddress">{theme?.contactPageAddress || store?.address}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>📧</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>Email Us</div>
                        <div style={{ color: 'var(--sf-text-muted)' }} data-orcayo-field="contactPageEmail">{theme?.contactPageEmail || store?.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>📞</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>Call Us</div>
                        <div style={{ color: 'var(--sf-text-muted)' }} data-orcayo-field="contactPagePhone">{theme?.contactPagePhone || store?.phone}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Business Hours</h3>
                  <p style={{ color: 'var(--sf-text-muted)', lineHeight: 1.8 }}>
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 4:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ── Contact Form ───────────────────────────────────────────── */}
          <div className="glass" style={{ padding: '40px' }}>
            <h3 style={{ marginBottom: '24px' }}>Send us a Message</h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input className="sf-input" placeholder="Your Name" required />
              <input className="sf-input" type="email" placeholder="Your Email" required />
              <input className="sf-input" placeholder="Subject" required />
              <textarea className="sf-input" rows={5} placeholder="Your Message" style={{ resize: 'none' }} required />
              <button type="submit" className="sf-btn-primary" style={{ justifyContent: 'center' }}>Send Message</button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ContactPage({ loaderData }: Route.ComponentProps) {
  const { storeName, themeData, apiKey } = loaderData as any;

  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <ContactPageContent storeName={storeName} />
    </StorefrontLayout>
  );
}

