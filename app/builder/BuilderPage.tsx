import { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from '../lib/theme';
import SectionsPanel  from './SectionsPanel';
import BuilderCanvas  from './BuilderCanvas';
import SettingsPanel  from './SettingsPanel';
import { setBuilderApiKey } from '../lib/api';
import '../builder/builder.css';

interface BuilderProps {
  initialData?: {
    project: any;
    error: string | null;
  };
}

function BuilderInner({ projectId, project }: { projectId?: string; project: any }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<string>('/');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const { theme, setToken, updateNode, saveTheme, isSaving } = useTheme();

  const handlePlayPreview = () => {
    const pagePath = previewPage === '/product/:slug' ? '/product/demo-product' : previewPage;
    let url = `/storefront${pagePath}`;
    if (projectId) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}projectId=${projectId}`;
    }
    window.open(url, '_blank');
  };

  // WYSIWYG visual sync: Open the corresponding settings panel when the user clicks an element in the preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'orcayo:field-selected') {
        const fieldName = e.data.field;
        if (fieldName.startsWith('aboutPage')) {
          setPreviewPage('/about');
          setSelectedNodeId('subpage-/about');
        } else if (fieldName.startsWith('contact')) {
          setPreviewPage('/contact');
          setSelectedNodeId('subpage-/contact');
        } else if (fieldName === 'storeName') {
          setSelectedNodeId(null);
        } else if (fieldName.startsWith('layout.')) {
          const nodeId = fieldName.split('.')[1];
          if (nodeId) setSelectedNodeId(nodeId);
        } else if (fieldName.startsWith('hero') || fieldName === 'heroHeadline' || fieldName === 'heroSubheadline' || fieldName === 'heroImage') {
          const heroNode = theme.layout.find((s: any) => s.settings?.preset === 'hero');
          if (heroNode) {
            setPreviewPage('/');
            setSelectedNodeId(heroNode.id);
          }
        }
      } else if (e.data?.type === 'orcayo:field-update') {
        const { field, value } = e.data;
        if (field.startsWith('layout.')) {
          const nodeId = field.split('.')[1];
          if (nodeId) updateNode(nodeId, { text: value });
        } else {
          setToken(field as any, value);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [theme.layout, setToken, updateNode]);

  // Template clone state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  // Settings Gearbox & Tutorials Modal state
  const [showGearboxDropdown, setShowGearboxDropdown] = useState(false);
  const [showTutorialsModal, setShowTutorialsModal] = useState(false);

  useEffect(() => {
    if (!showGearboxDropdown) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.gearbox-container')) {
        setShowGearboxDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showGearboxDropdown]);

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsCloning(true);
    try {
      const token = new URLSearchParams(window.location.search).get('token') || '';
      const res = await fetch('/templates/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: project.templateId,
          title: newProjectName
        })
      });
      const data = await res.json();
      if (data.id || data.project?.id) {
        const newId = data.id || data.project.id;
        window.location.href = `/?projectId=${newId}&token=${token}`;
      } else {
        alert(data.error || 'Cloning failed');
      }
    } catch (err: any) {
      console.error('[Preview Clone] Error:', err);
      alert('Cloning failed: ' + err.message);
    } finally {
      setIsCloning(false);
      setShowCloneModal(false);
    }
  };

  return (
    <div className="builder-shell">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="builder-topbar">
        {/* Logo */}
        <div className="topbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/auth-logo.png" alt="ORCAYO" style={{ height: '24px', width: 'auto' }} />
        </div>

        {/* Center — store name & minimalist viewport toggles */}
        <div className="topbar-center" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-brand">
              {project?.isTemplatePreview ? 'TEMPLATE PREVIEW' : 'LIVE PREVIEW'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              {theme.storeName}
            </span>
          </div>

          <div className="viewport-toggle">
            <button
              className={`btn-icon${viewport === 'desktop' ? ' active' : ''}`}
              onClick={() => setViewport('desktop')}
              title="Desktop (1200px)"
              aria-label="Desktop (1200px)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </button>
            <button
              className={`btn-icon${viewport === 'tablet' ? ' active' : ''}`}
              onClick={() => setViewport('tablet')}
              title="Tablet (768px)"
              aria-label="Tablet (768px)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </button>
            <button
              className={`btn-icon${viewport === 'mobile' ? ' active' : ''}`}
              onClick={() => setViewport('mobile')}
              title="Mobile (390px)"
              aria-label="Mobile (390px)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions & Settings Dropdown */}
        <div className="topbar-actions" style={{ gap: '12px' }}>
          {!project?.isTemplatePreview && (
            <div className="save-status" style={{ marginRight: '4px' }}>
              <div className={`save-dot ${isSaving ? 'saving' : ''}`} />
              {isSaving ? 'Saving to Cloud...' : 'Draft Saved'}
            </div>
          )}

          {/* Play Preview Button */}
          <button
            className="btn-icon"
            onClick={handlePlayPreview}
            title="Open Live Preview in New Tab"
            aria-label="Open Live Preview in New Tab"
            style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              transition: 'background var(--transition-base), color var(--transition-base)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>

          {/* Settings Gearbox Dropdown */}
          <div className="gearbox-container">
            <button 
              className={`gearbox-trigger${showGearboxDropdown ? ' active' : ''}`}
              onClick={() => setShowGearboxDropdown(!showGearboxDropdown)}
              title="Builder Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z"></path>
              </svg>
            </button>

            {showGearboxDropdown && (
              <div className="gearbox-dropdown">
                {/* Publish / Customize storefront */}
                {project?.isTemplatePreview ? (
                  <button 
                    className="gearbox-item"
                    onClick={() => {
                      setShowGearboxDropdown(false);
                      setNewProjectName(`Customized ${project.title.replace('Preview: ', '')}`);
                      setShowCloneModal(true);
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                      <polyline points="2 17 12 22 22 17"></polyline>
                      <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                    Customize & Save
                  </button>
                ) : (
                  <button 
                    className="gearbox-item"
                    disabled={isSaving}
                    onClick={() => {
                      setShowGearboxDropdown(false);
                      saveTheme({ publish: true });
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    {isSaving ? 'Publishing...' : 'Publish'}
                  </button>
                )}

                {/* Go to settings of the builder */}
                <button 
                  className="gearbox-item"
                  onClick={() => {
                    setShowGearboxDropdown(false);
                    setSelectedNodeId(null);
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z"></path>
                  </svg>
                  Builder Settings
                </button>

                <div className="gearbox-divider"></div>

                {/* Watch tutorials */}
                <button 
                  className="gearbox-item"
                  onClick={() => {
                    setShowGearboxDropdown(false);
                    setShowTutorialsModal(true);
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                  Watch Tutorials
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Three panels ─────────────────────────────────────────────────── */}
      <div 
        className="builder-panels"
        style={{
          gridTemplateColumns: `${leftSidebarOpen ? 'var(--panel-left)' : '0px'} 1fr ${rightSidebarOpen ? 'var(--panel-right)' : '0px'}`
        }}
      >
        {/* Left Sidebar Wrapper */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: leftSidebarOpen ? 'var(--panel-left)' : '0px',
          overflow: 'hidden',
          borderRight: leftSidebarOpen ? '1px solid var(--color-border)' : 'none',
          transition: 'width var(--transition-fast)',
          background: 'var(--color-surface-0)',
          flexShrink: 0
        }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SectionsPanel
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              previewPage={previewPage}
            />
          </div>
          <div style={{ height: '48px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 8px', background: 'var(--color-surface-0)', flexShrink: 0 }}>
            <button
              onClick={() => setLeftSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-brand)';
                e.currentTarget.style.background = 'var(--color-surface-1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.background = 'none';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span>Collapse Sidebar</span>
            </button>
          </div>
        </div>

        {/* Canvas Area Container */}
        <div className="canvas-area">
          {/* Floating Left Sidebar Expand Trigger */}
          {!leftSidebarOpen && (
            <button
              onClick={() => setLeftSidebarOpen(true)}
              title="Expand Sections Panel"
              style={{
                position: 'absolute',
                left: '16px',
                bottom: '16px',
                zIndex: 95,
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--color-surface-0)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-brand)';
                e.currentTarget.style.borderColor = 'var(--color-brand)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}

          {/* Floating Right Sidebar Expand Trigger */}
          {!rightSidebarOpen && (
            <button
              onClick={() => setRightSidebarOpen(true)}
              title="Expand Inspector Panel"
              style={{
                position: 'absolute',
                right: '16px',
                bottom: '16px',
                zIndex: 95,
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--color-surface-0)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-brand)';
                e.currentTarget.style.borderColor = 'var(--color-brand)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}

          {project?.isTemplatePreview && (
            <div className="template-preview-bar">
              <span>✨</span>
              You are previewing the <strong>{project.title.replace('Preview: ', '')}</strong> template. Click <strong>"Customize & Save"</strong> to save it under your account.
            </div>
          )}
          <BuilderCanvas 
            previewPage={previewPage}
            setPreviewPage={setPreviewPage}
            viewport={viewport}
            setViewport={setViewport}
          />
        </div>

        {/* Right Sidebar Wrapper */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: rightSidebarOpen ? 'var(--panel-right)' : '0px',
          overflow: 'hidden',
          borderLeft: rightSidebarOpen ? '1px solid var(--color-border)' : 'none',
          transition: 'width var(--transition-fast)',
          background: 'var(--color-surface-0)',
          flexShrink: 0
        }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SettingsPanel
              selectedNodeId={selectedNodeId}
              onClearSection={() => {
                setSelectedNodeId(null);
              }}
              previewPage={previewPage}
              onSelectSectionId={setSelectedNodeId}
              onSelectPage={(pagePath) => {
                setPreviewPage(pagePath);
              }}
            />
          </div>
          <div style={{ height: '48px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 8px', background: 'var(--color-surface-0)', flexShrink: 0 }}>
            <button
              onClick={() => setRightSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-brand)';
                e.currentTarget.style.background = 'var(--color-surface-1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.background = 'none';
              }}
            >
              <span>Collapse Sidebar</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Naming / Clone Modal ────────────────────────────────────────── */}
      {showCloneModal && (
        <div className="modal-overlay" onClick={() => setShowCloneModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Save Storefront Project</h3>
              <button className="btn-icon" onClick={() => setShowCloneModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleClone}>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'left' }}>
                Give your new landing page storefront a beautiful name to save it under your dashboard project list.
              </p>
              <input
                className="sf-input"
                style={{ width: '100%', marginBottom: '20px', background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: '#fff' }}
                placeholder="My Customized Store"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                required
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCloneModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isCloning}>
                  {isCloning ? 'Saving...' : 'Save & Customize →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tutorials Modal ─────────────────────────────────────────────── */}
      {showTutorialsModal && (
        <div className="modal-overlay" onClick={() => setShowTutorialsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(760px, 94vw)' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>Orcayo Builder Tutorials</h3>
              <button className="btn-icon" onClick={() => setShowTutorialsModal(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="2" y1="2" x2="14" y2="14"></line>
                  <line x1="14" y1="2" x2="2" y2="14"></line>
                </svg>
              </button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)', background: '#000' }}>
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Orcayo Tutorial"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            </div>
            <p style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
              Learn how to design stunning, high-converting storefronts, add product listings, customize booking slots, and publish your site globally with Orcayo Customizer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuilderPage({ initialData }: BuilderProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // For local developer convenience, allow direct bypass on localhost/127.0.0.1
    const isLocalhost = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      setIsAuthorized(true);
      return;
    }

    const referrer = document.referrer || '';
    // Restrict to our frontend dashboard domain or allow if loaded with valid backend verified project/token query
    const isAuthorizedOrigin = referrer.includes('orcayoui.wattlesol.com') || referrer.includes('wattlesol.com');
    const urlParams = new URLSearchParams(window.location.search);
    const hasToken = urlParams.has('token');
    const hasProject = !!initialData?.project;

    if (isAuthorizedOrigin || hasToken || hasProject) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }

    // Store API key if provided by loader
    if (initialData?.project?.apiKey) {
      setBuilderApiKey(initialData.project.apiKey);
    }
  }, [initialData]);

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    const referrer = document.referrer || '';
    if (referrer && (referrer.includes('orcayoui.wattlesol.com') || referrer.includes('wattlesol.com'))) {
      window.location.href = referrer;
    } else {
      window.location.href = 'https://orcayoui.wattlesol.com/dashboard/landing-pages/all';
    }
  };

  if (initialData?.error) {
    return (
      <div className="security-wall-container">
        <div className="security-card">
          <div className="security-icon">⚠️</div>
          <h2>Project Error</h2>
          <p>{initialData.error}</p>
          <button onClick={handleGoBack} className="btn btn-secondary" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0d1a', color: '#fff' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Securing session...</div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="security-wall-container">
        <div className="security-card">
          <div className="security-icon">🔒</div>
          <h2>Access Restricted</h2>
          <p>
            The Orcayo Customizer cannot be accessed directly via URL. It must be launched securely from within the Orcayo Developer Portal.
          </p>
          <button onClick={handleGoBack} className="btn btn-primary" style={{ border: 'none', cursor: 'pointer', display: 'inline-block', textDecoration: 'none', fontFamily: 'inherit' }}>
            Go to Developer Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider initialTheme={initialData?.project?.themeData} projectId={initialData?.project?.id}>
      <BuilderInner projectId={initialData?.project?.id} project={initialData?.project} />
    </ThemeProvider>
  );
}
