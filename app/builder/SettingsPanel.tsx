import { useState, useRef } from 'react';
import { useTheme, type ComponentNode, DEFAULT_THEME } from '../lib/theme';
import { files as filesApi } from '../lib/api';

const FONT_OPTIONS = ['Inter', 'Outfit', 'Roboto', 'Poppins', 'Nunito', 'Playfair Display', 'DM Sans'];

const PAGES_LIST = [
  { path: '/',              label: 'Home Page'     },
  { path: '/products',      label: 'Products Catalog' },
  { path: '/product/:slug', label: 'Product Detail'  },
  { path: '/about',         label: 'About Us'    },
  { path: '/contact',       label: 'Contact Us'  },
];

const PAGE_OPTIONS = [
  { label: 'Home', url: '/storefront' },
  { label: 'All Products', url: '/storefront/products' },
  { label: 'About Us', url: '/storefront/about' },
  { label: 'Contact', url: '/storefront/contact' },
  { label: 'My Account', url: '/storefront/account' },
  { label: 'Cart', url: '/storefront/cart' },
];

function PagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  return (
    <select className="input input-sm" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">-- Custom URL --</option>
      {PAGE_OPTIONS.map(opt => (
        <option key={opt.url} value={opt.url}>{opt.label}</option>
      ))}
    </select>
  );
}

function MediaInput({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await filesApi.upload(file);
      onChange(url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." />
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? '...' : '📁'}
        </button>
      </div>
      <input type="file" ref={fileInputRef} hidden onChange={handleUpload} accept="image/*" />
    </div>
  );
}

function SubpageDesignOverrides({ prefix, theme, setToken }: { prefix: string; theme: any; setToken: any }) {
  const bgOverrideKey = `${prefix}BgOverride`;
  const bgGradientKey = `${prefix}BgGradient`;
  const textColorOverrideKey = `${prefix}TextColorOverride`;
  const fontSizeOverrideKey = `${prefix}FontSizeOverride`;

  const bgOverride = theme[bgOverrideKey] || '';
  const bgGradient = theme[bgGradientKey] || '';
  const textColorOverride = theme[textColorOverrideKey] || '';
  const fontSizeOverride = theme[fontSizeOverrideKey] || '';

  return (
    <div className="settings-group" style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
      <div className="settings-group-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        ✨ Subpage Design Overrides
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
        Customize styling overrides exclusively for this page. These settings override global theme defaults.
      </p>

      <div className="form-group" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label className="label" style={{ margin: 0 }}>Solid Background Color</label>
          {bgOverride && (
            <button className="btn-link" style={{ fontSize: '0.72rem', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setToken(bgOverrideKey, undefined)}>Reset</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="color" className="input" style={{ width: '42px', height: '38px', padding: '4px', cursor: 'pointer', flexShrink: 0 }} value={bgOverride || '#ffffff'} onChange={e => { setToken(bgOverrideKey, e.target.value); setToken(bgGradientKey, undefined); }} />
          <input type="text" className="input" placeholder="Hex color code" style={{ flex: 1 }} value={bgOverride} onChange={e => { setToken(bgOverrideKey, e.target.value); setToken(bgGradientKey, undefined); }} />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '14px' }}>
        <label className="label">Background Gradient Preset</label>
        <select className="input" value={bgGradient} onChange={e => { const val = e.target.value; setToken(bgGradientKey, val || undefined); if (val) setToken(bgOverrideKey, undefined); }}>
          <option value="">None (Transparent / Solid)</option>
          <option value="linear-gradient(135deg, #ff7e5f, #feb47b)">🌅 Sunset Glow</option>
          <option value="linear-gradient(135deg, #2b5876, #4e4376)">🌊 Ocean Breeze</option>
          <option value="linear-gradient(135deg, #0f2027, #203a43, #2c5364)">🌌 Midnight Royal</option>
          <option value="linear-gradient(135deg, #f72585, #7209b7, #3f37c9)">👾 Cyberpunk Neon</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label className="label" style={{ margin: 0 }}>Text Color Override</label>
          {textColorOverride && (
            <button className="btn-link" style={{ fontSize: '0.72rem', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setToken(textColorOverrideKey, undefined)}>Reset</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="color" className="input" style={{ width: '42px', height: '38px', padding: '4px', cursor: 'pointer', flexShrink: 0 }} value={textColorOverride || '#ffffff'} onChange={e => setToken(textColorOverrideKey, e.target.value)} />
          <input type="text" className="input" placeholder="Hex color code" style={{ flex: 1 }} value={textColorOverride} onChange={e => setToken(textColorOverrideKey, e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function NodeSettings({ node, onBack, onUpdate }: { node: ComponentNode; onBack: () => void; onUpdate: (settings: Record<string, unknown>) => void }) {
  const settings = node.settings || {};
  const update = (key: string, value: unknown) => onUpdate({ ...settings, [key]: value });
  const isLayout = ['container', 'row', 'column'].includes(node.type);
  const value = (key: string, fallback = '') => String(settings[key] ?? fallback);

  return (
    <div className="section-settings">
      <button className="section-settings-back" onClick={onBack}>← Back to Layers</button>
      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-primary)' }}>
        {node.label}
      </h4>
      <div className="section-type" style={{ marginBottom: 16 }}>{node.type.toUpperCase()} Component</div>

      {(node.type === 'headline' || node.type === 'paragraph') && (
        <>
          <div className="form-group">
            <label className="label">Text</label>
            <textarea className="input" rows={node.type === 'paragraph' ? 5 : 2} value={value('text')} onChange={e => update('text', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Font Size</label>
            <input type="number" className="input" value={Number(settings.fontSize || (node.type === 'headline' ? 36 : 16))} onChange={e => update('fontSize', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="label">Text Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="color" className="input" style={{ width: '42px', height: '38px', padding: '4px' }} value={value('color', '#ffffff')} onChange={e => update('color', e.target.value)} />
              <input className="input" value={value('color', 'var(--sf-text)')} onChange={e => update('color', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Text Align</label>
            <select className="input" value={value('textAlign', 'left')} onChange={e => update('textAlign', e.target.value)}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </>
      )}

      {node.type === 'button' && (
        <>
          <div className="form-group">
            <label className="label">Button Label</label>
            <input className="input" value={value('text')} onChange={e => update('text', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Link</label>
            <PagePicker value={value('link')} onChange={url => update('link', url)} />
            <input className="input" style={{ marginTop: 8 }} value={value('link')} onChange={e => update('link', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Background</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="color" className="input" style={{ width: '42px', height: '38px', padding: '4px' }} value={value('color', '#6366f1')} onChange={e => update('color', e.target.value)} />
              <input className="input" value={value('color', 'var(--sf-primary)')} onChange={e => update('color', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Text Color</label>
            <input className="input" value={value('textColor', '#ffffff')} onChange={e => update('textColor', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Border Radius</label>
            <input className="input" value={value('borderRadius', '8px')} onChange={e => update('borderRadius', e.target.value)} />
          </div>
        </>
      )}

      {node.type === 'image' && (
        <>
          <MediaInput label="Image URL" value={value('url')} onChange={url => update('url', url)} />
          <div className="form-group">
            <label className="label">Alt Text</label>
            <input className="input" value={value('alt')} onChange={e => update('alt', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Width</label>
            <input className="input" value={value('width', '100%')} onChange={e => update('width', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Border Radius</label>
            <input className="input" value={value('radius', '8px')} onChange={e => update('radius', e.target.value)} />
          </div>
        </>
      )}

      {node.type === 'spacer' && (
        <div className="form-group">
          <label className="label">Height</label>
          <input type="number" className="input" value={Number(settings.height || 40)} onChange={e => update('height', `${e.target.value}px`)} />
        </div>
      )}

      {node.type === 'divider' && (
        <div className="form-group">
          <label className="label">Border Color</label>
          <input type="color" className="input" style={{ height: '38px', padding: '4px' }} value={value('borderColor', '#333333')} onChange={e => update('borderColor', e.target.value)} />
        </div>
      )}

      {isLayout && (
        <>
          <div className="settings-group-title" style={{ marginTop: 20 }}>Layout & Style</div>
          
          <div className="form-group">
            <label className="label">Padding</label>
            <input className="input" value={value('padding')} onChange={e => update('padding', e.target.value)} placeholder="e.g. 24px" />
          </div>
          <div className="form-group">
            <label className="label">Margin</label>
            <input className="input" value={value('margin')} onChange={e => update('margin', e.target.value)} placeholder="e.g. 0 auto" />
          </div>
          <div className="form-group">
            <label className="label">Max Width</label>
            <input className="input" value={value('maxWidth')} onChange={e => update('maxWidth', e.target.value)} placeholder="e.g. 1200px" />
          </div>
          
          <div className="form-group">
            <label className="label">Background Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
               <input type="color" className="input" style={{ width: '42px', height: '38px', padding: '4px' }} value={value('backgroundColor', 'transparent')} onChange={e => update('backgroundColor', e.target.value)} />
               <input className="input" value={value('backgroundColor', 'transparent')} onChange={e => update('backgroundColor', e.target.value)} />
            </div>
          </div>
          
          <div className="form-group">
            <label className="label">Border Radius</label>
            <input className="input" value={value('borderRadius')} onChange={e => update('borderRadius', e.target.value)} placeholder="e.g. 12px" />
          </div>

          {(node.type === 'container' || node.type === 'row') && (
             <>
               <div className="form-group">
                 <label className="label">Gap</label>
                 <input className="input" value={value('gap', '16px')} onChange={e => update('gap', e.target.value)} placeholder="e.g. 16px" />
               </div>
               <div className="form-group">
                 <label className="label">Justify Content</label>
                 <select className="input" value={value('justifyContent', 'flex-start')} onChange={e => update('justifyContent', e.target.value)}>
                   <option value="flex-start">Start</option>
                   <option value="center">Center</option>
                   <option value="space-between">Space Between</option>
                   <option value="space-around">Space Around</option>
                   <option value="flex-end">End</option>
                 </select>
               </div>
               <div className="form-group">
                 <label className="label">Align Items</label>
                 <select className="input" value={value('alignItems', 'stretch')} onChange={e => update('alignItems', e.target.value)}>
                   <option value="stretch">Stretch</option>
                   <option value="flex-start">Start</option>
                   <option value="center">Center</option>
                   <option value="flex-end">End</option>
                 </select>
               </div>
             </>
          )}

          {node.type === 'column' && (
             <div className="form-group">
               <label className="label">Flex (e.g. 1, or 0 0 50%)</label>
               <input className="input" value={value('flex', '1')} onChange={e => update('flex', e.target.value)} />
             </div>
          )}
        </>
      )}
    </div>
  );
}

interface SettingsPanelProps {
  selectedNodeId?: string | null;
  onClearSection: () => void;
  previewPage: string;
  onSelectSectionId?: (id: string | null) => void;
  onSelectPage?: (page: string) => void;
}

type TabId = 'pages' | 'theme' | 'navigation' | 'store' | 'element';

export default function SettingsPanel({ 
  selectedNodeId,
  onClearSection, 
  previewPage,
  onSelectSectionId,
  onSelectPage
}: SettingsPanelProps) {
  const { theme, setToken, updateNode, findNodeById, saveTheme, exportJSON, resetTheme, isSaving } = useTheme();
  const [tab, setTab] = useState<TabId>('pages');
  const [showExport, setShowExport] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveTheme();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedNode = selectedNodeId && !selectedNodeId.startsWith('subpage-') ? findNodeById(selectedNodeId) : null;
  const isSubpage = selectedNodeId?.startsWith('subpage-');

  const activeTab = (selectedNode || isSubpage) ? 'element' : tab;

  // ── Header/Footer Navigation Menu Helpers ─────────────────────────────────
  const headerLinks = theme.headerMenu || [];
  const handleAddHeaderLink = () => setToken('headerMenu', [...headerLinks, { id: `hm-${Date.now()}`, label: 'New Link', url: '/storefront/products' }]);
  const handleUpdateHeaderLink = (id: string, field: 'label' | 'url', value: string) => setToken('headerMenu', headerLinks.map((link: any) => link.id === id ? { ...link, [field]: value } : link));
  const handleRemoveHeaderLink = (id: string) => setToken('headerMenu', headerLinks.filter((link: any) => link.id !== id));
  
  return (
    <div className="panel-settings">
      <div className="settings-tabs">
        {(['pages', 'theme', 'navigation', 'store'] as TabId[]).map(t => (
          <button
            key={t}
            className={`settings-tab${activeTab === t ? ' active' : ''}`}
            onClick={() => { setTab(t); onClearSection(); }}
          >
            {t === 'pages' ? '📁 Pages' : t === 'theme' ? '🎨 Theme' : t === 'navigation' ? '🔗 Nav' : '🏪 Store'}
          </button>
        ))}
        <button
          className={`settings-tab${activeTab === 'element' ? ' active' : ''}`}
          onClick={() => { if (!selectedNode && !isSubpage) return; setTab('element'); }}
          style={{ opacity: (selectedNode || isSubpage) ? 1 : 0.4, cursor: (selectedNode || isSubpage) ? 'pointer' : 'not-allowed' }}
        >
          ⚙️ Element
        </button>
      </div>

      <div className="settings-scroll scroll-y">

        {/* ── PAGES SETTINGS ────────────────────────────────────────────── */}
        {!selectedNode && !isSubpage && activeTab === 'pages' && (
          <>
            <div className="settings-group">
              <div className="settings-group-title">Storefront Pages</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {PAGES_LIST.map(p => (
                  <button
                    key={p.path}
                    className={`section-card${previewPage === p.path ? ' active' : ''}`}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}
                    onClick={() => onSelectPage?.(p.path)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.1rem' }}>
                        {p.path === '/' ? '🏠' : p.path === '/products' ? '🛍️' : p.path === '/product/:slug' ? '✨' : p.path === '/about' ? '📖' : '📞'}
                      </span>
                      <span style={{ fontWeight: previewPage === p.path ? 700 : 500 }}>{p.label}</span>
                    </div>
                    {previewPage === p.path && (
                      <span style={{ fontSize: '0.75rem', background: 'var(--color-brand)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── SUBPAGE SETTINGS ──────────────────────────────────────────── */}
        {isSubpage && (
          <div className="section-settings">
            <button className="section-settings-back" onClick={onClearSection}>← Back</button>
            
            {previewPage === '/about' && (
              <>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '16px', color: 'var(--color-primary)' }}>📖 About Us Config</h4>
                <div className="form-group"><label className="label">Story Headline Title</label><input className="input" value={theme.aboutPageTitle || ''} onChange={e => setToken('aboutPageTitle', e.target.value)} /></div>
                <div className="form-group"><label className="label">Story Subheadline Desc</label><input className="input" value={theme.aboutPageDesc || ''} onChange={e => setToken('aboutPageDesc', e.target.value)} /></div>
                <div className="form-group"><label className="label">Our Main Story Text</label><textarea className="input" rows={6} value={theme.aboutPageStory || ''} onChange={e => setToken('aboutPageStory', e.target.value)} /></div>
                <div className="form-group"><label className="label">Our Mission Text</label><textarea className="input" rows={6} value={theme.aboutPageMission || ''} onChange={e => setToken('aboutPageMission', e.target.value)} /></div>
                <SubpageDesignOverrides prefix="aboutPage" theme={theme} setToken={setToken} />
              </>
            )}

            {previewPage === '/contact' && (
              <>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '16px', color: 'var(--color-primary)' }}>📞 Contact Config</h4>
                <div className="form-group"><label className="label">Get in Touch Headline</label><input className="input" value={theme.contactPageHeadline || ''} onChange={e => setToken('contactPageHeadline', e.target.value)} /></div>
                <div className="form-group"><label className="label">Physical Address</label><input className="input" value={theme.contactPageAddress || ''} onChange={e => setToken('contactPageAddress', e.target.value)} /></div>
                <div className="form-group"><label className="label">Support Email</label><input className="input" value={theme.contactPageEmail || ''} onChange={e => setToken('contactPageEmail', e.target.value)} /></div>
                <div className="form-group"><label className="label">Support Phone</label><input className="input" value={theme.contactPagePhone || ''} onChange={e => setToken('contactPagePhone', e.target.value)} /></div>
                <SubpageDesignOverrides prefix="contactPage" theme={theme} setToken={setToken} />
              </>
            )}

            {previewPage === '/products' && (
              <>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '16px', color: 'var(--color-primary)' }}>🛍️ Products Catalog Settings</h4>
                <div className="form-group"><label className="label">Products Header Title</label><input className="input" value={theme.productsPageHeaderTitle || ''} onChange={e => setToken('productsPageHeaderTitle', e.target.value)} /></div>
                <div className="form-group"><label className="label">Products Subheadline Desc</label><input className="input" value={theme.productsPageHeaderDesc || ''} onChange={e => setToken('productsPageHeaderDesc', e.target.value)} /></div>
                <SubpageDesignOverrides prefix="productsPage" theme={theme} setToken={setToken} />
              </>
            )}
            
            {previewPage === '/product/:slug' && (
              <>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '16px', color: 'var(--color-primary)' }}>✨ Product Detail Settings</h4>
                <div className="form-group"><label className="label">Purchase Button Label</label><input className="input" value={theme.productDetailPageBtnText || ''} onChange={e => setToken('productDetailPageBtnText', e.target.value)} /></div>
                <SubpageDesignOverrides prefix="productDetailPage" theme={theme} setToken={setToken} />
              </>
            )}
          </div>
        )}

        {/* ── COMPONENT TREE NODE SETTINGS ─────────────────────────────── */}
        {selectedNode && (
          <NodeSettings
            node={selectedNode}
            onBack={onClearSection}
            onUpdate={(settings) => updateNode(selectedNode.id, settings)}
          />
        )}

        {/* ── THEME SETTINGS ────────────────────────────────────────────── */}
        {!selectedNode && !isSubpage && activeTab === 'theme' && (
          <>
            <div className="settings-group">
              <div className="settings-group-title">Brand Colors</div>
              <div className="color-grid">
                <div className="form-group"><label className="label">Primary</label><input type="color" className="input" style={{ height: '38px', padding: '4px' }} value={theme.colorPrimary} onChange={e => setToken('colorPrimary', e.target.value)} /></div>
                <div className="form-group"><label className="label">Secondary</label><input type="color" className="input" style={{ height: '38px', padding: '4px' }} value={theme.colorSecondary} onChange={e => setToken('colorSecondary', e.target.value)} /></div>
                <div className="form-group"><label className="label">Background</label><input type="color" className="input" style={{ height: '38px', padding: '4px' }} value={theme.colorBackground} onChange={e => setToken('colorBackground', e.target.value)} /></div>
                <div className="form-group"><label className="label">Text Color</label><input type="color" className="input" style={{ height: '38px', padding: '4px' }} value={theme.colorText} onChange={e => setToken('colorText', e.target.value)} /></div>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-group-title">Typography</div>
              <div className="font-selector">
                <div className="form-group">
                  <label className="label">Heading Font</label>
                  <select className="input" value={theme.fontHeading} onChange={e => setToken('fontHeading', e.target.value)}>
                    {FONT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Body Font</label>
                  <select className="input" value={theme.fontBody} onChange={e => setToken('fontBody', e.target.value)}>
                    {FONT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── NAVIGATION SETTINGS ────────────────────────────────────────── */}
        {!selectedNode && !isSubpage && activeTab === 'navigation' && (
          <>
            <div className="settings-group">
              <div className="settings-group-title">Header Navigation</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {headerLinks.map((link: any, idx: number) => (
                  <div key={link.id} className="glass-card" style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary, #6366f1)' }}>Link #{idx + 1}</span>
                      <button className="btn-icon btn-xs text-danger" onClick={() => handleRemoveHeaderLink(link.id)}>✕</button>
                    </div>
                    <div className="form-group" style={{ marginBottom: '6px' }}>
                      <input className="input input-sm" placeholder="Label" value={link.label} onChange={e => handleUpdateHeaderLink(link.id, 'label', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '6px' }}>
                      <PagePicker value={link.url} onChange={val => handleUpdateHeaderLink(link.id, 'url', val)} />
                    </div>
                  </div>
                ))}
                <button className="btn btn-secondary btn-sm w-full" onClick={handleAddHeaderLink}>
                  ➕ Add Header Link
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STORE INFO ────────────────────────────────────────────────── */}
        {!selectedNode && !isSubpage && activeTab === 'store' && (
          <div className="settings-group">
            <div className="settings-group-title">Store Identity</div>
            <div className="form-group">
              <label className="label">Public Store Name</label>
              <input className="input" value={theme.storeName} onChange={e => setToken('storeName', e.target.value)} />
            </div>
            <MediaInput label="Brand Logo" value={theme.logoUrl} onChange={url => setToken('logoUrl', url)} />
          </div>
        )}
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary w-full" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : saved ? '✓ Saved!' : '💾 Save Theme'}
        </button>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className="btn btn-secondary flex-1 btn-sm" onClick={() => setShowExport(true)}>
            Export JSON
          </button>
          <button className="btn btn-ghost flex-1 btn-sm" onClick={resetTheme}>
            Reset
          </button>
        </div>
      </div>

      {showExport && (
        <div className="modal-overlay" onClick={() => setShowExport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Theme JSON</h3>
              <button className="btn-icon" onClick={() => setShowExport(false)}>✕</button>
            </div>
            <pre className="code-block">{exportJSON()}</pre>
            <button className="btn btn-primary w-full" style={{ marginTop: 'var(--sp-4)' }} onClick={() => { navigator.clipboard.writeText(exportJSON()); }}>
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
