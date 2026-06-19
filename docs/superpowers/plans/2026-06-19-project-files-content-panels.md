# Project Files Content Panels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic workbench menu/list/content composition with Project, Files, and Content panels backed by root-folder Projects and read-only file loading.

**Architecture:** Add a focused project file shell model instead of extending the current generic workbench sections. Tauri owns native folder selection and read-only filesystem commands; React owns Project persistence, lazy tree state, in-memory file tabs, and presentation. The legacy `TabBar` and content group UI stop rendering in the new shell.

**Tech Stack:** Tauri 2, React 19, TypeScript, Slate editor, Vitest, Playwright, Rust filesystem APIs, `@tauri-apps/plugin-dialog`.

---

## File Structure

- Create `src/app/projectFileTypes.ts`: shared Project, file node, file tab, and client dependency types.
- Create `src/app/projectPathUtils.ts`: path display names, file extension splitting, excluded directory checks, deterministic ids.
- Create `src/app/projectFileClient.ts`: frontend adapter for Tauri dialog and filesystem commands.
- Create `src/app/useProjectWorkspace.ts`: Project list persistence, active Project, lazy tree state, file tab state, and in-memory content updates.
- Create `src/app/ProjectPanel.tsx`: first panel UI with header `+` action and Project rows.
- Create `src/app/FilesTree.tsx`: second panel UI with folder/file rows, hover-only disclosure, extension-preserving filenames, conditional tooltip support.
- Create `src/app/FileContentTabs.tsx`: third panel tab strip with close buttons and no new-tab action.
- Create `src/app/useOverflowTitle.ts`: small hook that sets `title` only when rendered text overflows.
- Create focused tests beside each module.
- Modify `src/App.tsx`: replace `WorkbenchMenu`, `WorkbenchList`, `ContentTabs`, and body `TabBar` rendering with the new Project/Files/Content modules; keep utility actions in the shell top header.
- Modify `src/app/AppShell.css`: add Project/Files/Content row and tab styles.
- Modify `src-tauri/src/lib.rs`: add read-only filesystem commands and dialog plugin init.
- Modify `src-tauri/Cargo.toml`, `package.json`, `package-lock.json`, `src-tauri/Cargo.lock`, and `src-tauri/capabilities/default.json`: add Tauri dialog support and permissions.

---

### Task 1: Backend Read Commands

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/src/lib.rs`

- [ ] **Step 1: Write failing Rust tests**

Add tests under the existing `#[cfg(test)] mod tests`:

```rust
#[test]
fn project_file_extension_uses_final_extension() {
    assert_eq!(file_extension("AppShell.tsx"), Some("tsx".to_string()));
    assert_eq!(file_extension("script.test.ts"), Some("ts".to_string()));
    assert_eq!(file_extension("README"), None);
}

#[test]
fn project_directory_exclusion_skips_generated_and_hidden_dirs() {
    assert!(is_excluded_project_entry(".git", true));
    assert!(is_excluded_project_entry("node_modules", true));
    assert!(is_excluded_project_entry("target", true));
    assert!(is_excluded_project_entry(".env", false));
    assert!(!is_excluded_project_entry("src", true));
    assert!(!is_excluded_project_entry("App.tsx", false));
}
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml project_file_extension_uses_final_extension project_directory_exclusion_skips_generated_and_hidden_dirs
```

Expected: fail because `file_extension` and `is_excluded_project_entry` do not exist.

- [ ] **Step 3: Implement filesystem data helpers and commands**

Add near the existing script metadata structs:

```rust
#[derive(Serialize, Debug, Clone)]
struct ProjectFileNode {
    id: String,
    name: String,
    path: String,
    kind: String,
    extension: Option<String>,
    children_loaded: bool,
}

fn file_extension(name: &str) -> Option<String> {
    std::path::Path::new(name)
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_string())
}

fn is_excluded_project_entry(name: &str, is_dir: bool) -> bool {
    const EXCLUDED_DIRS: &[&str] = &[
        ".git",
        "node_modules",
        "dist",
        "dist-ssr",
        "target",
        "coverage",
        "playwright-report",
        "test-results",
    ];

    name.starts_with('.') || (is_dir && EXCLUDED_DIRS.contains(&name))
}

fn project_node_id(path: &std::path::Path) -> String {
    path.to_string_lossy().to_string()
}

#[tauri::command]
fn list_project_directory(path: String) -> Result<Vec<ProjectFileNode>, String> {
    let directory = PathBuf::from(path);
    if !directory.is_dir() {
        return Err("Project directory path is not a directory".to_string());
    }

    let entries = fs::read_dir(&directory).map_err(|error| error.to_string())?;
    let mut nodes = Vec::new();

    for entry in entries.flatten() {
        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        let is_dir = entry_path.is_dir();
        if is_excluded_project_entry(&name, is_dir) {
            continue;
        }

        nodes.push(ProjectFileNode {
            id: project_node_id(&entry_path),
            name: name.clone(),
            path: entry_path.to_string_lossy().to_string(),
            kind: if is_dir { "folder" } else { "file" }.to_string(),
            extension: if is_dir { None } else { file_extension(&name) },
            children_loaded: false,
        });
    }

    nodes.sort_by(|left, right| {
        left.kind
            .cmp(&right.kind)
            .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
    });
    Ok(nodes)
}

#[tauri::command]
fn read_project_file(path: String) -> Result<String, String> {
    let file_path = PathBuf::from(path);
    if !file_path.is_file() {
        return Err("Project file path is not a file".to_string());
    }

    fs::read_to_string(file_path).map_err(|error| error.to_string())
}
```

Update the Tauri invoke handler:

```rust
.invoke_handler(tauri::generate_handler![
    load_scripts,
    list_project_directory,
    read_project_file
])
```

- [ ] **Step 4: Run Rust tests**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml project_file_extension_uses_final_extension project_directory_exclusion_skips_generated_and_hidden_dirs
```

Expected: both tests pass.

### Task 2: Dialog Dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/Cargo.lock`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/capabilities/default.json`

- [ ] **Step 1: Install frontend and Rust dialog plugins**

Run:

```bash
npm install @tauri-apps/plugin-dialog@^2
```

Then add to `src-tauri/Cargo.toml` under desktop target dependencies:

```toml
tauri-plugin-dialog = "2"
```

Run:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

Expected: Cargo resolves `tauri-plugin-dialog` and updates `src-tauri/Cargo.lock`.

- [ ] **Step 2: Register the dialog plugin**

In `src-tauri/src/lib.rs`, add before `.setup(...)`:

```rust
.plugin(tauri_plugin_dialog::init())
```

In `src-tauri/capabilities/default.json`, add:

```json
"dialog:default"
```

- [ ] **Step 3: Verify dependency wiring**

Run:

```bash
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

Expected: TypeScript and Rust both compile.

### Task 3: Project Path Utilities

**Files:**
- Create: `src/app/projectPathUtils.ts`
- Test: `src/app/projectPathUtils.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/projectPathUtils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  createProjectId,
  getDefaultProjectName,
  splitFileNameForDisplay,
} from './projectPathUtils';

describe('projectPathUtils', () => {
  it('derives project names from root paths', () => {
    expect(getDefaultProjectName('/Users/inchan/workspace/private/Boop2')).toBe('Boop2');
    expect(getDefaultProjectName('/Users/inchan/workspace/private/Boop2/')).toBe('Boop2');
  });

  it('creates stable project ids from root paths', () => {
    expect(createProjectId('/tmp/Boop2')).toBe('project:/tmp/Boop2');
  });

  it('splits filenames so the final extension can stay visible', () => {
    expect(splitFileNameForDisplay('AppShell.tsx')).toEqual({
      stem: 'AppShell',
      extension: '.tsx',
    });
    expect(splitFileNameForDisplay('script-with-long-name.test.ts')).toEqual({
      stem: 'script-with-long-name.test',
      extension: '.ts',
    });
    expect(splitFileNameForDisplay('README')).toEqual({ stem: 'README', extension: '' });
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- src/app/projectPathUtils.test.ts --run
```

Expected: fail because `projectPathUtils.ts` does not exist.

- [ ] **Step 3: Implement utilities**

Create `src/app/projectPathUtils.ts`:

```ts
export function normalizeProjectPath(rootPath: string): string {
  return rootPath.replace(/\/+$/, '') || rootPath;
}

export function getDefaultProjectName(rootPath: string): string {
  const normalized = normalizeProjectPath(rootPath);
  return normalized.split(/[\\/]/).filter(Boolean).at(-1) ?? normalized;
}

export function createProjectId(rootPath: string): string {
  return `project:${normalizeProjectPath(rootPath)}`;
}

export function splitFileNameForDisplay(fileName: string): { stem: string; extension: string } {
  const extensionIndex = fileName.lastIndexOf('.');
  if (extensionIndex <= 0 || extensionIndex === fileName.length - 1) {
    return { stem: fileName, extension: '' };
  }

  return {
    stem: fileName.slice(0, extensionIndex),
    extension: fileName.slice(extensionIndex),
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- src/app/projectPathUtils.test.ts --run
```

Expected: pass.

### Task 4: Project File Types And Client

**Files:**
- Create: `src/app/projectFileTypes.ts`
- Create: `src/app/projectFileClient.ts`
- Test: `src/app/projectFileClient.test.ts`

- [ ] **Step 1: Write client tests**

Create `src/app/projectFileClient.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { ProjectFileNode } from './projectFileTypes';

describe('projectFileTypes', () => {
  it('allows folder and file nodes with read-only content flow', () => {
    const node: ProjectFileNode = {
      id: 'project:/tmp/Boop2/src',
      name: 'src',
      path: '/tmp/Boop2/src',
      kind: 'folder',
      childrenLoaded: false,
    };

    expect(node.kind).toBe('folder');
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- src/app/projectFileClient.test.ts --run
```

Expected: fail because `projectFileTypes.ts` does not exist.

- [ ] **Step 3: Implement types and client**

Create `src/app/projectFileTypes.ts`:

```ts
export interface ProjectEntry {
  id: string;
  name: string;
  rootPath: string;
}

export interface ProjectFileNode {
  id: string;
  name: string;
  path: string;
  kind: 'folder' | 'file';
  extension?: string;
  children?: ProjectFileNode[];
  childrenLoaded?: boolean;
}

export interface OpenFileTab {
  id: string;
  path: string;
  title: string;
  content: string;
}

export interface ProjectFileClient {
  chooseProjectDirectory: () => Promise<string | null>;
  listProjectDirectory: (path: string) => Promise<ProjectFileNode[]>;
  readProjectFile: (path: string) => Promise<string>;
}
```

Create `src/app/projectFileClient.ts`:

```ts
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { ProjectFileClient, ProjectFileNode } from './projectFileTypes';

interface BackendProjectFileNode {
  id: string;
  name: string;
  path: string;
  kind: 'folder' | 'file';
  extension?: string;
  children_loaded?: boolean;
}

const normalizeNode = (node: BackendProjectFileNode): ProjectFileNode => ({
  id: node.id,
  name: node.name,
  path: node.path,
  kind: node.kind,
  extension: node.extension,
  childrenLoaded: node.children_loaded ?? false,
});

export const projectFileClient: ProjectFileClient = {
  async chooseProjectDirectory() {
    const selected = await open({ directory: true, multiple: false });
    return typeof selected === 'string' ? selected : null;
  },
  async listProjectDirectory(path) {
    const nodes = await invoke<BackendProjectFileNode[]>('list_project_directory', { path });
    return nodes.map(normalizeNode);
  },
  async readProjectFile(path) {
    return invoke<string>('read_project_file', { path });
  },
};
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- src/app/projectFileClient.test.ts --run
```

Expected: pass.

### Task 5: Project Workspace State

**Files:**
- Create: `src/app/useProjectWorkspace.ts`
- Test: `src/app/useProjectWorkspace.test.tsx`

- [ ] **Step 1: Write failing hook tests**

Create tests that cover duplicate Project activation and duplicate file tab activation. Use an injected `ProjectFileClient` so tests do not call Tauri.

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, useEffect, type ReactElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useProjectWorkspace, type UseProjectWorkspaceResult } from './useProjectWorkspace';
import type { ProjectFileClient } from './projectFileTypes';

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let latestState: UseProjectWorkspaceResult | null = null;

const client: ProjectFileClient = {
  chooseProjectDirectory: vi.fn().mockResolvedValue('/tmp/Boop2'),
  listProjectDirectory: vi.fn().mockResolvedValue([
    { id: '/tmp/Boop2/src', name: 'src', path: '/tmp/Boop2/src', kind: 'folder' },
    { id: '/tmp/Boop2/App.tsx', name: 'App.tsx', path: '/tmp/Boop2/App.tsx', kind: 'file' },
  ]),
  readProjectFile: vi.fn().mockResolvedValue('file content'),
};

const Probe = ({ onState }: { onState: (state: UseProjectWorkspaceResult) => void }) => {
  const state = useProjectWorkspace({ client });
  useEffect(() => onState(state), [onState, state]);
  return <div>{state.activeProject?.name}</div>;
};

const render = (element: ReactElement) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root?.render(element));
};

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  latestState = null;
  localStorage.clear();
  vi.clearAllMocks();
});

describe('useProjectWorkspace', () => {
  it('adds a selected directory as a Project and deduplicates the same root', async () => {
    render(<Probe onState={(state) => (latestState = state)} />);

    await act(async () => latestState?.addProject());
    await act(async () => latestState?.addProject());

    expect(latestState?.projects).toHaveLength(1);
    expect(latestState?.activeProject?.name).toBe('Boop2');
  });

  it('opens one tab per file path and activates duplicates', async () => {
    render(<Probe onState={(state) => (latestState = state)} />);

    await act(async () => latestState?.openFile('/tmp/Boop2/App.tsx', 'App.tsx'));
    await act(async () => latestState?.openFile('/tmp/Boop2/App.tsx', 'App.tsx'));

    expect(latestState?.openTabs).toHaveLength(1);
    expect(latestState?.activeTab?.content).toBe('file content');
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- src/app/useProjectWorkspace.test.tsx --run
```

Expected: fail because `useProjectWorkspace.ts` does not exist.

- [ ] **Step 3: Implement the hook**

Implement the hook with:

- `projects`, `activeProjectId`, `activeProject`
- `fileTree`, `expandedPaths`, `selectedFilePath`
- `openTabs`, `activeTabId`, `activeTab`
- `addProject`, `selectProject`, `toggleFolder`, `openFile`, `closeTab`, `selectTab`, `updateActiveTabContent`
- `localStorage` key `boop_projects_v1`

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- src/app/useProjectWorkspace.test.tsx --run
```

Expected: pass.

### Task 6: Project Panel UI

**Files:**
- Create: `src/app/ProjectPanel.tsx`
- Test: `src/app/ProjectPanel.test.tsx`

- [ ] **Step 1: Write failing component tests**

Cover:

- header label is `Project`
- `+` button is in the header and has `aria-label="Add Project"`
- rows render Project names and call `onSelectProject`

- [ ] **Step 2: Implement `ProjectPanel`**

Use props:

```ts
interface ProjectPanelProps {
  projects: ProjectEntry[];
  activeProjectId?: string;
  onAddProject: () => void;
  onSelectProject: (projectId: string) => void;
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test -- src/app/ProjectPanel.test.tsx --run
```

Expected: pass.

### Task 7: Files Tree UI

**Files:**
- Create: `src/app/useOverflowTitle.ts`
- Create: `src/app/FilesTree.tsx`
- Test: `src/app/FilesTree.test.tsx`

- [ ] **Step 1: Write failing component tests**

Cover:

- folder disclosure button is after the folder name in DOM order
- folder rows reserve disclosure space
- file row splits stem and extension
- file extension remains in a non-shrinking element
- visible names do not receive `title`
- explicitly truncated names receive `title` when the overflow hook detects overflow

- [ ] **Step 2: Implement `useOverflowTitle`**

Use a ref and layout effect:

```ts
export function useOverflowTitle<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);
  const [title, setTitle] = useState<string | undefined>(undefined);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      setTitle(undefined);
      return;
    }

    setTitle(element.scrollWidth > element.clientWidth ? text : undefined);
  }, [text]);

  return { ref, title };
}
```

- [ ] **Step 3: Implement `FilesTree`**

Use props:

```ts
interface FilesTreeProps {
  nodes: ProjectFileNode[];
  expandedPaths: Set<string>;
  activeFilePath?: string;
  onToggleFolder: (node: ProjectFileNode) => void;
  onOpenFile: (node: ProjectFileNode) => void;
}
```

Folder rows use CSS grid columns `icon`, `name`, `disclosure`.

File rows use `splitFileNameForDisplay`.

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- src/app/FilesTree.test.tsx --run
```

Expected: pass.

### Task 8: File Content Tabs UI

**Files:**
- Create: `src/app/FileContentTabs.tsx`
- Test: `src/app/FileContentTabs.test.tsx`

- [ ] **Step 1: Write failing tests**

Cover:

- renders one tab per open file
- no add-tab button is rendered
- close button calls `onCloseTab`
- empty state renders when no tabs exist

- [ ] **Step 2: Implement `FileContentTabs`**

Use props:

```ts
interface FileContentTabsProps {
  tabs: OpenFileTab[];
  activeTabId?: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test -- src/app/FileContentTabs.test.tsx --run
```

Expected: pass.

### Task 9: App Composition

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/app/AppShell.css`
- Test: update existing app shell/navigation tests as needed

- [ ] **Step 1: Write failing integration-style render tests**

Add or update tests to assert:

- Project panel is used instead of generic menu sections
- Files panel header is `Files`
- Content header renders file tabs and no `content-tab-add`
- `TabBar` is not present in the rendered Content body

- [ ] **Step 2: Replace app composition**

In `src/App.tsx`:

- Remove `WorkbenchMenu`, `WorkbenchList`, `ContentTabs`, and `TabBar` rendering from the main shell composition.
- Use `useProjectWorkspace({ client: projectFileClient })`.
- Pass `ProjectPanel` into `AppShell.menu`.
- Pass `FilesTree` into `AppShell.list`.
- Pass `FileContentTabs` into `AppShell.contentHeader`.
- Keep `SlateEditor` in `AppShell.content`.
- Use `projectWorkspace.activeTab` as the active editor content source.
- Move scripts, clipboard, sessions, and settings buttons into the top header.

- [ ] **Step 3: Keep editor behavior working**

When `activeTab` is undefined:

- Render a plain empty Content state instead of SlateEditor.
- Disable script execution that requires active text.

When `activeTab` exists:

- Create/cache Slate editors by file tab id.
- `onChange` updates in-memory tab content through `updateActiveTabContent`.

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm test -- src/app --run
```

Expected: app-level tests pass.

### Task 10: Styling And Visual Verification

**Files:**
- Modify: `src/app/AppShell.css`

- [ ] **Step 1: Add styles**

Add styles for:

- `.project-panel`
- `.project-panel__header-action`
- `.project-row`
- `.files-tree`
- `.files-tree__row`
- `.files-tree__row--folder`
- `.files-tree__disclosure`
- `.files-tree__file-stem`
- `.files-tree__file-ext`
- `.file-content-tabs`
- `.file-content-tabs__tab`
- `.file-content-tabs__close`
- `.content-empty-state`

- [ ] **Step 2: Verify hover disclosure behavior**

Use Playwright to inspect:

- folder disclosure opacity is `0` before hover
- folder disclosure opacity is `1` on hover
- disclosure remains the last visible control in the row

- [ ] **Step 3: Capture screenshots**

Save screenshots to `/tmp/boop2-project-files-content-panels/` for:

- empty Project state
- Project selected with root tree
- long folder and file names
- file tab open

### Task 11: Final Verification

**Files:**
- All touched files

- [ ] **Step 1: Format**

Run:

```bash
npx prettier --write src/app src/App.tsx
cargo fmt --manifest-path src-tauri/Cargo.toml
```

- [ ] **Step 2: Unit tests**

Run:

```bash
npm test -- src/app --run
cargo test --manifest-path src-tauri/Cargo.toml
```

- [ ] **Step 3: Build**

Run:

```bash
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

- [ ] **Step 4: Runtime smoke**

Run:

```bash
npm run tauri dev
```

Then verify:

- Project header `+` opens a folder picker.
- Selecting this repository creates a `Boop2` Project.
- Files panel shows root entries without `.git`, `node_modules`, `dist`, or `target`.
- Hovering a folder row reveals the disclosure icon.
- Opening a file creates a single Content tab.
- Reopening the same file activates that tab.
- No old `TabBar` group UI appears inside Content.

---

## Self-Review

Spec coverage:

- Project panel, header `+`, native folder picker, duplicate Project activation: Task 5, Task 6, Task 9.
- Files tree, lazy folders, exclusions, hover disclosure, truncation, conditional tooltips: Task 1, Task 7, Task 10.
- Content file tabs, no add-tab action, no legacy `TabBar`, no group UI: Task 8, Task 9.
- Read-only backend and no disk save: Task 1, Task 9, Task 11.
- Utility actions remain reachable from shell top header: Task 9.

Placeholder scan:

- No TODO, TBD, or unspecified implementation steps remain.

Type consistency:

- `ProjectEntry`, `ProjectFileNode`, `OpenFileTab`, and `ProjectFileClient` are defined in Task 4 and reused consistently in later tasks.
