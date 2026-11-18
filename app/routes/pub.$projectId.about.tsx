/**
 * Standalone Published About Page — /pub/:projectId/about
 */
import type { Route } from '../+types/root';
import { StorefrontLayout, useStorefrontTheme } from '../storefront/StorefrontLayout';
import { resolveProject } from '../lib/project.server';
import '../storefront/storefront.css';

export async function loader({ params, request }: { params: { projectId: string }; request: Request }) {
  const resolved = await resolveProject(request, params.projectId);
  if (!resolved) throw new Response('Not Found', { status: 404 });
  return { storeName: resolved.storeName, themeData: resolved.themeData, apiKey: resolved.apiKey };
}

function PubAboutContent({ storeName }: { storeName: string }) {
  const { theme } = useStorefrontTheme();

  const subpageStyle: React.CSSProperties = {
    transition: 'all 0.3s ease',
  };
  if (theme?.aboutPageBgOverride) subpageStyle.background = theme.aboutPageBgOverride;
  if (theme?.aboutPageBgGradient) subpageStyle.background = theme.aboutPageBgGradient;
  if (theme?.aboutPageTextColorOverride) subpageStyle.color = theme.aboutPageTextColorOverride;
  if (theme?.aboutPageFontSizeOverride) subpageStyle.fontSize = theme.aboutPageFontSizeOverride;

  return (
    <div style={subpageStyle} className="sf-section-override">
      <div className="sf-container" style={{ padding: '60px 24px' }}>
        <div className="sf-section-header centered">
          <h1 className="sf-section-title">{theme?.aboutPageTitle || 'Our Story'}</h1>
          <p className="sf-section-sub">{theme?.aboutPageDesc || 'Quality products, curated with passion.'}</p>
        </div>
        <div style={{ maxWidth: '800px', margin: '40px auto', lineHeight: 2 }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--sf-text-secondary)', marginBottom: '32px' }}>
            {theme?.aboutPageStory || `Welcome to ${storeName}. We believe in providing the best experience for our customers by offering high-quality products that are both functional and beautiful.`}
          </p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '20px' }}>Our Mission</h2>
          <p style={{ color: 'var(--sf-text-muted)', marginBottom: '32px' }}>
            {theme?.aboutPageMission || 'Our mission is to empower individuals through exceptional products and unparalleled service. We strive to be a sustainable and ethical business that gives back to the community.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '60px' }}>
            <div className="glass" style={{ padding: '32px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🌟</div>
              <h3 style={{ marginBottom: '12px' }}>Quality Guaranteed</h3>
              <p style={{ color: 'var(--sf-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                We hand-pick every item to ensure it meets our rigorous standards of excellence.
              </p>
            </div>
            <div className="glass" style={{ padding: '32px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🚀</div>
              <h3 style={{ marginBottom: '12px' }}>Fast Shipping</h3>
              <p style={{ color: 'var(--sf-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Our logistics network ensures orders reach your doorstep in the shortest possible time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PubAbout({ loaderData }: Route.ComponentProps) {
  const { storeName, themeData, apiKey } = loaderData as any;

  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <PubAboutContent storeName={storeName} />
    </StorefrontLayout>
  );
}
