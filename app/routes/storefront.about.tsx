import type { Route } from '../+types/root';
import { StorefrontLayout, useStorefrontTheme } from '../storefront/StorefrontLayout';
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

function AboutPageContent({ storeName }: { storeName: string }) {
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
          <h1 className="sf-section-title" data-orcayo-field="aboutPageTitle">{theme?.aboutPageTitle || 'Our Story'}</h1>
          <p className="sf-section-sub" data-orcayo-field="aboutPageDesc">{theme?.aboutPageDesc || 'Quality products, curated with passion.'}</p>
        </div>

        <div style={{ maxWidth: '800px', margin: '40px auto', lineHeight: 2 }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--sf-text-secondary)', marginBottom: '32px' }} data-orcayo-field="aboutPageStory">
            {theme?.aboutPageStory || `Welcome to ${storeName || 'our store'}. We believe in providing the best experience for our customers by offering high-quality products that are both functional and beautiful.`}
          </p>
          
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '20px' }}>Our Mission</h2>
          <p style={{ color: 'var(--sf-text-muted)', marginBottom: '32px' }} data-orcayo-field="aboutPageMission">
            {theme?.aboutPageMission || 'Our mission is to empower individuals through exceptional products and unparalleled service. We strive to be a sustainable and ethical business that gives back to the community while delivering joy to our customers.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '60px' }}>
            <div className="glass" style={{ padding: '32px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🌟</div>
              <h3 style={{ marginBottom: '12px' }}>Quality Guaranteed</h3>
              <p style={{ color: 'var(--sf-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>We hand-pick every item in our collection to ensure it meets our rigorous standards of excellence.</p>
            </div>
            <div className="glass" style={{ padding: '32px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🚀</div>
              <h3 style={{ marginBottom: '12px' }}>Fast Shipping</h3>
              <p style={{ color: 'var(--sf-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>Our logistics network ensures your orders reach your doorstep in the shortest possible time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage({ loaderData }: Route.ComponentProps) {
  const { storeName, themeData, apiKey } = loaderData as any;

  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <AboutPageContent storeName={storeName} />
    </StorefrontLayout>
  );
}

