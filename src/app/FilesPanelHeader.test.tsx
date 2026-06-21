import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FilesPanelHeader } from './FilesPanelHeader';

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

describe('FilesPanelHeader', () => {
  it('renders a plus action that opens file and folder creation options', () => {
    const host = render(<FilesPanelHeader onCreateFile={vi.fn()} onCreateFolder={vi.fn()} />);

    act(() => {
      host.querySelector<HTMLButtonElement>('[data-testid="files-panel-add"]')?.click();
    });

    expect(host.querySelector('[role="menu"]')?.textContent).toContain('New File');
    expect(host.querySelector('[role="menu"]')?.textContent).toContain('New Folder');
  });

  it('emits create file and create folder actions from the menu', () => {
    const onCreateFile = vi.fn();
    const onCreateFolder = vi.fn();
    const host = render(
      <FilesPanelHeader onCreateFile={onCreateFile} onCreateFolder={onCreateFolder} />
    );

    act(() => {
      host.querySelector<HTMLButtonElement>('[data-testid="files-panel-add"]')?.click();
    });
    act(() => {
      host.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')[0]?.click();
    });
    act(() => {
      host.querySelector<HTMLButtonElement>('[data-testid="files-panel-add"]')?.click();
    });
    act(() => {
      host.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')[1]?.click();
    });

    expect(onCreateFile).toHaveBeenCalledTimes(1);
    expect(onCreateFolder).toHaveBeenCalledTimes(1);
  });

  it('disables the plus action when there is no active Project', () => {
    const host = render(
      <FilesPanelHeader disabled onCreateFile={vi.fn()} onCreateFolder={vi.fn()} />
    );

    expect(host.querySelector<HTMLButtonElement>('[data-testid="files-panel-add"]')?.disabled).toBe(
      true
    );
  });
});
