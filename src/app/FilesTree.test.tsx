import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ComponentProps, type ReactElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FilesTree } from './FilesTree';
import type { ProjectFileNode } from './projectFileTypes';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

const nodes: ProjectFileNode[] = [
  {
    id: '/tmp/Boop2/src',
    name: 'very-long-folder-name-that-can-truncate',
    path: '/tmp/Boop2/src',
    kind: 'folder',
  },
  {
    id: '/tmp/Boop2/script-with-a-very-long-name.test.ts',
    name: 'script-with-a-very-long-name.test.ts',
    path: '/tmp/Boop2/script-with-a-very-long-name.test.ts',
    kind: 'file',
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

const renderFilesTree = (props?: Partial<ComponentProps<typeof FilesTree>>) =>
  render(
    <FilesTree
      nodes={nodes}
      expandedPaths={new Set()}
      onToggleFolder={vi.fn()}
      onOpenFile={vi.fn()}
      onMoveEntry={vi.fn()}
      {...props}
    />
  );

const dispatchPointerEvent = (
  target: EventTarget,
  type: string,
  options: { pointerId?: number; clientX?: number; clientY?: number; button?: number } = {}
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    pointerId: options.pointerId ?? 1,
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    button: options.button ?? 0,
  });

  act(() => {
    target.dispatchEvent(event);
  });
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

describe('FilesTree', () => {
  it('renders folder rows with only an icon and name', () => {
    const host = renderFilesTree();

    const row = host.querySelector('[data-testid="files-tree-row-/tmp/Boop2/src"]');
    const parts = Array.from(row?.children ?? []).map((child) =>
      child.getAttribute('data-tree-part')
    );

    expect(parts).toEqual(['icon', 'name']);
  });

  it('toggles a folder from the whole folder row', () => {
    const onToggleFolder = vi.fn();
    const host = renderFilesTree({ onToggleFolder });

    act(() => {
      host
        .querySelector<HTMLButtonElement>('[data-testid="files-tree-row-/tmp/Boop2/src"]')
        ?.click();
    });

    expect(onToggleFolder).toHaveBeenCalledWith(nodes[0]);
  });

  it('splits file stem and extension so the extension remains visible', () => {
    const host = renderFilesTree();

    expect(host.querySelector('[data-testid="files-tree-file-stem"]')?.textContent).toBe(
      'script-with-a-very-long-name.test'
    );
    expect(host.querySelector('[data-testid="files-tree-file-ext"]')?.textContent).toBe('.ts');
  });

  it('renders file rows with only an icon and name', () => {
    const host = renderFilesTree();

    const row = host.querySelector(
      '[data-testid="files-tree-row-/tmp/Boop2/script-with-a-very-long-name.test.ts"]'
    );
    const parts = Array.from(row?.children ?? []).map((child) =>
      child.getAttribute('data-tree-part')
    );

    expect(parts).toEqual(['icon', 'name']);
  });

  it('only adds tooltips when measured text is truncated', () => {
    const originalScrollWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollWidth'
    );
    const originalClientWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'clientWidth'
    );

    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => 200,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 100,
    });

    const host = renderFilesTree();

    expect(
      host.querySelector('[data-testid="files-tree-folder-name"]')?.getAttribute('title')
    ).toBe('very-long-folder-name-that-can-truncate');
    expect(host.querySelector('[data-testid="files-tree-file-stem"]')?.getAttribute('title')).toBe(
      'script-with-a-very-long-name.test.ts'
    );

    if (originalScrollWidth)
      Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalScrollWidth);
    else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollWidth;
    if (originalClientWidth)
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth);
    else delete (HTMLElement.prototype as Partial<HTMLElement>).clientWidth;
  });

  it('moves a dragged file into a dropped folder', () => {
    const onMoveEntry = vi.fn();
    const host = renderFilesTree({ onMoveEntry });
    const fileRow = host.querySelector(
      '[data-testid="files-tree-row-/tmp/Boop2/script-with-a-very-long-name.test.ts"]'
    );
    const folderRow = host.querySelector('[data-testid="files-tree-row-/tmp/Boop2/src"]');
    const originalElementFromPoint = document.elementFromPoint;

    if (!fileRow || !folderRow) throw new Error('expected file and folder rows');

    document.elementFromPoint = vi.fn().mockReturnValue(folderRow);
    dispatchPointerEvent(fileRow, 'pointerdown', { clientX: 0, clientY: 0 });
    dispatchPointerEvent(document, 'pointermove', { clientX: 10, clientY: 0 });
    dispatchPointerEvent(document, 'pointerup', { clientX: 10, clientY: 0 });
    document.elementFromPoint = originalElementFromPoint;

    expect(onMoveEntry).toHaveBeenCalledWith(nodes[1], nodes[0]);
  });

  it('renders a floating drag preview while dragging an entry', () => {
    const host = renderFilesTree();
    const fileRow = host.querySelector(
      '[data-testid="files-tree-row-/tmp/Boop2/script-with-a-very-long-name.test.ts"]'
    );
    const originalElementFromPoint = document.elementFromPoint;

    if (!fileRow) throw new Error('expected file row');

    document.elementFromPoint = vi.fn().mockReturnValue(fileRow);
    dispatchPointerEvent(fileRow, 'pointerdown', { clientX: 0, clientY: 0 });
    dispatchPointerEvent(document, 'pointermove', { clientX: 24, clientY: 18 });

    const preview = host.querySelector<HTMLElement>('[data-testid="files-tree-drag-preview"]');

    expect(preview?.textContent).toContain('script-with-a-very-long-name.test.ts');
    expect(preview?.style.getPropertyValue('--drag-preview-x')).toBe('24px');
    expect(preview?.style.getPropertyValue('--drag-preview-y')).toBe('18px');

    dispatchPointerEvent(document, 'pointerup', { clientX: 24, clientY: 18 });
    document.elementFromPoint = originalElementFromPoint;

    expect(host.querySelector('[data-testid="files-tree-drag-preview"]')).toBeNull();
  });

  it('moves a dragged file to the Project root when dropped on the tree background', () => {
    const onMoveEntry = vi.fn();
    const host = renderFilesTree({ onMoveEntry });
    const tree = host.querySelector('[data-testid="files-tree"]');
    const fileRow = host.querySelector(
      '[data-testid="files-tree-row-/tmp/Boop2/script-with-a-very-long-name.test.ts"]'
    );
    const originalElementFromPoint = document.elementFromPoint;

    if (!tree || !fileRow) throw new Error('expected tree and file row');

    document.elementFromPoint = vi.fn().mockReturnValue(tree);
    dispatchPointerEvent(fileRow, 'pointerdown', { clientX: 0, clientY: 0 });
    dispatchPointerEvent(document, 'pointermove', { clientX: 10, clientY: 0 });
    dispatchPointerEvent(document, 'pointerup', { clientX: 10, clientY: 0 });
    document.elementFromPoint = originalElementFromPoint;

    expect(onMoveEntry).toHaveBeenCalledWith(nodes[1]);
  });

  it('calls onOpenEntryMenu on right-click with the node and position', () => {
    const onOpenEntryMenu = vi.fn();
    const view = renderFilesTree({ onOpenEntryMenu });

    const fileRow = view.querySelector(
      '[data-testid="files-tree-row-/tmp/Boop2/script-with-a-very-long-name.test.ts"]'
    ) as HTMLElement;
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 12,
      clientY: 34,
    });
    act(() => {
      fileRow.dispatchEvent(event);
    });

    expect(onOpenEntryMenu).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/tmp/Boop2/script-with-a-very-long-name.test.ts' }),
      { x: 12, y: 34 }
    );
  });

  it('renders an input for the renaming row and submits on Enter', () => {
    const onRenameSubmit = vi.fn();
    const view = renderFilesTree({
      renamingPath: '/tmp/Boop2/script-with-a-very-long-name.test.ts',
      onRenameSubmit,
      onRenameCancel: vi.fn(),
    });

    const input = view.querySelector(
      'input[data-testid="files-tree-rename-input"]'
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    act(() => {
      input.value = 'newName.ts';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      );
    });

    expect(onRenameSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/tmp/Boop2/script-with-a-very-long-name.test.ts' }),
      'newName.ts'
    );
  });

  it('cancels rename on Escape', () => {
    const onRenameCancel = vi.fn();
    const view = renderFilesTree({
      renamingPath: '/tmp/Boop2/script-with-a-very-long-name.test.ts',
      onRenameCancel,
      onRenameSubmit: vi.fn(),
    });

    const input = view.querySelector(
      'input[data-testid="files-tree-rename-input"]'
    ) as HTMLInputElement;
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      );
    });

    expect(onRenameCancel).toHaveBeenCalled();
  });
});
