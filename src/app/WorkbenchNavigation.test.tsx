import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { WorkbenchNavigation, type WorkbenchSection } from './WorkbenchNavigation';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

const render = (element: ReactElement) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root?.render(element);
  });

  return container;
};

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount();
    });
  }
  container?.remove();
  root = null;
  container = null;
});

const sections: WorkbenchSection[] = [
  {
    id: 'documents',
    title: 'Documents',
    items: [
      { id: 'tab-1', title: 'One', description: 'First tab', contentTabIds: ['tab-1'] },
      { id: 'tab-2', title: 'Two', description: 'Second tab', contentTabIds: ['tab-1', 'tab-2'] },
    ],
  },
  {
    id: 'scripts',
    title: 'Scripts',
    items: [{ id: 'open-palette', title: 'Open Palette', description: 'Run scripts' }],
  },
];

describe('WorkbenchNavigation', () => {
  it('selects a menu section and renders its list items', () => {
    const host = render(
      <WorkbenchNavigation
        sections={sections}
        activeSectionId="documents"
        activeItemId="tab-1"
        onSelectSection={vi.fn()}
        onAddSection={vi.fn()}
        onReorderSections={vi.fn()}
        onOpenItem={vi.fn()}
      />
    );

    expect(host.querySelector('[data-testid="workbench-list"]')?.textContent).toContain('One');
    expect(host.querySelector('[data-testid="workbench-list"]')?.textContent).toContain('Two');
  });

  it('allows menu sections to be added', () => {
    const onAddSection = vi.fn();
    const host = render(
      <WorkbenchNavigation
        sections={sections}
        activeSectionId="documents"
        activeItemId="tab-1"
        onSelectSection={vi.fn()}
        onAddSection={onAddSection}
        onReorderSections={vi.fn()}
        onOpenItem={vi.fn()}
      />
    );

    act(() => {
      host.querySelector<HTMLButtonElement>('[data-testid="workbench-menu-add"]')?.click();
    });

    expect(onAddSection).toHaveBeenCalledTimes(1);
  });

  it('supports drag-and-drop menu reordering', () => {
    const onReorderSections = vi.fn();
    const host = render(
      <WorkbenchNavigation
        sections={sections}
        activeSectionId="documents"
        activeItemId="tab-1"
        onSelectSection={vi.fn()}
        onAddSection={vi.fn()}
        onReorderSections={onReorderSections}
        onOpenItem={vi.fn()}
      />
    );

    act(() => {
      host
        .querySelector<HTMLButtonElement>('[data-testid="workbench-menu-documents"]')
        ?.dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
    });
    act(() => {
      host
        .querySelector<HTMLButtonElement>('[data-testid="workbench-menu-scripts"]')
        ?.dispatchEvent(new DragEvent('drop', { bubbles: true }));
    });

    expect(onReorderSections).toHaveBeenCalledWith(['scripts', 'documents']);
  });

  it('opens the selected list item as content tabs', () => {
    const onOpenItem = vi.fn();
    const host = render(
      <WorkbenchNavigation
        sections={sections}
        activeSectionId="documents"
        activeItemId="tab-1"
        onSelectSection={vi.fn()}
        onAddSection={vi.fn()}
        onReorderSections={vi.fn()}
        onOpenItem={onOpenItem}
      />
    );

    act(() => {
      host.querySelector<HTMLButtonElement>('[data-testid="workbench-list-tab-2"]')?.click();
    });

    expect(onOpenItem).toHaveBeenCalledWith(sections[0], sections[0].items[1]);
  });
});
