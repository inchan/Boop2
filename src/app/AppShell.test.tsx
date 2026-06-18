import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AppShell } from './AppShell';
import { ContentTabs, ContentTab } from './ContentTabs';

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

describe('AppShell', () => {
  it('renders the top, menu, list, content, and bottom regions with pane headers', () => {
    const host = render(
      <AppShell
        top={<span>Boop2</span>}
        menuHeader="Menu"
        menu={<button>Scripts</button>}
        listHeader="List"
        list={<span>Transforms</span>}
        contentHeader="Content"
        content={<main>Editor surface</main>}
        bottom={<span>Ready</span>}
      />
    );

    expect(host.querySelector('[data-shell-region="top"]')?.textContent).toContain('Boop2');
    expect(host.querySelector('[data-shell-region="menu"]')?.textContent).toContain('Menu');
    expect(host.querySelector('[data-shell-region="list"]')?.textContent).toContain('List');
    expect(host.querySelector('[data-shell-region="content"]')?.textContent).toContain('Content');
    expect(host.querySelector('[data-shell-region="bottom"]')?.textContent).toContain('Ready');
    expect(host.querySelector('[data-shell-region="content"]')?.textContent).toContain(
      'Editor surface'
    );
  });
});

describe('ContentTabs', () => {
  const tabs: ContentTab[] = [
    { id: 'editor', title: 'Editor', kind: 'document' },
    { id: 'script', title: 'Script Detail', kind: 'script' },
  ];

  it('renders typed content tabs and marks the active tab', () => {
    const host = render(
      <ContentTabs tabs={tabs} activeTabId="script" onSelect={vi.fn()} onAdd={vi.fn()} />
    );

    const active = host.querySelector('[role="tab"][aria-selected="true"]');

    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(active?.textContent).toContain('Script Detail');
    expect(active?.getAttribute('data-tab-kind')).toBe('script');
  });

  it('emits add and select events for content tab actions', () => {
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    const host = render(
      <ContentTabs tabs={tabs} activeTabId="editor" onSelect={onSelect} onAdd={onAdd} />
    );

    act(() => {
      host.querySelector<HTMLButtonElement>('[data-testid="content-tab-script"]')?.click();
      host.querySelector<HTMLButtonElement>('[data-testid="content-tab-add"]')?.click();
    });

    expect(onSelect).toHaveBeenCalledWith('script');
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
