import { useState, useRef, useCallback } from 'react';
import { useTheme, type ComponentNode, type ComponentType } from '../lib/theme';

const COMPONENT_TYPES: { type: ComponentType; label: string; icon: string; category: string }[] = [
  { type: 'container', label: 'Container', icon: '📦', category: 'Layout' },
  { type: 'row',       label: 'Row',       icon: '↔️', category: 'Layout' },
  { type: 'column',    label: 'Column',    icon: '↕️', category: 'Layout' },
  { type: 'headline',  label: 'Headline',  icon: '🅰️', category: 'Basic' },
  { type: 'paragraph', label: 'Paragraph', icon: '📝', category: 'Basic' },
  { type: 'button',    label: 'Button',    icon: '🖱️', category: 'Basic' },
  { type: 'image',     label: 'Image',     icon: '🖼️', category: 'Basic' },
  { type: 'spacer',    label: 'Spacer',    icon: '⬛', category: 'Layout' },
  { type: 'divider',   label: 'Divider',   icon: '➖', category: 'Layout' },
];

interface SectionsPanelProps {
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  previewPage: string;
}

export default function SectionsPanel({ selectedNodeId, onSelectNode, previewPage }: SectionsPanelProps) {
  const { theme, toggleNode, removeNode, addNode, moveNode } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const dragSourceId = useRef<string | null>(null);
  
  // Drag and drop state
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  // ── Drag & Drop ─────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragSourceId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent, id: string, type: ComponentType) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    // Calculate position based on mouse Y
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const threshold = 10; // pixels for top/bottom edge

    let position: 'before' | 'after' | 'inside' = 'inside';
    const isContainer = ['container', 'row', 'column'].includes(type);

    if (y < threshold) {
      position = 'before';
    } else if (y > rect.height - threshold) {
      position = 'after';
    } else if (isContainer) {
      position = 'inside';
    } else {
      position = 'after'; // default to after if not a container and in middle
    }

    if (dragOverNodeId !== id || dragPosition !== position) {
      setDragOverNodeId(id);
      setDragPosition(position);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverNodeId(null);
    setDragPosition(null);
  };

  const handleDrop = (e: React.DragEvent, id: string, parentId: string | null, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = dragSourceId.current;
    
    if (!sourceId || sourceId === id) {
      setDragOverNodeId(null);
      setDragPosition(null);
      return;
    }

    if (dragPosition === 'before') {
      moveNode(sourceId, parentId, index);
    } else if (dragPosition === 'after') {
      moveNode(sourceId, parentId, index + 1);
    } else if (dragPosition === 'inside') {
      // Append to the end of the container's children
      moveNode(sourceId, id, 9999); 
    }

    dragSourceId.current = null;
    setDragOverNodeId(null);
    setDragPosition(null);
  };

  const handleDragEnd = () => {
    dragSourceId.current = null;
    setDragOverNodeId(null);
    setDragPosition(null);
  };

  // ── Add Node ─────────────────────────────────────────────────────────
  const handleAddNode = (type: ComponentType, label: string) => {
    const now = Date.now();
    let defaultSettings: any = {};
    if (type === 'container') defaultSettings = { padding: '24px', backgroundColor: 'transparent' };
    if (type === 'row') defaultSettings = { display: 'flex', gap: '16px', flexWrap: 'wrap' };
    if (type === 'column') defaultSettings = { flex: 1, minWidth: '200px' };
    if (type === 'headline') defaultSettings = { text: 'New Headline', fontSize: 32, color: 'var(--sf-text)' };
    if (type === 'paragraph') defaultSettings = { text: 'New paragraph text.', fontSize: 16, color: 'var(--sf-text-muted)' };
    if (type === 'button') defaultSettings = { text: 'Click Me', link: '#', color: 'var(--sf-primary)' };
    if (type === 'image') defaultSettings = { url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80', width: '100%', radius: '8px' };
    if (type === 'spacer') defaultSettings = { height: '32px' };
    if (type === 'divider') defaultSettings = { color: 'var(--color-border)', margin: '16px 0' };

    const newNode: ComponentNode = {
      id: `node-${now}`,
      type,
      label,
      visible: true,
      settings: defaultSettings,
      children: ['container', 'row', 'column'].includes(type) ? [] : undefined
    };

    addNode(targetParentId, newNode);
    setShowAddModal(false);
    setTargetParentId(null);
  };

  // ── Render Tree ─────────────────────────────────────────────────────────
  const renderNode = (node: ComponentNode, parentId: string | null, index: number, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    const isDragOver = dragOverNodeId === node.id;
    const isContainer = ['container', 'row', 'column'].includes(node.type);
    
    let dropIndicator = null;
    if (isDragOver && dragPosition) {
       if (dragPosition === 'before') dropIndicator = <div style={{ height: '2px', background: 'var(--color-primary)', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10 }} />;
       if (dragPosition === 'after') dropIndicator = <div style={{ height: '2px', background: 'var(--color-primary)', width: '100%', position: 'absolute', bottom: 0, left: 0, zIndex: 10 }} />;
    }

    return (
      <div key={node.id} style={{ position: 'relative' }}>
        {dropIndicator}
        <div
          className={`subcomponent-node${isSelected ? ' active' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id, node.type)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.id, parentId, index)}
          onDragEnd={handleDragEnd}
          onClick={(e) => {
            e.stopPropagation();
            onSelectNode(isSelected ? null : node.id);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px',
            marginLeft: `${depth * 12}px`,
            marginTop: '4px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
            border: isDragOver && dragPosition === 'inside' ? '1px dashed var(--color-primary)' : isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
            color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontSize: '0.8rem',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <span style={{ cursor: 'grab' }}>
              <svg width="10" height="14" viewBox="0 0 12 16" fill="currentColor" style={{ opacity: 0.5 }}>
                <circle cx="4" cy="3" r="1.5"/><circle cx="8" cy="3" r="1.5"/>
                <circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
                <circle cx="4" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
              </svg>
            </span>
            <span>{COMPONENT_TYPES.find(t => t.type === node.type)?.icon ?? '📄'}</span>
            <span style={{ fontWeight: isContainer ? 600 : 400, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {node.label}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
              title={node.visible ? 'Hide' : 'Show'}
              style={{ background: 'none', border: 'none', color: 'currentColor', opacity: node.visible ? 0.8 : 0.3, cursor: 'pointer' }}
            >
              👁️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this component?')) {
                  removeNode(node.id);
                  if (selectedNodeId === node.id) onSelectNode(null);
                }
              }}
              title="Delete"
              style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.8, cursor: 'pointer' }}
            >
              🗑️
            </button>
          </div>
        </div>
        
        {/* Children */}
        {node.children && node.children.length > 0 && (
          <div style={{ paddingLeft: '8px', borderLeft: '1px dashed rgba(255,255,255,0.1)', marginLeft: `${depth * 12 + 6}px` }}>
            {node.children.map((child, i) => renderNode(child, node.id, i, depth + 1))}
          </div>
        )}

        {/* Add inside button for containers if they are empty or we want to append */}
        {isContainer && (
           <div style={{ marginLeft: `${(depth + 1) * 12}px`, marginTop: '4px' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.1)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetParentId(node.id);
                  setShowAddModal(true);
                }}
              >
                + Add inside {node.label}
              </button>
           </div>
        )}
      </div>
    );
  };

  // Render Page-specific customizers when not on Home "/"
  if (previewPage !== '/') {
    const pageTitles: Record<string, string> = {
      '/products': 'Products Page Customizer',
      '/product/:slug': 'Product Detail Customizer',
      '/about': 'About Us Customizer',
      '/contact': 'Contact Us Customizer',
    };

    const pageComponents: Record<string, { label: string; icon: string }[]> = {
      '/products': [
        { label: 'Products Header Title', icon: '🅰️' },
        { label: 'Products Description', icon: '📝' },
        { label: 'Products per page selector', icon: '🔢' },
        { label: 'Search grid toggle', icon: '🔍' },
      ],
      '/product/:slug': [
        { label: 'Add to Cart Label', icon: '🖱️' },
        { label: 'Show qty selector', icon: '🔢' },
        { label: 'Customer Reviews panel', icon: '⭐' },
      ],
      '/about': [
        { label: 'About Story Headline', icon: '🅰️' },
        { label: 'Story Subheadline text', icon: '📝' },
        { label: 'Our Story Paragraph text', icon: '📖' },
        { label: 'Our Mission Paragraph text', icon: '🚀' },
      ],
      '/contact': [
        { label: 'Get in Touch headline', icon: '🅰️' },
        { label: 'Physical Store Address', icon: '📍' },
        { label: 'Customer support email', icon: '📧' },
        { label: 'Customer support phone', icon: '📞' },
      ],
    };

    const currentComponents = pageComponents[previewPage] || [];

    return (
      <div className="panel-sections">
        <div className="panel-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <span className="panel-title" style={{ fontSize: '0.95rem' }}>{pageTitles[previewPage] || 'Subpage Customizer'}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Click to edit page elements</span>
        </div>

        <div className="sections-list scroll-y" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentComponents.map((comp, idx) => (
              <div 
                key={idx}
                className="section-card active"
                style={{ cursor: 'pointer', padding: '12px 16px' }}
                onClick={() => onSelectNode(`subpage-${previewPage}`)}
              >
                <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{comp.icon}</span>
                <div className="section-info">
                  <div className="section-name" style={{ fontSize: '0.85rem' }}>{comp.label}</div>
                  <div className="section-type" style={{ fontSize: '0.7rem' }}>Editable text sub-component</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="panel-sections">
        <div className="panel-header">
          <span className="panel-title">Layers</span>
          <span className="badge badge-brand">{theme.layout?.length || 0} root</span>
        </div>

        <div className="sections-list scroll-y" style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {theme.layout?.map((node, index) => renderNode(node, null, index))}
          {(!theme.layout || theme.layout.length === 0) && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              No components. Add a container to start.
            </div>
          )}
        </div>

        <button 
          className="add-section-btn" 
          onClick={() => {
            setTargetParentId(null);
            setShowAddModal(true);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
          </svg>
          Add Root Component
        </button>
      </div>

      {/* ── Add Component Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem' }}>Add Component</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/>
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layout</h4>
                <div className="section-type-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {COMPONENT_TYPES.filter(t => t.category === 'Layout').map(({ type, label, icon }) => (
                    <button
                      key={type}
                      className="section-type-card"
                      onClick={() => handleAddNode(type, label)}
                      style={{ padding: '8px', minHeight: 'auto', flexDirection: 'row', gap: '8px', justifyContent: 'flex-start' }}
                    >
                      <span className="section-type-icon" style={{ marginBottom: 0, fontSize: '1.2rem' }}>{icon}</span>
                      <span className="section-type-name" style={{ fontSize: '0.8rem' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Basic Elements</h4>
                <div className="section-type-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {COMPONENT_TYPES.filter(t => t.category === 'Basic').map(({ type, label, icon }) => (
                    <button
                      key={type}
                      className="section-type-card"
                      onClick={() => handleAddNode(type, label)}
                      style={{ padding: '8px', minHeight: 'auto', flexDirection: 'row', gap: '8px', justifyContent: 'flex-start' }}
                    >
                      <span className="section-type-icon" style={{ marginBottom: 0, fontSize: '1.2rem' }}>{icon}</span>
                      <span className="section-type-name" style={{ fontSize: '0.8rem' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
