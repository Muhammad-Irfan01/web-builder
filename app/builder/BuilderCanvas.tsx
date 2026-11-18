import { useState, useEffect, useRef } from 'react';
import { useTheme, themeToCSS } from '../lib/theme';

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface ViewportOption { id: Viewport; label: string; icon: string; tooltip: string; }
const VIEWPORTS: ViewportOption[] = [
  { id: 'desktop', label: 'Desktop', icon: '🖥️', tooltip: 'Desktop (1280px)' },
  { id: 'tablet',  label: 'Tablet',  icon: '📱', tooltip: 'Tablet (768px)'   },
  { id: 'mobile',  label: 'Mobile',  icon: '📲', tooltip: 'Mobile (390px)'   },
];

type PreviewPage = '/' | '/products' | '/product/:slug' | '/about' | '/contact';
const PAGES: { path: PreviewPage; label: string }[] = [
  { path: '/',              label: 'Home'     },
  { path: '/products',      label: 'Products' },
  { path: '/product/:slug', label: 'Product'  },
  { path: '/about',         label: 'About'    },
  { path: '/contact',       label: 'Contact'  },
];

interface BuilderCanvasProps {
  previewPage: string;
  setPreviewPage: (p: string) => void;
  viewport: 'desktop' | 'tablet' | 'mobile';
  setViewport: (v: 'desktop' | 'tablet' | 'mobile') => void;
}

export default function BuilderCanvas({ previewPage, setPreviewPage, viewport, setViewport }: BuilderCanvasProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading]   = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Read projectId/templateId from the builder URL (?projectId=... or ?templateId=...) once on mount
  const { projectId, templateId } = typeof window !== 'undefined'
    ? {
        projectId: new URLSearchParams(window.location.search).get('projectId'),
        templateId: new URLSearchParams(window.location.search).get('templateId')
      }
    : { projectId: null, templateId: null };

  // Inject live theme CSS variables into the iframe via postMessage on theme edits
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const cssVars = themeToCSS(theme);
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontBody)}:wght@400;500;600;700&family=${encodeURIComponent(theme.fontHeading)}:wght@600;700;800&display=swap`;

    const payload = {
      type:    'orcayo:theme-update',
      cssVars,
      fontUrl,
      theme,
    };

    try {
      iframe.contentWindow?.postMessage(payload, '*');
    } catch {
      // Cross-origin — will rely on URL params
    }
  }, [theme]);

  // Listen for the 'ready' handshake from the storefront iframe and instantly sync the theme state
  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'orcayo:storefront-ready') return;
      
      const iframe = iframeRef.current;
      if (!iframe) return;

      const cssVars = themeToCSS(theme);
      const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontBody)}:wght@400;500;600;700&family=${encodeURIComponent(theme.fontHeading)}:wght@600;700;800&display=swap`;

      const payload = {
        type:    'orcayo:theme-update',
        cssVars,
        fontUrl,
        theme,
      };

      try {
        iframe.contentWindow?.postMessage(payload, '*');
      } catch (err) {
        console.error('[BuilderCanvas] Handshake reply error:', err);
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [theme]);

  // Reload iframe on page change
  const handlePageChange = (page: PreviewPage) => {
    setPreviewPage(page);
    setIsLoading(true);
  };

  // Build the preview iframe src — include projectId or templateId so the storefront SSR
  // loader can resolve the correct project, storeId and theme data.
  const buildPreviewSrc = (page: string) => {
    const pagePath = page === '/product/:slug' ? '/product/demo-product' : page;
    const base = `/storefront${pagePath}`;
    if (projectId) {
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}projectId=${projectId}`;
    }
    if (templateId) {
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}templateId=${templateId}`;
    }
    return base;
  };

  const previewSrc = buildPreviewSrc(previewPage);


  return (
    <div className="canvas-area">
      {/* ── Canvas scroll area ─────────────────────────────────────────── */}
      <div className="canvas-scroll">
        <div className={`canvas-frame-wrapper ${viewport}`}>
          {/* Loading overlay */}
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(8, 11, 20, 0.7)', backdropFilter: 'blur(4px)',
              borderRadius: 'var(--radius-xl)',
            }}>
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={previewSrc}
            className="canvas-iframe"
            title="Storefront Preview"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            allow="same-origin"
          />
          <div className="canvas-overlay" />
        </div>
      </div>
    </div>
  );
}
