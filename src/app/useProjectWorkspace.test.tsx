import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useEffect, type ReactElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useProjectWorkspace, type UseProjectWorkspaceResult } from './useProjectWorkspace';
import type { ProjectFileClient } from './projectFileTypes';

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let latestState: UseProjectWorkspaceResult | null = null;
const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

const client: ProjectFileClient = {
  chooseProjectDirectory: vi.fn().mockResolvedValue('/tmp/Boop2'),
  listProjectDirectory: vi.fn().mockResolvedValue([
    { id: '/tmp/Boop2/src', name: 'src', path: '/tmp/Boop2/src', kind: 'folder' },
    { id: '/tmp/Boop2/App.tsx', name: 'App.tsx', path: '/tmp/Boop2/App.tsx', kind: 'file' },
  ]),
  readProjectFile: vi.fn().mockResolvedValue('file content'),
  createProjectFile: vi.fn().mockResolvedValue({
    id: '/tmp/Boop2/Untitled.md',
    name: 'Untitled.md',
    path: '/tmp/Boop2/Untitled.md',
    kind: 'file',
    extension: 'md',
  }),
  createProjectFolder: vi.fn().mockResolvedValue({
    id: '/tmp/Boop2/Untitled',
    name: 'Untitled',
    path: '/tmp/Boop2/Untitled',
    kind: 'folder',
  }),
  moveProjectEntry: vi.fn().mockResolvedValue({
    id: '/tmp/Boop2/src/App.tsx',
    name: 'App.tsx',
    path: '/tmp/Boop2/src/App.tsx',
    kind: 'file',
    extension: 'tsx',
  }),
};

const Probe = ({ onState }: { onState: (state: UseProjectWorkspaceResult) => void }) => {
  const state = useProjectWorkspace({ client });

  useEffect(() => {
    onState(state);
  }, [onState, state]);

  return <div>{state.activeProject?.name}</div>;
};

const render = (element: ReactElement) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root?.render(element);
  });
};

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
});

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
  if (originalLocalStorageDescriptor) {
    Object.defineProperty(globalThis, 'localStorage', originalLocalStorageDescriptor);
  } else {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  }
  vi.clearAllMocks();
});

describe('useProjectWorkspace', () => {
  it('loads the saved active Project root on mount', async () => {
    globalThis.localStorage?.setItem(
      'boop_projects_v1',
      JSON.stringify({
        projects: [{ id: 'project:/tmp/Boop2', name: 'Boop2', rootPath: '/tmp/Boop2' }],
        activeProjectId: 'project:/tmp/Boop2',
      })
    );

    render(<Probe onState={(state) => (latestState = state)} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(client.listProjectDirectory).toHaveBeenCalledWith('/tmp/Boop2');
    expect(latestState?.fileTree).toHaveLength(2);
  });

  it('adds a selected directory as a Project and deduplicates the same root', async () => {
    render(<Probe onState={(state) => (latestState = state)} />);

    await act(async () => {
      await latestState?.addProject();
    });
    await act(async () => {
      await latestState?.addProject();
    });

    expect(latestState?.projects).toHaveLength(1);
    expect(latestState?.activeProject?.name).toBe('Boop2');
  });

  it('opens one tab per file path and activates duplicates', async () => {
    render(<Probe onState={(state) => (latestState = state)} />);

    await act(async () => {
      await latestState?.openFile('/tmp/Boop2/App.tsx', 'App.tsx');
    });
    await act(async () => {
      await latestState?.openFile('/tmp/Boop2/App.tsx', 'App.tsx');
    });

    expect(latestState?.openTabs).toHaveLength(1);
    expect(latestState?.activeTab?.content).toBe('file content');
  });

  it('creates an Untitled markdown file at the active Project root and opens it', async () => {
    render(<Probe onState={(state) => (latestState = state)} />);

    await act(async () => {
      await latestState?.addProject();
    });
    await act(async () => {
      await latestState?.createFile();
    });

    expect(client.createProjectFile).toHaveBeenCalledWith('/tmp/Boop2');
    expect(latestState?.activeTab?.title).toBe('Untitled.md');
    expect(latestState?.activeTab?.content).toBe('');
    expect(latestState?.selectedFilePath).toBe('/tmp/Boop2/Untitled.md');
  });

  it('creates an Untitled markdown file inside the selected folder and opens it', async () => {
    vi.mocked(client.createProjectFile).mockResolvedValueOnce({
      id: '/tmp/Boop2/src/Untitled.md',
      name: 'Untitled.md',
      path: '/tmp/Boop2/src/Untitled.md',
      kind: 'file',
      extension: 'md',
    });

    render(<Probe onState={(state) => (latestState = state)} />);

    await act(async () => {
      await latestState?.addProject();
    });
    await act(async () => {
      await latestState?.toggleFolder({
        id: '/tmp/Boop2/src',
        name: 'src',
        path: '/tmp/Boop2/src',
        kind: 'folder',
      });
    });
    await act(async () => {
      await latestState?.createFile();
    });

    expect(client.createProjectFile).toHaveBeenLastCalledWith('/tmp/Boop2/src');
    expect(latestState?.activeTab?.title).toBe('Untitled.md');
    expect(latestState?.activeTab?.path).toBe('/tmp/Boop2/src/Untitled.md');
    expect(latestState?.activeTab?.content).toBe('');
    expect(latestState?.selectedFilePath).toBe('/tmp/Boop2/src/Untitled.md');
  });

  it('creates an Untitled folder at the active Project root without opening a tab', async () => {
    render(<Probe onState={(state) => (latestState = state)} />);

    await act(async () => {
      await latestState?.addProject();
    });
    await act(async () => {
      await latestState?.createFolder();
    });

    expect(client.createProjectFolder).toHaveBeenCalledWith('/tmp/Boop2');
    expect(latestState?.openTabs).toHaveLength(0);
  });

  it('moves an open file into a folder and rewrites the open tab path', async () => {
    render(<Probe onState={(state) => (latestState = state)} />);

    await act(async () => {
      await latestState?.addProject();
    });
    await act(async () => {
      await latestState?.openFile('/tmp/Boop2/App.tsx', 'App.tsx');
    });
    await act(async () => {
      await latestState?.moveEntry(
        {
          id: '/tmp/Boop2/App.tsx',
          name: 'App.tsx',
          path: '/tmp/Boop2/App.tsx',
          kind: 'file',
          extension: 'tsx',
        },
        '/tmp/Boop2/src'
      );
    });

    expect(client.moveProjectEntry).toHaveBeenCalledWith('/tmp/Boop2/App.tsx', '/tmp/Boop2/src');
    expect(latestState?.activeTabId).toBe('/tmp/Boop2/src/App.tsx');
    expect(latestState?.activeTab?.path).toBe('/tmp/Boop2/src/App.tsx');
    expect(latestState?.activeTab?.content).toBe('file content');
    expect(latestState?.selectedFilePath).toBe('/tmp/Boop2/src/App.tsx');
  });
});
