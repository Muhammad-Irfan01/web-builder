import type { CSSProperties } from 'react';

export type ComponentNodeType =
  | 'container'
  | 'row'
  | 'column'
  | 'headline'
  | 'paragraph'
  | 'button'
  | 'image'
  | 'spacer'
  | 'divider'
  | 'custom-code'
  | 'featured-products'
  | 'categories'
  | 'booking-calendar'
  | 'testimonials'
  | 'services-list'
  | 'footer';

export interface ComponentNode {
  id: string;
  type: ComponentNodeType;
  label: string;
  visible: boolean;
  settings: Record<string, unknown>;
  children?: ComponentNode[];
}

export interface LegacyBlockDef {
  id: string;
  type: 'headline' | 'paragraph' | 'button' | 'image';
  settings: Record<string, unknown>;
}

export interface LegacySectionDef {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  settings: Record<string, unknown>;
  blocks?: LegacyBlockDef[];
}

const childCapable = new Set<ComponentNodeType>(['container', 'row', 'column']);

export function canHaveChildren(type: ComponentNodeType) {
  return childCapable.has(type);
}

export function createNode(type: ComponentNodeType, label?: string, settings: Record<string, unknown> = {}): ComponentNode {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const base: ComponentNode = {
    id,
    type,
    label: label || defaultLabel(type),
    visible: true,
    settings: { ...defaultSettings(type), ...settings },
  };
  if (canHaveChildren(type)) base.children = [];
  return base;
}

export function createPreset(type: ComponentNodeType | 'hero' | 'cta-banner' | 'rich-text'): ComponentNode {
  const now = Date.now();
  if (type === 'hero') {
    return {
      id: `hero-${now}`,
      type: 'container',
      label: 'Hero Banner',
      visible: true,
      settings: {
        preset: 'hero',
        padding: '110px 24px',
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--sf-primary) 18%, transparent), transparent)',
        textAlign: 'center',
      },
      children: [
        createNode('headline', 'Hero Headline', { text: 'Discover Your Next Obsession', fontSize: 52, color: 'var(--sf-text)', textAlign: 'center' }),
        createNode('paragraph', 'Hero Subheadline', { text: 'Curated products, seamless experience.', fontSize: 18, color: 'var(--sf-text-muted)', textAlign: 'center' }),
        createNode('button', 'Hero Button', { text: 'Shop Now', link: '/storefront/products', color: 'var(--sf-primary)', textColor: '#ffffff', textAlign: 'center' }),
      ],
    };
  }
  if (type === 'cta-banner') {
    return {
      id: `cta-${now}`,
      type: 'container',
      label: 'CTA Banner',
      visible: true,
      settings: { preset: 'cta-banner', padding: '72px 24px', background: 'linear-gradient(135deg, var(--sf-primary), var(--sf-secondary))', textAlign: 'center' },
      children: [
        createNode('headline', 'CTA Headline', { text: 'Ready to Start Shopping?', fontSize: 38, color: '#ffffff', textAlign: 'center' }),
        createNode('paragraph', 'CTA Text', { text: 'Browse our full catalog and find something you will love.', fontSize: 16, color: 'rgba(255,255,255,0.86)', textAlign: 'center' }),
        createNode('button', 'CTA Button', { text: 'Explore Products', link: '/storefront/products', color: '#ffffff', textColor: 'var(--sf-primary)' }),
      ],
    };
  }
  if (type === 'rich-text') {
    return {
      id: `rich-text-${now}`,
      type: 'container',
      label: 'Rich Text',
      visible: true,
      settings: { padding: '64px 24px', maxWidth: '820px' },
      children: [
        createNode('headline', 'Heading', { text: 'Our Philosophy', fontSize: 32 }),
        createNode('paragraph', 'Text', { text: 'Tell customers what makes your brand special.', fontSize: 16 }),
      ],
    };
  }
  return createNode(type);
}

export function defaultLayout(): ComponentNode[] {
  return [
    createPreset('hero'),
    createNode('categories', 'Product Categories'),
    createNode('featured-products', 'Featured Products', { count: 8 }),
    createNode('booking-calendar', 'Booking Calendar', { hiddenByDefault: true, visible: false }),
    createNode('testimonials', 'Testimonials'),
    createPreset('cta-banner'),
    createNode('footer', 'Footer'),
  ].map((node) => node.settings.hiddenByDefault ? { ...node, visible: false, settings: withoutKey(node.settings, 'hiddenByDefault') } : node);
}

export function legacySectionsToLayout(sections: LegacySectionDef[] = []): ComponentNode[] {
  return sections.map((section) => {
    const blocks = section.blocks?.map(legacyBlockToNode) || [];
    if (section.type === 'hero' || section.type === 'cta-banner' || section.type === 'rich-text') {
      return {
        id: section.id,
        type: 'container',
        label: section.label,
        visible: section.visible,
        settings: { ...section.settings, preset: section.type },
        children: blocks,
      };
    }
    return {
      id: section.id,
      type: mapLegacySectionType(section.type),
      label: section.label,
      visible: section.visible,
      settings: section.settings || {},
    };
  });
}

export function normalizeThemeLayout<T extends { layout?: ComponentNode[]; sections?: LegacySectionDef[] }>(theme: T): T & { layout: ComponentNode[] } {
  if (Array.isArray(theme.layout) && theme.layout.length > 0) return theme as T & { layout: ComponentNode[] };
  if (Array.isArray(theme.sections)) return { ...theme, layout: legacySectionsToLayout(theme.sections) };
  return { ...theme, layout: defaultLayout() };
}

export function findNode(nodes: ComponentNode[], id: string | null): ComponentNode | null {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findNode(node.children || [], id);
    if (child) return child;
  }
  return null;
}

export function updateNode(nodes: ComponentNode[], id: string, updater: (node: ComponentNode) => ComponentNode): ComponentNode[] {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (!node.children) return node;
    return { ...node, children: updateNode(node.children, id, updater) };
  });
}

export function addNode(nodes: ComponentNode[], node: ComponentNode, parentId?: string | null): ComponentNode[] {
  if (!parentId) return [...nodes, node];
  return updateNode(nodes, parentId, (parent) => {
    if (!canHaveChildren(parent.type)) return parent;
    return { ...parent, children: [...(parent.children || []), node] };
  });
}

export function removeNode(nodes: ComponentNode[], id: string): ComponentNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => node.children ? { ...node, children: removeNode(node.children, id) } : node);
}

export function reorderNodes(nodes: ComponentNode[], parentId: string | null, from: number, to: number): ComponentNode[] {
  const reorder = (items: ComponentNode[]) => {
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    if (!moved) return items;
    updated.splice(to, 0, moved);
    return updated;
  };
  if (!parentId) return reorder(nodes);
  return updateNode(nodes, parentId, (parent) => ({ ...parent, children: reorder(parent.children || []) }));
}

export function nodeSettingsToStyle(settings: Record<string, unknown> = {}): CSSProperties {
  const style: CSSProperties = {};
  const copy = (key: string, cssKey: keyof CSSProperties = key as keyof CSSProperties) => {
    const value = settings[key];
    if (value !== undefined && value !== '') (style as any)[cssKey] = value;
  };
  copy('padding');
  copy('margin');
  copy('width');
  copy('height');
  copy('maxWidth');
  copy('background');
  copy('backgroundColor');
  copy('border');
  copy('borderRadius');
  copy('boxShadow');
  copy('display');
  copy('flexDirection');
  copy('justifyContent');
  copy('alignItems');
  copy('gap');
  copy('textAlign');
  copy('color');
  if (typeof settings.fontSize === 'number') style.fontSize = `${settings.fontSize}px`;
  if (typeof settings.fontSize === 'string') style.fontSize = settings.fontSize;
  return style;
}

function legacyBlockToNode(block: LegacyBlockDef): ComponentNode {
  return {
    id: block.id,
    type: block.type,
    label: defaultLabel(block.type),
    visible: true,
    settings: block.settings || {},
  };
}

function mapLegacySectionType(type: string): ComponentNodeType {
  if (type === 'custom-button') return 'button';
  if (type === 'typography') return 'headline';
  if (type === 'custom-image') return 'image';
  if (type === 'spacer') return 'spacer';
  if (type === 'featured-products') return 'featured-products';
  if (type === 'booking-calendar') return 'booking-calendar';
  if (type === 'services-list') return 'services-list';
  if (type === 'categories') return 'categories';
  if (type === 'testimonials') return 'testimonials';
  if (type === 'footer') return 'footer';
  return 'container';
}

function defaultLabel(type: ComponentNodeType | string) {
  return type.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function defaultSettings(type: ComponentNodeType): Record<string, unknown> {
  switch (type) {
    case 'container':
      return { padding: '48px 24px', maxWidth: '1200px', margin: '0 auto' };
    case 'row':
      return { display: 'flex', gap: '24px', alignItems: 'stretch' };
    case 'column':
      return { display: 'flex', flexDirection: 'column', gap: '16px', flex: '1' };
    case 'headline':
      return { text: 'New Headline', fontSize: 36, color: 'var(--sf-text)' };
    case 'paragraph':
      return { text: 'Add supporting text here.', fontSize: 16, color: 'var(--sf-text-muted)' };
    case 'button':
      return { text: 'Button', link: '/storefront/products', color: 'var(--sf-primary)', textColor: '#ffffff', borderRadius: '10px' };
    case 'image':
      return { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900', alt: 'Storefront image', width: '100%', borderRadius: '12px' };
    case 'spacer':
      return { height: 40 };
    case 'divider':
      return { borderColor: 'color-mix(in srgb, var(--sf-text) 12%, transparent)' };
    case 'featured-products':
      return { count: 8 };
    case 'services-list':
      return { title: 'Our Services', subtitle: 'Explore our signature services', services: [] };
    default:
      return {};
  }
}

function withoutKey(obj: Record<string, unknown>, key: string) {
  const clone = { ...obj };
  delete clone[key];
  return clone;
}
