/**
 * Standalone Published Contact Page — /pub/:projectId/contact
 */
import { useState } from 'react';
import type { Route } from '../+types/root';
import { StorefrontLayout, useStorefrontTheme } from '../storefront/StorefrontLayout';
import { resolveProject } from '../lib/project.server';
import '../storefront/storefront.css';

export async function loader({ params, request }: { params: { projectId: string }; request: Request }) {
  const resolved = await resolveProject(request, params.projectId);
  if (!resolved) throw new Response('Not Found', { status: 404 });
  return { storeName: resolved.storeName, themeData: resolved.themeData, apiKey: resolved.apiKey };
}

function PubContactContent({ storeName }: { storeName: string }) {
  const [sent, setSent] = useState(false);
  const { theme } = useStorefrontTheme();

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
          <h1 className="sf-section-title">{theme?.contactPageHeadline || 'Get in Touch'}</h1>
          <p className="sf-section-sub">We'd love to hear from you.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', marginTop: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {[['📍', 'Our Address', theme?.contactPageAddress || '123 Commerce St, Digital City, 90210'],
              ['📧', 'Email Us', theme?.contactPageEmail || 'hello@orcayo.com'],
              ['📞', 'Call Us', theme?.contactPagePhone || '+1 (555) 123-4567']].map(([icon, label, value]) => (
              <div key={label} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <div><div style={{ fontWeight: 700 }}>{label}</div>
                  <div style={{ color: 'var(--sf-text-muted)' }}>{value}</div></div>
              </div>
            ))}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Business Hours</h3>
              <p style={{ color: 'var(--sf-text-muted)', lineHeight: 1.8 }}>
                Monday – Friday: 9:00 AM – 6:00 PM<br />
                Saturday: 10:00 AM – 4:00 PM<br />
                Sunday: Closed
              </p>
            </div>
          </div>
          <div className="glass" style={{ padding: '40px' }}>
            <h3 style={{ marginBottom: '24px' }}>Send us a Message</h3>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                <p>Thank you! We'll get back to you shortly.</p>
              </div>
            ) : (
              <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                onSubmit={e => { e.preventDefault(); setSent(true); }}>
                <input className="sf-input" placeholder="Your Name" required />
                <input className="sf-input" type="email" placeholder="Your Email" required />
                <input className="sf-input" placeholder="Subject" required />
                <textarea className="sf-input" rows={5} placeholder="Your Message" style={{ resize: 'none' }} required />
                <button type="submit" className="sf-btn-primary" style={{ justifyContent: 'center' }}>Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PubContact({ loaderData }: Route.ComponentProps) {
  const { storeName, themeData, apiKey } = loaderData as any;

  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <PubContactContent storeName={storeName} />
    </StorefrontLayout>
  );
}
