import { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';

// ── Theme Schema ──────────────────────────────────────────────────────────
export interface ThemeTokens {
  // Colors
  colorPrimary:     string;
  colorSecondary:   string;
  colorAccent:      string;
  colorBackground:  string;
  colorSurface:     string;
  colorText:        string;
  colorTextMuted:   string;

  // Typography
  fontBody:         string;
  fontHeading:      string;
  baseFontSize:     number;   // px

  // Shape
  borderRadius:     number;   // px
  buttonRadius:     number;   // px

  // Layout Properties
  containerWidth:   number;   // px
  headerSticky:     boolean;
  glassStrength:    number;   // 0-100

  // Store info
  storeName:        string;
  logoUrl:          string;

  // Tree layout of components (replaces flat sections)
  layout:           ComponentNode[];

  // Subpages customization
  productsPageHeaderTitle?: string;
  productsPageHeaderDesc?: string;
  productsPageShowSearch?: boolean;
  productsPagePerPage?: number;

  productDetailPageBtnText?: string;
  productDetailPageShowQty?: boolean;
  productDetailPageShowReviews?: boolean;

  aboutPageTitle?: string;
  aboutPageDesc?: string;
  aboutPageStory?: string;
  aboutPageMission?: string;

  contactPageEmail?: string;
  contactPagePhone?: string;
  contactPageAddress?: string;
  contactPageHeadline?: string;

  headerStyle?: 'default' | 'rounded' | 'floating';
  footerLayout?: 'default' | 'centered' | 'minimal';

  headerMenu?: Array<{ id: string; label: string; url: string }>;
  footerMenuCols?: Array<{
    id: string;
    title: string;
    links: Array<{ id: string; label: string; url: string }>;
  }>;
}

export type ComponentType = 
  | 'container' 
  | 'row' 
  | 'column' 
  | 'headline' 
  | 'paragraph' 
  | 'button' 
  | 'image' 
  | 'spacer' 
  | 'divider' 
  | 'custom-code';

export interface ComponentNode {
  id: string;
  type: ComponentType;
  label: string;
  visible: boolean;
  settings: Record<string, any>;
  children?: ComponentNode[];
}

// ── Default Theme ─────────────────────────────────────────────────────────
export const DEFAULT_LAYOUT: ComponentNode[] = [
  {
    id: 'container-1',
    type: 'container',
    label: 'Hero Container',
    visible: true,
    settings: { padding: '64px 24px', backgroundColor: 'var(--sf-surface)', textAlign: 'center' },
    children: [
      {
        id: 'headline-1',
        type: 'headline',
        label: 'Main Headline',
        visible: true,
        settings: { text: 'Discover Your Next Obsession', fontSize: 48, color: 'var(--sf-text)' }
      },
      {
        id: 'paragraph-1',
        type: 'paragraph',
        label: 'Subtitle',
        visible: true,
        settings: { text: 'Curated products, seamless experience.', fontSize: 18, color: 'var(--sf-text-muted)' }
      },
      {
        id: 'button-1',
        type: 'button',
        label: 'Shop Now Button',
        visible: true,
        settings: { text: 'Shop Now', link: '/storefront/products', color: 'var(--sf-primary)', textColor: '#ffffff' }
      }
    ]
  },
  {
    id: 'container-2',
    type: 'container',
    label: 'Content Section',
    visible: true,
    settings: { padding: '48px 24px', backgroundColor: 'var(--sf-bg)' },
    children: [
      {
        id: 'row-1',
        type: 'row',
        label: 'Two Columns',
        visible: true,
        settings: { gap: '24px', alignItems: 'center' },
        children: [
          {
            id: 'col-1',
            type: 'column',
            label: 'Left Column',
            visible: true,
            settings: { flex: 1 },
            children: [
              {
                id: 'headline-2',
                type: 'headline',
                label: 'Section Heading',
                visible: true,
                settings: { text: 'Quality Materials', fontSize: 32 }
              },
              {
                id: 'paragraph-2',
                type: 'paragraph',
                label: 'Description',
                visible: true,
                settings: { text: 'We source the best materials globally to ensure premium quality.' }
              }
            ]
          },
          {
            id: 'col-2',
            type: 'column',
            label: 'Right Column',
            visible: true,
            settings: { flex: 1 },
            children: [
              {
                id: 'image-1',
                type: 'image',
                label: 'Feature Image',
                visible: true,
                settings: { url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80', radius: '12px', width: '100%' }
              }
            ]
          }
        ]
      }
    ]
  }
];

export const DEFAULT_THEME: ThemeTokens = {
  colorPrimary:    '#6366f1',
  colorSecondary:  '#f472b6',
  colorAccent:     '#fbbf24',
  colorBackground: '#080b14',
  colorSurface:    '#161a2d',
  colorText:       '#f1f5ff',
  colorTextMuted:  '#9ba3c0',
  fontBody:        'Inter',
  fontHeading:     'Outfit',
  baseFontSize:    15,
  borderRadius:    12,
  buttonRadius:    10,
  containerWidth:  1200,
  headerSticky:    true,
  glassStrength:   70,
  storeName:       'My Orcayo Store',
  logoUrl:         '',
  layout:          DEFAULT_LAYOUT,

  productsPageHeaderTitle: 'All Premium Products',
  productsPageHeaderDesc: 'Discover high-quality items curated with passion.',
  productsPageShowSearch: true,
  productsPagePerPage: 12,

  productDetailPageBtnText: 'Add to Cart',
  productDetailPageShowQty: true,
  productDetailPageShowReviews: true,

  aboutPageTitle: 'Our Story',
  aboutPageDesc: 'Quality products, curated with passion.',
  aboutPageStory: 'Welcome to our store. We believe in providing the best experience for our customers by offering high-quality products that are both functional and beautiful.',
  aboutPageMission: 'Our mission is to empower individuals through exceptional products and unparalleled service. We strive to be a sustainable and ethical business that gives back to the community while delivering joy to our customers.',

  contactPageEmail: 'hello@orcayo.com',
  contactPagePhone: '+1 (555) 019-2834',
  contactPageAddress: '100 Innovation Way, Suite 400, San Francisco, CA',
  contactPageHeadline: 'Get in Touch',
  
  headerStyle: 'default',
  footerLayout: 'default',

  headerMenu: [
    { id: 'hm-1', label: 'Home', url: '/storefront' },
    { id: 'hm-2', label: 'Products', url: '/storefront/products' },
    { id: 'hm-3', label: 'About', url: '/storefront/about' },
  ],
  footerMenuCols: [
    {
      id: 'fmc-1',
      title: 'Shop',
      links: [
        { id: 'fm-1-1', label: 'All Products', url: '/storefront/products' },
        { id: 'fm-1-2', label: 'New Arrivals', url: '/storefront/products?new=true' },
        { id: 'fm-1-3', label: 'Sale', url: '/storefront/products?sale=true' },
      ],
    },
    {
      id: 'fmc-2',
      title: 'Account',
      links: [
        { id: 'fm-2-1', label: 'My Account', url: '/storefront/account' },
        { id: 'fm-2-2', label: 'Orders', url: '/storefront/account/orders' },
        { id: 'fm-2-3', label: 'Track Order', url: '/storefront/account/tracking' },
      ],
    },
    {
      id: 'fmc-3',
      title: 'Support',
      links: [
        { id: 'fm-3-1', label: 'Contact Us', url: '/storefront/contact' },
        { id: 'fm-3-2', label: 'FAQ', url: '/storefront/faq' },
        { id: 'fm-3-3', label: 'Returns', url: '/storefront/returns' },
      ],
    },
  ],
};

// ── Actions ───────────────────────────────────────────────────────────────
type ThemeAction =
  | { type: 'SET_TOKEN'; key: keyof ThemeTokens; value: unknown }
  | { type: 'REORDER_LAYOUT'; layout: ComponentNode[] }
  | { type: 'TOGGLE_NODE'; id: string }
  | { type: 'UPDATE_NODE'; id: string; settings: Record<string, any> }
  | { type: 'ADD_NODE'; parentId: string | null; node: ComponentNode; index?: number }
  | { type: 'REMOVE_NODE'; id: string }
  | { type: 'MOVE_NODE'; sourceId: string; targetParentId: string | null; targetIndex: number }
  | { type: 'RESET' }
  | { type: 'LOAD'; theme: ThemeTokens };

// Recursive helper functions
function toggleNodeRecursive(nodes: ComponentNode[], id: string): ComponentNode[] {
  return nodes.map(node => {
    if (node.id === id) return { ...node, visible: !node.visible };
    if (node.children) return { ...node, children: toggleNodeRecursive(node.children, id) };
    return node;
  });
}

function updateNodeRecursive(nodes: ComponentNode[], id: string, settings: Record<string, any>): ComponentNode[] {
  return nodes.map(node => {
    if (node.id === id) return { ...node, settings: { ...node.settings, ...settings } };
    if (node.children) return { ...node, children: updateNodeRecursive(node.children, id, settings) };
    return node;
  });
}

function addNodeRecursive(nodes: ComponentNode[], parentId: string | null, nodeToAdd: ComponentNode, index?: number): ComponentNode[] {
  if (parentId === null) {
    const newNodes = [...nodes];
    if (typeof index === 'number') newNodes.splice(index, 0, nodeToAdd);
    else newNodes.push(nodeToAdd);
    return newNodes;
  }
  return nodes.map(node => {
    if (node.id === parentId) {
      const newChildren = [...(node.children || [])];
      if (typeof index === 'number') newChildren.splice(index, 0, nodeToAdd);
      else newChildren.push(nodeToAdd);
      return { ...node, children: newChildren };
    }
    if (node.children) return { ...node, children: addNodeRecursive(node.children, parentId, nodeToAdd, index) };
    return node;
  });
}

function removeNodeRecursive(nodes: ComponentNode[], id: string): { newNodes: ComponentNode[], removedNode: ComponentNode | null } {
  let found: ComponentNode | null = null;
  const newNodes = nodes.filter(n => {
    if (n.id === id) {
      found = n;
      return false;
    }
    return true;
  }).map(n => {
    if (n.children && !found) {
      const { newNodes: childNodes, removedNode: childFound } = removeNodeRecursive(n.children, id);
      if (childFound) {
        found = childFound;
        return { ...n, children: childNodes };
      }
    }
    return n;
  });
  return { newNodes, removedNode: found };
}

function themeReducer(state: ThemeTokens, action: ThemeAction): ThemeTokens {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, [action.key]: action.value };
    case 'REORDER_LAYOUT':
      return { ...state, layout: action.layout };
    case 'TOGGLE_NODE':
      return { ...state, layout: toggleNodeRecursive(state.layout, action.id) };
    case 'UPDATE_NODE':
      return { ...state, layout: updateNodeRecursive(state.layout, action.id, action.settings) };
    case 'ADD_NODE':
      return { ...state, layout: addNodeRecursive(state.layout, action.parentId, action.node, action.index) };
    case 'REMOVE_NODE':
      return { ...state, layout: removeNodeRecursive(state.layout, action.id).newNodes };
    case 'MOVE_NODE': {
      const { newNodes, removedNode } = removeNodeRecursive(state.layout, action.sourceId);
      if (!removedNode) return state;
      return { ...state, layout: addNodeRecursive(newNodes, action.targetParentId, removedNode, action.targetIndex) };
    }
    case 'RESET':
      return DEFAULT_THEME;
    case 'LOAD':
      return { ...DEFAULT_THEME, ...action.theme };
    default:
      return state;
  }
}

// ── CSS Variable Injection ────────────────────────────────────────────────
export function themeToCSS(theme: ThemeTokens): string {
  return `
    --sf-primary:      ${theme.colorPrimary};
    --sf-secondary:    ${theme.colorSecondary};
    --sf-accent:       ${theme.colorAccent};
    --sf-bg:           ${theme.colorBackground};
    --sf-surface:      ${theme.colorSurface};
    --sf-text:         ${theme.colorText};
    --sf-text-muted:   ${theme.colorTextMuted};
    --sf-font-body:    '${theme.fontBody}', Inter, sans-serif;
    --sf-font-heading: '${theme.fontHeading}', Outfit, sans-serif;
    --sf-base-size:    ${theme.baseFontSize}px;
    --sf-radius:       ${theme.borderRadius}px;
    --sf-btn-radius:   ${theme.buttonRadius}px;
    --sf-container:    ${theme.containerWidth}px;
    --sf-glass:        ${theme.glassStrength}%;
  `.trim();
}

// ── Context ───────────────────────────────────────────────────────────────
interface ThemeContextValue {
  theme: ThemeTokens;
  setToken: (key: keyof ThemeTokens, value: unknown) => void;
  reorderLayout: (layout: ComponentNode[]) => void;
  toggleNode: (id: string) => void;
  updateNode: (id: string, settings: Record<string, any>) => void;
  addNode: (parentId: string | null, node: ComponentNode, index?: number) => void;
  removeNode: (id: string) => void;
  moveNode: (sourceId: string, targetParentId: string | null, targetIndex: number) => void;
  findNodeById: (id: string) => ComponentNode | null;
  resetTheme: () => void;
  loadTheme: (theme: ThemeTokens) => void;
  exportJSON: () => string;
  saveTheme: (opts?: { publish?: boolean }) => Promise<void>;

  isSaving: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'orcayo_theme_v1';

export function ThemeProvider({ children, initialTheme, projectId }: { children: ReactNode; initialTheme?: ThemeTokens; projectId?: string }) {
  const [theme, dispatch] = useReducer(
    themeReducer,
    initialTheme ? { ...DEFAULT_THEME, ...initialTheme } : DEFAULT_THEME
  );
  const [isSaving, setIsSaving] = useReducer((_: boolean, v: boolean) => v, false);

  const setToken   = useCallback((key: keyof ThemeTokens, value: unknown) =>
    dispatch({ type: 'SET_TOKEN', key, value }), []);
  const reorderLayout = useCallback((layout: ComponentNode[]) =>
    dispatch({ type: 'REORDER_LAYOUT', layout }), []);
  const toggleNode = useCallback((id: string) =>
    dispatch({ type: 'TOGGLE_NODE', id }), []);
  const updateNode = useCallback((id: string, settings: Record<string, any>) =>
    dispatch({ type: 'UPDATE_NODE', id, settings }), []);
  const addNode = useCallback((parentId: string | null, node: ComponentNode, index?: number) =>
    dispatch({ type: 'ADD_NODE', parentId, node, index }), []);
  const removeNode = useCallback((id: string) =>
    dispatch({ type: 'REMOVE_NODE', id }), []);
  const moveNode = useCallback((sourceId: string, targetParentId: string | null, targetIndex: number) =>
    dispatch({ type: 'MOVE_NODE', sourceId, targetParentId, targetIndex }), []);
  const findNodeById = useCallback((id: string): ComponentNode | null => {
    const find = (nodes: ComponentNode[]): ComponentNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const nested = node.children ? find(node.children) : null;
        if (nested) return nested;
      }
      return null;
    };
    return find(theme.layout);
  }, [theme.layout]);
  const resetTheme = useCallback(() => dispatch({ type: 'RESET' }), []);
  const loadTheme  = useCallback((t: ThemeTokens) => dispatch({ type: 'LOAD', theme: t }), []);
  const exportJSON = useCallback(() => JSON.stringify(theme, null, 2), [theme]);

  const saveTheme  = useCallback(async (opts?: { publish?: boolean }) => {
    // Determine a project-specific or template-specific storage key to prevent bleeding
    const getStorageKey = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const pId = projectId || urlParams.get('projectId');
        if (pId) return `orcayo_theme_project_${pId}`;
        const tId = urlParams.get('templateId');
        if (tId) return `orcayo_theme_template_${tId}`;
      }
      return 'orcayo_theme_default';
    };
    const storageKey = getStorageKey();

    // Always save to localStorage as isolated backup
    try { localStorage.setItem(storageKey, JSON.stringify(theme)); } catch {}

    // Save to backend if projectId is present
    if (projectId) {
      setIsSaving(true);
      try {
        const token = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('token') || ''
          : '';

        const payload: any = { themeData: theme };
        if (opts?.publish) payload.isPublished = true;

        const response = await fetch(`/projects/${projectId}/update`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to save theme');

        if (opts?.publish) {
          console.log('[Theme] Site published successfully!');
        }
      } catch (err) {
        console.error('[Theme] Save error:', err);
      } finally {
        setIsSaving(false);
      }
    }
  }, [theme, projectId]);

  return (
    <ThemeContext.Provider value={{
      theme, setToken, reorderLayout, toggleNode,
      updateNode, addNode, removeNode, moveNode, findNodeById,
      resetTheme, loadTheme, exportJSON, saveTheme, isSaving
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
