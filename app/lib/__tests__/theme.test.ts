import { describe, expect, it } from 'vitest';
import {
  addNode,
  canHaveChildren,
  createNode,
  findNode,
  legacySectionsToLayout,
  normalizeThemeLayout,
  removeNode,
  reorderNodes,
  updateNode,
} from '../component-tree';

describe('component tree helpers', () => {
  it('converts legacy sections into layout nodes', () => {
    const layout = legacySectionsToLayout([
      {
        id: 'section-hero',
        type: 'hero',
        label: 'Hero Banner',
        visible: true,
        settings: {},
        blocks: [
          { id: 'headline-1', type: 'headline', settings: { text: 'Hello' } },
        ],
      },
    ]);

    expect(layout[0].type).toBe('container');
    expect(layout[0].settings.preset).toBe('hero');
    expect(layout[0].children?.[0].type).toBe('headline');
  });

  it('normalizes themes without layout', () => {
    const theme = normalizeThemeLayout({
      storeName: 'Legacy',
      sections: [{ id: 'section-products', type: 'featured-products', label: 'Products', visible: true, settings: { count: 4 } }],
    });

    expect(theme.layout).toHaveLength(1);
    expect(theme.layout[0].type).toBe('featured-products');
  });

  it('adds child nodes only to child-capable parents', () => {
    const container = createNode('container', 'Container');
    const headline = createNode('headline', 'Headline');
    const child = createNode('paragraph', 'Paragraph');

    const withContainerChild = addNode([container], child, container.id);
    expect(withContainerChild[0].children).toHaveLength(1);

    const withLeafChild = addNode([headline], child, headline.id);
    expect(withLeafChild[0].children).toBeUndefined();
    expect(canHaveChildren('headline')).toBe(false);
  });

  it('updates nested node settings immutably', () => {
    const parent = createNode('container', 'Container');
    const child = createNode('headline', 'Headline');
    const tree = addNode([parent], child, parent.id);
    const updated = updateNode(tree, child.id, node => ({ ...node, settings: { ...node.settings, text: 'Updated' } }));

    expect(findNode(updated, child.id)?.settings.text).toBe('Updated');
    expect(findNode(tree, child.id)?.settings.text).not.toBe('Updated');
  });

  it('removes nested nodes', () => {
    const parent = createNode('container', 'Container');
    const child = createNode('headline', 'Headline');
    const tree = addNode([parent], child, parent.id);

    expect(findNode(removeNode(tree, child.id), child.id)).toBeNull();
  });

  it('reorders sibling nodes', () => {
    const first = createNode('headline', 'First');
    const second = createNode('paragraph', 'Second');
    const reordered = reorderNodes([first, second], null, 0, 1);

    expect(reordered[0].id).toBe(second.id);
    expect(reordered[1].id).toBe(first.id);
  });
});
