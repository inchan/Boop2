import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FileContentTabs } from './FileContentTabs';
import type { OpenFileTab } from './projectFileTypes';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

const tabs: OpenFileTab[] = [
  { id: '/tmp/Boop2/App.tsx', path: '/tmp/Boop2/App.tsx', title: 'App.tsx', content: '' },
  {
    id: '/tmp/Boop2/ProjectPanel.tsx',
    path: '/tmp/Boop2/ProjectPanel.tsx',
    title: 'ProjectPanel.tsx',
    content: '',
  },
];

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

describe('FileContentTabs', () => {
  it('renders one tab per file without an add-tab action', () => {
    const host = render(
      <FileContentTabs
        tabs={tabs}
        activeTabId="/tmp/Boop2/App.tsx"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
      />
    );

    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(host.querySelector('[data-testid="file-content-tab-add"]')).toBeNull();
  });

  it('emits select and close actions', () => {
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();
    const host = render(
      <FileContentTabs
        tabs={tabs}
        activeTabId="/tmp/Boop2/App.tsx"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
      />
    );

    act(() => {
      host
        .querySelector<HTMLButtonElement>(
          '[data-testid="file-content-tab-/tmp/Boop2/ProjectPanel.tsx"]'
        )
        ?.click();
    });
    act(() => {
      host
        .querySelector<HTMLButtonElement>(
          '[data-testid="file-content-tab-close-/tmp/Boop2/App.tsx"]'
        )
        ?.click();
    });

    expect(onSelectTab).toHaveBeenCalledWith('/tmp/Boop2/ProjectPanel.tsx');
    expect(onCloseTab).toHaveBeenCalledWith('/tmp/Boop2/App.tsx');
  });

  it('renders an empty state when no files are open', () => {
    const host = render(<FileContentTabs tabs={[]} onSelectTab={vi.fn()} onCloseTab={vi.fn()} />);

    expect(host.textContent).toContain('No file open');
  });
});
