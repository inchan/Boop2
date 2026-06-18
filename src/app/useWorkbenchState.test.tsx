import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, useEffect, type ReactElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useWorkbenchState, type UseWorkbenchStateResult } from './useWorkbenchState';
import type { WorkbenchCommand } from './workbenchTypes';

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let latestState: UseWorkbenchStateResult | null = null;

interface ProbeProps {
  onCommand: (command: WorkbenchCommand) => void;
  onState: (state: UseWorkbenchStateResult) => void;
}

const Probe = ({ onCommand, onState }: ProbeProps) => {
  const state = useWorkbenchState({
    documentTabs: [
      { id: 'tab-1', title: 'One' },
      { id: 'tab-2', title: 'Two' },
    ],
    activeDocumentTabId: 'tab-1',
    sessionCount: 2,
    clipboardCount: 3,
    createSectionId: () => 'custom-fixed',
    onCommand,
  });

  useEffect(() => {
    onState(state);
  }, [onState, state]);

  return <div>{state.activeSection?.title}</div>;
};

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
  latestState = null;
});

describe('useWorkbenchState', () => {
  it('derives default menu sections and document list items from workspace tabs', () => {
    render(
      <Probe
        onCommand={vi.fn()}
        onState={(state) => {
          latestState = state;
        }}
      />
    );

    expect(latestState?.sections.map((section) => section.id)).toEqual([
      'documents',
      'scripts',
      'sessions',
      'clipboard',
      'settings',
    ]);
    expect(latestState?.activeSection?.id).toBe('documents');
    expect(latestState?.activeSection?.items.map((item) => item.id)).toEqual(['tab-1', 'tab-2']);
  });

  it('adds custom menu sections without leaking id generation into App', () => {
    render(
      <Probe
        onCommand={vi.fn()}
        onState={(state) => {
          latestState = state;
        }}
      />
    );

    act(() => {
      latestState?.addMenuSection();
    });

    expect(latestState?.sections.at(-1)?.id).toBe('custom-fixed');
    expect(latestState?.activeSection?.id).toBe('custom-fixed');
  });

  it('reorders menu sections', () => {
    render(
      <Probe
        onCommand={vi.fn()}
        onState={(state) => {
          latestState = state;
        }}
      />
    );

    act(() => {
      latestState?.reorderMenuSections([
        'scripts',
        'documents',
        'sessions',
        'clipboard',
        'settings',
      ]);
    });

    expect(latestState?.sections.map((section) => section.id)).toEqual([
      'scripts',
      'documents',
      'sessions',
      'clipboard',
      'settings',
    ]);
  });

  it('opens list items by emitting explicit workbench commands', () => {
    const onCommand = vi.fn();
    render(
      <Probe
        onCommand={onCommand}
        onState={(state) => {
          latestState = state;
        }}
      />
    );
    const secondDocument = latestState?.activeSection?.items[1];

    act(() => {
      if (latestState?.activeSection && secondDocument) {
        latestState.openWorkbenchItem(latestState.activeSection, secondDocument);
      }
    });

    expect(onCommand).toHaveBeenCalledWith({ type: 'select-document-tab', tabId: 'tab-2' });
    expect(latestState?.activeItemId).toBe('tab-2');
  });
});
