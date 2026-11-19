import { useEffect, useRef, useState, useCallback } from 'react';
import graceTemplateCss from './graceTemplateCss';
import { customBlocks } from './customBlocks';
import AiAgentPanel from './AiAgentPanel';
import { profileStore, type StoreProfile } from './ai/storeProfiler';
import { starterHtml, starterCss, customCss } from './starterTemplates';
import {
  Bot,
  Code2,
  Download,
  Eye,
  Layers3,
  Monitor,
  Redo2,
  Save,
  Search,
  Sparkles,
  Smartphone,
  Tablet,
  Undo2,
  ArrowLeft,
  ExternalLink,
  SlidersHorizontal,
  MessageSquarePlus,
} from 'lucide-react';
import AnnotationPopover, { type ComponentAnnotation } from './AnnotationPopover';
import './grapesBuilder.css';
import { authFetch } from './authFetch';

interface GrapesBuilderProps {
  initialData?: {
    project: any;
    error: string | null;
  };
}

export default function GrapesBuilderPage({ initialData }: GrapesBuilderProps) {
  const devices = [
    { id: 'Desktop', icon: Monitor },
    { id: 'Tablet', icon: Tablet },
    { id: 'Mobile', icon: Smartphone },
  ];
  const project = initialData?.project;
  const projectId = project?.id;
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [builderMode, setBuilderMode] = useState<'ai' | 'manual'>('ai');
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [activeAnnotationTarget, setActiveAnnotationTarget] = useState<any>(null);
  const [annotations, setAnnotations] = useState<ComponentAnnotation[]>([]);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || localStorage.getItem('orcayo_access_token') || '';
  }, []);

  const authToken = typeof window !== 'undefined' ? getToken() : '';

  const toggleAnnotateMode = () => {
    setIsAnnotating(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        (window as any).__ORCAYO_ANNOTATE_ACTIVE__ = next;
      }
      if (!next) {
        setActiveAnnotationTarget(null);
      }
      return next;
    });
  };

  // Proactively profile the store's business type on mount
  useEffect(() => {
    async function loadStoreProfile() {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const activeStoreId = urlParams.get('storeId') || '';
      try {
        const res = await authFetch(`/api/builder/store-profile?storeId=${encodeURIComponent(activeStoreId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.profile) {
            setStoreProfile(json.profile);
          }
        }
      } catch (e) {
        console.warn('Failed to load store profile', e);
      }
    }
    loadStoreProfile();
  }, []);

  const getCanvasContext = useCallback(() => {
    if (!editorRef.current) return { sections: [], summary: 'Empty canvas' };
    try {
      const wrapper = editorRef.current.getWrapper();
      const found: string[] = [];
      const sectionTypes = [
        { name: 'Header / Navigation', selector: 'header, .grace-header, .site-nav, .salon-nav' },
        { name: 'Hero Banner', selector: '.grace-hero, .hero-section, .salon-hero, .center-hero' },
        { name: 'About Us', selector: '#about, .grace-about, .salon-about' },
        { name: 'Services Menu', selector: '#services, .grace-service-grid, .salon-services' },
        { name: 'Why Choose Us', selector: '.grace-choose, .feature-section' },
        { name: 'Photo Gallery', selector: '#gallery, .grace-gallery, .salon-gallery' },
        { name: 'Team / Specialists', selector: '.grace-team, .team-section' },
        { name: 'Pricing Plans', selector: '#pricing, .grace-price-grid, .salon-pricing' },
        { name: 'Testimonials / Reviews', selector: '.grace-testimonial, .quote-section' },
        { name: 'Video Showcase', selector: '#video, .grace-video' },
        { name: 'Blog / Articles', selector: '#blog, .grace-blog' },
        { name: 'Footer', selector: 'footer, .grace-footer, .salon-footer' },
        { name: 'Featured Products Grid', selector: '.storefront-product-grid, .product-section, .section-products' },
        { name: 'Appointment Booking Form', selector: '.salon-booking, .section-booking' },
        { name: 'WhatsApp Consultation', selector: '.whatsapp-consultation-section' },
      ];

      sectionTypes.forEach(({ name, selector }) => {
        const match = wrapper.find(selector);
        if (match && match.length > 0) {
          found.push(name);
        }
      });

      return {
        sections: found,
        summary: found.length > 0 ? found.join(', ') : 'Starter layout',
      };
    } catch {
      return { sections: [], summary: 'Starter layout' };
    }
  }, []);

  const handleApplyAiBlock = (html: string, title: string) => {
    if (editorRef.current) {
      editorRef.current.addComponents(html);
      setStatus('Saved');
      setTimeout(() => setStatus('Ready'), 2500);
    }
  };

  const handleUpdateCanvasElement = (selector: string, newHtml: string, title: string) => {
    if (!editorRef.current) return;
    try {
      const wrapper = editorRef.current.getWrapper();
      let targetComp = null;
      const selectorsToTry = selector.split(",").map((s: string) => s.trim()).filter(Boolean);
      for (const sel of selectorsToTry) {
        const matches = wrapper.find(sel);
        if (matches && matches.length > 0) {
          targetComp = matches[0];
          break;
        }
      }
      if (targetComp) {
        targetComp.replaceWith(newHtml);
        setStatus('Saved');
        setTimeout(() => setStatus('Ready'), 2500);
      } else {
        editorRef.current.addComponents(newHtml);
        setStatus('Saved');
        setTimeout(() => setStatus('Ready'), 2500);
      }
    } catch (err) {
      console.error('[GrapesJS Update Element Error]', err);
      setStatus('Error');
    }
  };
  const [device, setDevice] = useState('Desktop');
  const [status, setStatus] = useState<'Ready' | 'Saving...' | 'Saved' | 'Error'>('Ready');
  const [blockSearch, setBlockSearch] = useState('');

// (getToken moved to top level of component)

  // Save to Orcayo backend API
  const handleSaveToBackend = useCallback(async (ed: any) => {
    if (!projectId || project?.isTemplatePreview) {
      setStatus('Saved');
      return;
    }

    try {
      setStatus('Saving...');
      const html = ed.getHtml();
      const css = ed.getCss();
      const projectData = ed.getProjectData();

      const themePayload = {
        version: 'grapesjs-v1',
        html,
        css,
        projectData,
      };

      const token = getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const updateUrl = `/api/projects/${projectId}/update${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      const response = await fetch(updateUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          themeData: JSON.stringify(themePayload),
        }),
      });

      if (!response.ok) {
        throw new Error(`Save failed with status ${response.status}`);
      }

      setStatus('Saved');
      setTimeout(() => setStatus('Ready'), 2500);
    } catch (err) {
      console.error('[GrapesJS Save Error]', err);
      setStatus('Error');
    }
  }, [projectId, project, getToken]);

  useEffect(() => {
    if (editorRef.current || typeof window === 'undefined') return;

    let destroyed = false;

    async function initEditor() {
      const [
        grapesjsModule,
        blocksBasicModule,
        pluginFormsModule,
        pluginNavbarModule,
        pluginTabsModule,
        pluginCustomCodeModule,
        pluginTouchModule,
        parserPostcssModule,
        pluginStyleBgModule,
        pluginExportModule,
      ] = await Promise.all([
        import('grapesjs'),
        import('grapesjs-blocks-basic'),
        import('grapesjs-plugin-forms'),
        import('grapesjs-navbar'),
        import('grapesjs-tabs'),
        import('grapesjs-custom-code'),
        import('grapesjs-touch'),
        import('grapesjs-parser-postcss'),
        import('grapesjs-style-bg'),
        import('grapesjs-plugin-export'),
      ]);

      // Import GrapesJS CSS in browser
      await import('grapesjs/dist/css/grapes.min.css');

      if (destroyed) return;

      const grapesjs = grapesjsModule.default || grapesjsModule;
      const blocksBasic = blocksBasicModule.default || blocksBasicModule;
      const pluginForms = pluginFormsModule.default || pluginFormsModule;
      const pluginNavbar = pluginNavbarModule.default || pluginNavbarModule;
      const pluginTabs = pluginTabsModule.default || pluginTabsModule;
      const pluginCustomCode = pluginCustomCodeModule.default || pluginCustomCodeModule;
      const pluginTouch = pluginTouchModule.default || pluginTouchModule;
      const parserPostcss = parserPostcssModule.default || parserPostcssModule;
      const pluginStyleBg = pluginStyleBgModule.default || pluginStyleBgModule;
      const pluginExport = pluginExportModule.default || pluginExportModule;

    // Determine initial components & styles
    let initialHtml = starterHtml;
    let initialCss = `${starterCss}\n${graceTemplateCss}\n${customCss}`;
    let initialProjectData: any = null;

    if (project?.themeData) {
      try {
        const parsed = typeof project.themeData === 'string' ? JSON.parse(project.themeData) : project.themeData;
        if (parsed.version === 'grapesjs-v1' || (parsed.html && parsed.css)) {
          if (parsed.html) initialHtml = parsed.html;
          if (parsed.css) initialCss = `${starterCss}\n${parsed.css}`;
          if (parsed.projectData) initialProjectData = parsed.projectData;
        }
      } catch (e) {
        console.warn('[GrapesBuilder] Non-GrapesJS theme data encountered, using starter template', e);
      }
    }

    const editor = grapesjs.init({
      container: '#editor',
      height: '100%',
      fromElement: false,
      storageManager: false, // We handle direct persistence to Orcayo Postgres via API
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Marcellus&family=Inter:wght@400;600;700;800&display=swap',
        ],
      },
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '390px', widthMedia: '640px' },
        ],
      },
      plugins: [
        blocksBasic,
        pluginForms,
        pluginNavbar,
        pluginTabs,
        pluginCustomCode,
        pluginTouch,
        parserPostcss,
        pluginStyleBg,
        pluginExport,
      ],
      pluginsOpts: {
        [blocksBasic as never]: {
          flexGrid: true,
          blocks: ['column1', 'column2', 'column3', 'text', 'link', 'image', 'video', 'map'],
        },
      },
      panels: { defaults: [] },
      blockManager: {
        appendTo: '#blocks',
      },
      layerManager: {
        appendTo: '#layers',
      },
      selectorManager: {
        appendTo: '#selectors',
      },
      styleManager: {
        appendTo: '#styles',
        sectors: [
          {
            name: 'Dimension',
            open: false,
            buildProps: ['width', 'min-height', 'padding'],
            properties: [
              {
                type: 'integer',
                name: 'The Width',
                property: 'width',
                units: ['px', '%'],
                defaults: 'auto',
                min: 0,
              },
            ],
          },
          {
            name: 'Typography',
            open: false,
            buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align'],
          },
          {
            name: 'Decorations',
            open: false,
            buildProps: ['border-radius', 'border', 'box-shadow', 'background-color'],
          },
          {
            name: 'Extra',
            open: false,
            buildProps: ['opacity', 'transition', 'transform'],
          },
        ],
      },
    });

    // Load Custom Blocks & Templates
    customBlocks.forEach((block: any) => editor.BlockManager.add(block.id, block));

    // Categorize Plugin Blocks
    const block = editor.BlockManager.get('tabs');
    block?.set('category', 'Content');

    // Populate Canvas Content
    if (initialProjectData) {
      editor.loadProjectData(initialProjectData);
    } else {
      editor.setComponents(initialHtml);
      editor.setStyle(initialCss);
    }

    // Register Custom App Commands
    editor.Commands.add('app:save', {
      run(ed) {
        handleSaveToBackend(ed);
      },
    });

    editor.Commands.add('app:export-html', {
      run(ed) {
        const html = ed.getHtml();
        const css = ed.getCss();
        const blob = new Blob(
          [
            `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body>${html}</body></html>`,
          ],
          { type: 'text/html' }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${project?.title || 'page'}.html`;
        link.click();
      },
    });

    editor.Commands.add('app:load-salon-template', {
      run(ed) {
        ed.setComponents(starterHtml);
        ed.setStyle(`${starterCss}\n${graceTemplateCss}\n${customCss}`);
        handleSaveToBackend(ed);
      },
    });

    // Component selection listener for Annotation Mode
    editor.on('component:selected', (model: any) => {
      const isAnnotateModeActive = (window as any).__ORCAYO_ANNOTATE_ACTIVE__;
      if (!isAnnotateModeActive || !model) {
        return;
      }
      try {
        const view = model.getView ? model.getView() : null;
        const el = view?.el || null;
        const frameEl = editor.Canvas.getFrameEl();
        if (el && frameEl) {
          const elRect = el.getBoundingClientRect();
          const frameRect = frameEl.getBoundingClientRect();
          const top = frameRect.top + elRect.top - 120;
          const left = frameRect.left + elRect.left;
          const tagName = model.get('tagName') || el.tagName || 'DIV';
          const classes = (model.getClasses ? model.getClasses().join(' ') : '') || el.className || '';
          const textSnippet = (el.innerText || el.textContent || '').trim().slice(0, 80);
          const outerHtml = el.outerHTML || '';
          const selector = tagName.toLowerCase() + (classes ? '.' + classes.split(' ').filter(Boolean).slice(0, 2).join('.') : '');
          setActiveAnnotationTarget({
            position: { top, left },
            elementData: {
              tagName,
              classes,
              selector,
              textSnippet,
              outerHtml,
            },
          });
        }
      } catch (err) {
        console.warn('Annotation target extraction error', err);
      }
    });

    editorRef.current = editor;
    setReady(true);
    }

    initEditor().catch((err) => console.error('[GrapesJS Dynamic Init Error]', err));

    return () => {
      destroyed = true;
      if (editorRef.current) {
        editorRef.current.destroy();
      }
      editorRef.current = null;
    };
  }, [project, handleSaveToBackend]);

  // Filter sidebar blocks based on search bar input
  useEffect(() => {
    const search = blockSearch.trim().toLowerCase();
    const categories = document.querySelectorAll<HTMLElement>('#blocks .gjs-block-category');

    categories.forEach((category) => {
      let visibleBlocks = 0;
      const categoryTitle =
        category.querySelector<HTMLElement>('.gjs-title')?.textContent?.toLowerCase() ?? '';

      category.querySelectorAll<HTMLElement>('.gjs-block').forEach((b) => {
        const text = `${categoryTitle} ${b.textContent ?? ''}`.toLowerCase();
        const isVisible = !search || text.includes(search);
        b.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleBlocks += 1;
      });

      category.style.display = visibleBlocks > 0 ? '' : 'none';
    });
  }, [blockSearch, ready]);

  // Refresh canvas geometry on mode change or window resize
  useEffect(() => {
    if (!editorRef.current) return;
    const refreshCanvas = () => {
      try {
        editorRef.current?.refresh();
        editorRef.current?.Canvas?.refresh();
      } catch {}
    };

    const t1 = setTimeout(refreshCanvas, 50);
    const t2 = setTimeout(refreshCanvas, 250);
    window.addEventListener('resize', refreshCanvas);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', refreshCanvas);
    };
  }, [builderMode, ready]);

  const run = (command: string) => editorRef.current?.runCommand(command);

  const setCanvasDevice = (deviceName: string) => {
    editorRef.current?.setDevice(deviceName);
    setDevice(deviceName);
  };

  const liveStorefrontUrl = projectId ? `/pub/${projectId}` : null;

  return (
    <div className={`grapes-builder-app mode-${builderMode}`} data-device={device}>
      {/* Left Sidebar: Components & Block Palette */}
      <aside className="grapes-sidebar">
        <div className="panel-title">
          <Layers3 size={16} />
          <span>Blocks & Components</span>
        </div>
        <label className="block-search">
          <Search size={15} />
          <input
            value={blockSearch}
            onChange={(event) => setBlockSearch(event.target.value)}
            placeholder="Search blocks..."
            type="search"
          />
        </label>
        <div id="blocks" className="blocks-panel" />
      </aside>

      {/* Center Main Canvas & Top Controls */}
      <main className="grapes-workspace">
        <header className="grapes-topbar">
          <div className="topbar-group">
            <button title="Undo" onClick={() => run('core:undo')}>
              <Undo2 size={16} />
            </button>
            <button title="Redo" onClick={() => run('core:redo')}>
              <Redo2 size={16} />
            </button>
            <div className="mode-segmented-control ml-2">
              <button
                className={builderMode === 'ai' ? 'active ai-active' : ''}
                onClick={() => setBuilderMode('ai')}
                title="AI Mode: Clean canvas with conversational AI agent"
              >
                <Bot size={15} />
                <span>AI Mode</span>
              </button>
              <button
                className={builderMode === 'manual' ? 'active' : ''}
                onClick={() => setBuilderMode('manual')}
                title="Manual Mode: Full GrapesJS blocks and inspector"
              >
                <SlidersHorizontal size={15} />
                <span>Manual Mode</span>
              </button>
            </div>

            <button
              className={"annotate-toggle-btn " + (isAnnotating ? "active-annotating" : "")}
              onClick={toggleAnnotateMode}
              title="Annotation Mode: Click any component on canvas to write changes and attach to AI prompt"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "12px",
                border: isAnnotating ? "1px solid #0284c7" : "1px solid #e2e8f0",
                background: isAnnotating ? "#e0f2fe" : "#ffffff",
                color: isAnnotating ? "#0369a1" : "#475569",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <MessageSquarePlus size={15} color={isAnnotating ? "#0284c7" : "#64748b"} />
              <span>Annotate</span>
              {annotations.length > 0 && (
                <span style={{
                  background: "#0284c7",
                  color: "#ffffff",
                  fontSize: "10px",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  marginLeft: "2px",
                }}>
                  {annotations.length}
                </span>
              )}
            </button>
            <span className="font-semibold text-xs text-gray-700 ml-2">
              {project?.title || 'Orcayo Visual Storefront'}
            </span>
          </div>

          <div className="device-switcher">
            {devices.map(({ id, icon: Icon }) => (
              <button
                key={id}
                className={device === id ? 'active' : ''}
                title={id}
                onClick={() => setCanvasDevice(id)}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          <div className="topbar-group">
            <span className={`grapes-status ${status.toLowerCase().replace('...', '')}`}>
              {ready ? status : 'Loading editor...'}
            </span>

            <button title="Preview View" onClick={() => run('preview')}>
              <Eye size={16} />
            </button>

            {liveStorefrontUrl && (
              <button
                title="Save & Open Live Published Site"
                onClick={async () => {
                  if (editorRef.current) {
                    await handleSaveToBackend(editorRef.current);
                  }
                  window.open(liveStorefrontUrl, '_blank');
                }}
              >
                <ExternalLink size={16} />
                <span>View Live</span>
              </button>
            )}

            <button
              title="Save Changes"
              className="btn-primary"
              onClick={() => run('app:save')}
            >
              <Save size={16} />
              <span>Save</span>
            </button>

            <button title="Load Salon Template" onClick={() => run('app:load-salon-template')}>
              <Sparkles size={16} />
            </button>

            <button title="Export HTML File" onClick={() => run('app:export-html')}>
              <Download size={16} />
            </button>
          </div>
        </header>

        <div className="grapes-canvas-wrap">
          <div id="editor" />
        </div>
      </main>

      {/* Right Sidebar: Style & Layer Inspector */}
      <aside className="grapes-right-rail">
        <div className="panel-title">
          <Code2 size={16} />
          <span>Inspector</span>
        </div>
        <section>
          <h2>Styles</h2>
          <div id="styles" />
        </section>
        <section>
          <h2>Layers</h2>
          <div id="layers" />
        </section>
        <section>
          <h2>Selectors</h2>
          <div id="selectors" />
        </section>
      </aside>

      {/* Floating Canvas Popover when an item is clicked in Annotation Mode */}
      {isAnnotating && activeAnnotationTarget && (
        <AnnotationPopover
          position={activeAnnotationTarget.position}
          elementData={activeAnnotationTarget.elementData}
          onAttach={(newAnn) => {
            setAnnotations(prev => [...prev, newAnn]);
            if (builderMode !== 'ai') setBuilderMode('ai');
          }}
          onClose={() => setActiveAnnotationTarget(null)}
        />
      )}

      {/* AI Agent Workspace Panel (Docked in AI Mode) */}
      <AiAgentPanel
        profile={storeProfile}
        onApplyBlock={handleApplyAiBlock}
        onUpdateElement={handleUpdateCanvasElement}
        onGetCanvasContext={getCanvasContext}
        token={authToken}
        projectId={projectId}
        isAiMode={builderMode === 'ai'}
        annotations={annotations}
        onRemoveAnnotation={(id) => setAnnotations(prev => prev.filter(a => a.id !== id))}
        onClearAnnotations={() => setAnnotations([])}
      />

      {/* In Manual Mode: quick button to return to AI Mode */}
      {builderMode === 'manual' && (
        <button
          className="floating-ai-toggle"
          onClick={() => setBuilderMode('ai')}
          title="Switch to AI Agent Mode"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#0f172a',
            color: '#38bdf8',
            border: '1px solid #38bdf8',
            borderRadius: '50px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          <Bot size={18} color="#38bdf8" />
          <span>AI Mode</span>
        </button>
      )}
    </div>
  );
}
