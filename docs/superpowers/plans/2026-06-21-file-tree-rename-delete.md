# File Tree Rename & Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add right-click context menu actions (Rename via inline editing, Delete via OS trash) to file/folder rows in the project file tree.

**Architecture:** A Rust backend gains two Tauri commands (`rename_project_entry`, `delete_project_entry`). The frontend client and `useProjectWorkspace` hook expose `renameEntry`/`deleteEntry`. `FilesTree` raises a context-menu event and renders an inline `<input>` for the row being renamed; `App.tsx` owns the menu (extending the existing `ContextMenu`) and the `renamingPath` state, and confirms deletes with the native dialog.

**Tech Stack:** Rust 1.75 + Tauri 2.0, `trash` crate, TypeScript 5.8, React 19.1, Vitest, `@tauri-apps/plugin-dialog`.

## Global Constraints

- Menu items added are exactly two: **이름 변경** (Rename), **삭제** (Delete). No others.
- Left-click behavior (open file / toggle folder) and drag-to-move stay unchanged.
- Delete moves to the OS trash (recoverable), never permanent deletion.
- Follow existing backend command style (`Result<_, String>`, `project_file_node` helper) and existing frontend error pattern (try/catch → `setStatus`).
- Backend error strings reused verbatim by tests: `"Destination already exists"`, `"Invalid name"`, `"Project entry does not exist"`.

---

### Task 1: Backend `rename_project_entry` command

**Files:**
- Modify: `src-tauri/src/lib.rs` (add command after `move_project_entry` ~line 241; register in `invoke_handler` ~line 459; add tests in `mod tests`)

**Interfaces:**
- Consumes: existing helpers `project_file_node(&Path) -> Result<ProjectFileNode, String>`, `PathBuf`, `fs`.
- Produces: `rename_project_entry(source_path: String, new_name: String) -> Result<ProjectFileNode, String>`

- [ ] **Step 1: Write the failing tests**

Add to `mod tests` in `src-tauri/src/lib.rs`:

```rust
    #[test]
    fn rename_project_entry_renames_file() {
        let project_dir = temporary_project_dir("rename-file");
        let source_file = project_dir.join("note.md");
        fs::write(&source_file, "hello").expect("source file should be created");

        let renamed = rename_project_entry(
            source_file.to_string_lossy().to_string(),
            "renamed.md".to_string(),
        )
        .expect("file should rename");

        assert_eq!(renamed.name, "renamed.md");
        assert_eq!(renamed.kind, "file");
        assert!(!source_file.exists());
        assert!(project_dir.join("renamed.md").exists());

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn rename_project_entry_rejects_existing_destination() {
        let project_dir = temporary_project_dir("rename-existing");
        let source_file = project_dir.join("note.md");
        fs::write(&source_file, "hello").expect("source file should be created");
        fs::write(project_dir.join("taken.md"), "existing")
            .expect("existing file should be created");

        let result = rename_project_entry(
            source_file.to_string_lossy().to_string(),
            "taken.md".to_string(),
        );

        assert_eq!(
            result.expect_err("rename should reject existing destination"),
            "Destination already exists"
        );
        assert!(source_file.exists());

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn rename_project_entry_rejects_invalid_name() {
        let project_dir = temporary_project_dir("rename-invalid");
        let source_file = project_dir.join("note.md");
        fs::write(&source_file, "hello").expect("source file should be created");

        for bad in ["", "   ", "a/b.md", "..", "."] {
            let result = rename_project_entry(
                source_file.to_string_lossy().to_string(),
                bad.to_string(),
            );
            assert_eq!(
                result.expect_err("rename should reject invalid name"),
                "Invalid name"
            );
        }
        assert!(source_file.exists());

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd src-tauri && cargo test rename_project_entry`
Expected: FAIL — `cannot find function rename_project_entry`.

- [ ] **Step 3: Implement the command**

Insert after `move_project_entry` (after line ~241, before `load_scripts`):

```rust
fn is_valid_entry_name(name: &str) -> bool {
    let trimmed = name.trim();
    !trimmed.is_empty()
        && trimmed != "."
        && trimmed != ".."
        && !trimmed.contains('/')
        && !trimmed.contains('\\')
}

#[tauri::command]
fn rename_project_entry(
    source_path: String,
    new_name: String,
) -> Result<ProjectFileNode, String> {
    let source = PathBuf::from(source_path);
    if !source.exists() {
        return Err("Project entry source does not exist".to_string());
    }

    if !is_valid_entry_name(&new_name) {
        return Err("Invalid name".to_string());
    }

    let parent = source
        .parent()
        .ok_or_else(|| "Project entry source has no parent".to_string())?;
    let destination = parent.join(new_name.trim());

    if destination.exists() {
        let source_canonical = fs::canonicalize(&source).map_err(|error| error.to_string())?;
        let destination_canonical =
            fs::canonicalize(&destination).map_err(|error| error.to_string())?;
        if source_canonical == destination_canonical {
            return project_file_node(&source);
        }

        return Err("Destination already exists".to_string());
    }

    fs::rename(&source, &destination).map_err(|error| error.to_string())?;
    project_file_node(&destination)
}
```

- [ ] **Step 4: Register the command**

Modify `invoke_handler` (line ~459) — add `rename_project_entry` to the list:

```rust
        .invoke_handler(tauri::generate_handler![
            load_scripts,
            list_project_directory,
            read_project_file,
            create_project_file,
            create_project_folder,
            move_project_entry,
            rename_project_entry
        ])
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd src-tauri && cargo test rename_project_entry`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: add rename_project_entry backend command"
```

---

### Task 2: Backend `delete_project_entry` command (trash)

**Files:**
- Modify: `src-tauri/Cargo.toml` (add `trash` dependency)
- Modify: `src-tauri/src/lib.rs` (add command; register; add test)

**Interfaces:**
- Produces: `delete_project_entry(path: String) -> Result<(), String>`

- [ ] **Step 1: Add the trash dependency**

Modify `src-tauri/Cargo.toml`, in `[dependencies]` (after `tauri-plugin-opener = "2"`):

```toml
trash = "5"
```

- [ ] **Step 2: Write the failing test**

Add to `mod tests` in `src-tauri/src/lib.rs`:

```rust
    #[test]
    fn delete_project_entry_rejects_missing_path() {
        let project_dir = temporary_project_dir("delete-missing");
        let missing = project_dir.join("nope.md");

        let result = delete_project_entry(missing.to_string_lossy().to_string());

        assert_eq!(
            result.expect_err("delete should reject missing path"),
            "Project entry does not exist"
        );

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }
```

(Note: the happy path moves a file to the real OS trash, so it is intentionally NOT tested to avoid polluting the developer's trash.)

- [ ] **Step 3: Run test to verify it fails**

Run: `cd src-tauri && cargo test delete_project_entry`
Expected: FAIL — `cannot find function delete_project_entry`.

- [ ] **Step 4: Implement the command**

Insert after `rename_project_entry` in `src-tauri/src/lib.rs`:

```rust
#[tauri::command]
fn delete_project_entry(path: String) -> Result<(), String> {
    let entry = PathBuf::from(&path);
    if !entry.exists() {
        return Err("Project entry does not exist".to_string());
    }

    trash::delete(&entry).map_err(|error| error.to_string())
}
```

- [ ] **Step 5: Register the command**

Modify `invoke_handler` — add `delete_project_entry`:

```rust
        .invoke_handler(tauri::generate_handler![
            load_scripts,
            list_project_directory,
            read_project_file,
            create_project_file,
            create_project_folder,
            move_project_entry,
            rename_project_entry,
            delete_project_entry
        ])
```

- [ ] **Step 6: Run test + build to verify**

Run: `cd src-tauri && cargo test delete_project_entry`
Expected: PASS (1 test). The `trash` crate compiles for the host platform.

- [ ] **Step 7: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/lib.rs
git commit -m "feat: add delete_project_entry backend command (move to trash)"
```

---

### Task 3: Client types & implementation

**Files:**
- Modify: `src/app/projectFileTypes.ts:24-31` (`ProjectFileClient` interface)
- Modify: `src/app/projectFileClient.ts:23-50` (`projectFileClient` object)

**Interfaces:**
- Consumes: `invoke` from `@tauri-apps/api/core`, `normalizeBackendProjectFileNode`, `BackendProjectFileNode`.
- Produces (on `ProjectFileClient`):
  - `renameProjectEntry(sourcePath: string, newName: string) => Promise<ProjectFileNode>`
  - `deleteProjectEntry(path: string) => Promise<void>`

- [ ] **Step 1: Extend the interface**

Modify `src/app/projectFileTypes.ts`, inside `ProjectFileClient` (after the `moveProjectEntry` line):

```ts
  renameProjectEntry: (sourcePath: string, newName: string) => Promise<ProjectFileNode>;
  deleteProjectEntry: (path: string) => Promise<void>;
```

- [ ] **Step 2: Implement on the client**

Modify `src/app/projectFileClient.ts`, add to the `projectFileClient` object after `moveProjectEntry` (before the closing `};`):

```ts
  async renameProjectEntry(sourcePath, newName) {
    const node = await invoke<BackendProjectFileNode>('rename_project_entry', {
      sourcePath,
      newName,
    });
    return normalizeBackendProjectFileNode(node);
  },
  async deleteProjectEntry(path) {
    await invoke('delete_project_entry', { path });
  },
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 4: Commit**

```bash
git add src/app/projectFileTypes.ts src/app/projectFileClient.ts
git commit -m "feat: add rename/delete to project file client"
```

---

### Task 4: `useProjectWorkspace` rename & delete

**Files:**
- Modify: `src/app/useProjectWorkspace.ts` (interface ~line 22-46; add callbacks; add to return ~line 416)
- Test: `src/app/useProjectWorkspace.test.tsx` (mock client ~line 12-38; new tests)

**Interfaces:**
- Consumes: `client.renameProjectEntry`, `client.deleteProjectEntry`, existing helpers `refreshCreationParent`, `refreshActiveProjectRoot`, `getMovedPath`, `isSameOrDescendantPath`, `normalizeProjectPath`, `getDefaultProjectName`.
- Produces (on `UseProjectWorkspaceResult`):
  - `renameEntry(node: ProjectFileNode, newName: string) => Promise<ProjectFileNode | undefined>`
  - `deleteEntry(node: ProjectFileNode) => Promise<void>`

- [ ] **Step 1: Add the two methods to the mock client in the test file**

Modify `src/app/useProjectWorkspace.test.tsx`, add to the `client` object (after `moveProjectEntry`, before closing `};` ~line 38):

```ts
  renameProjectEntry: vi.fn().mockResolvedValue({
    id: '/tmp/Boop2/Renamed.tsx',
    name: 'Renamed.tsx',
    path: '/tmp/Boop2/Renamed.tsx',
    kind: 'file',
    extension: 'tsx',
  }),
  deleteProjectEntry: vi.fn().mockResolvedValue(undefined),
```

- [ ] **Step 2: Write the failing tests**

Add these tests inside the top-level `describe` block in `src/app/useProjectWorkspace.test.tsx` (follow the existing test style — they drive `latestState` via the `Probe`). Place after the last existing test:

```ts
  it('renames an open file and updates its tab path', async () => {
    render(<Probe onState={captureState} />);
    await act(async () => {
      await latestState!.openFile('/tmp/Boop2/App.tsx', 'App.tsx');
    });

    await act(async () => {
      await latestState!.renameEntry(
        { id: '/tmp/Boop2/App.tsx', name: 'App.tsx', path: '/tmp/Boop2/App.tsx', kind: 'file' },
        'Renamed.tsx'
      );
    });

    expect(client.renameProjectEntry).toHaveBeenCalledWith('/tmp/Boop2/App.tsx', 'Renamed.tsx');
    expect(latestState!.openTabs.some((tab) => tab.path === '/tmp/Boop2/Renamed.tsx')).toBe(true);
    expect(latestState!.openTabs.some((tab) => tab.path === '/tmp/Boop2/App.tsx')).toBe(false);
  });

  it('deletes a file and closes its open tab', async () => {
    render(<Probe onState={captureState} />);
    await act(async () => {
      await latestState!.openFile('/tmp/Boop2/App.tsx', 'App.tsx');
    });
    expect(latestState!.openTabs).toHaveLength(1);

    await act(async () => {
      await latestState!.deleteEntry({
        id: '/tmp/Boop2/App.tsx',
        name: 'App.tsx',
        path: '/tmp/Boop2/App.tsx',
        kind: 'file',
      });
    });

    expect(client.deleteProjectEntry).toHaveBeenCalledWith('/tmp/Boop2/App.tsx');
    expect(latestState!.openTabs).toHaveLength(0);
  });
```

If a `captureState` helper does not already exist in the file, use the existing mechanism the other tests use to read `latestState` (search the file for how `latestState` is assigned and mirror it).

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/app/useProjectWorkspace.test.tsx -t "renames an open file"`
Expected: FAIL — `latestState.renameEntry is not a function`.

- [ ] **Step 4: Add `renameEntry` and `deleteEntry` to the hook**

Modify `src/app/useProjectWorkspace.ts`. First add to `UseProjectWorkspaceResult` (after `moveEntry`):

```ts
  renameEntry: (node: ProjectFileNode, newName: string) => Promise<ProjectFileNode | undefined>;
  deleteEntry: (node: ProjectFileNode) => Promise<void>;
```

Add a helper near the other path helpers (after `getMovedPath`, ~line 118):

```ts
function getParentPath(path: string): string {
  const normalized = normalizeProjectPath(path);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash <= 0 ? normalized : normalized.slice(0, lastSlash);
}
```

Add the two callbacks after `moveEntry` (before `closeTab`, ~line 376):

```ts
  const renameEntry = useCallback(
    async (node: ProjectFileNode, newName: string) => {
      if (!activeProject) return undefined;

      const renamedNode = await client.renameProjectEntry(node.path, newName);
      await refreshCreationParent(getParentPath(node.path));

      setOpenTabs((currentTabs) =>
        currentTabs.map((tab) => {
          const nextPath = getMovedPath(tab.path, node.path, renamedNode.path);
          return nextPath === tab.path
            ? tab
            : {
                ...tab,
                id: nextPath,
                path: nextPath,
                title: getDefaultProjectName(nextPath),
              };
        })
      );
      setSelectedFilePath((currentPath) =>
        currentPath ? getMovedPath(currentPath, node.path, renamedNode.path) : currentPath
      );
      setSelectedFolderPath((currentPath) =>
        currentPath ? getMovedPath(currentPath, node.path, renamedNode.path) : currentPath
      );
      setActiveTabId((currentTabId) =>
        currentTabId ? getMovedPath(currentTabId, node.path, renamedNode.path) : currentTabId
      );

      return renamedNode;
    },
    [activeProject, client, refreshCreationParent]
  );

  const deleteEntry = useCallback(
    async (node: ProjectFileNode) => {
      if (!activeProject) return;

      await client.deleteProjectEntry(node.path);
      await refreshCreationParent(getParentPath(node.path));

      setOpenTabs((currentTabs) => {
        const remaining = currentTabs.filter(
          (tab) => !isSameOrDescendantPath(tab.path, node.path)
        );
        if (remaining.length !== currentTabs.length) {
          setActiveTabId((currentTabId) =>
            currentTabId && isSameOrDescendantPath(currentTabId, node.path)
              ? remaining[remaining.length - 1]?.id
              : currentTabId
          );
        }
        return remaining;
      });
      setSelectedFilePath((currentPath) =>
        currentPath && isSameOrDescendantPath(currentPath, node.path) ? undefined : currentPath
      );
      setSelectedFolderPath((currentPath) =>
        currentPath && isSameOrDescendantPath(currentPath, node.path) ? undefined : currentPath
      );
    },
    [activeProject, client, refreshCreationParent]
  );
```

Add both to the returned object (after `moveEntry,` ~line 433):

```ts
    renameEntry,
    deleteEntry,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/app/useProjectWorkspace.test.tsx`
Expected: PASS (all tests including the 2 new ones).

- [ ] **Step 6: Commit**

```bash
git add src/app/useProjectWorkspace.ts src/app/useProjectWorkspace.test.tsx
git commit -m "feat: add renameEntry and deleteEntry to useProjectWorkspace"
```

---

### Task 5: FilesTree context menu + inline rename

**Files:**
- Modify: `src/app/FilesTree.tsx` (props, `TreeRows`, row rendering)
- Modify: `src/app/FilesTree.css` (inline input style)
- Test: `src/app/FilesTree.test.tsx`

**Interfaces:**
- Consumes (new props on `FilesTreeProps`, all optional so existing callers/tests stay valid):
  - `renamingPath?: string`
  - `onOpenEntryMenu?: (node: ProjectFileNode, position: { x: number; y: number }) => void`
  - `onRenameSubmit?: (node: ProjectFileNode, newName: string) => void`
  - `onRenameCancel?: () => void`
- Produces: right-click on a row calls `onOpenEntryMenu`; when `renamingPath === node.path` the row renders an `<input>` that calls `onRenameSubmit`/`onRenameCancel`.

- [ ] **Step 1: Write the failing tests**

Add to `src/app/FilesTree.test.tsx` (inside the existing `describe`):

```ts
  it('calls onOpenEntryMenu on right-click with the node and position', () => {
    const onOpenEntryMenu = vi.fn();
    const view = renderFilesTree({ onOpenEntryMenu });

    const fileRow = view.querySelector(
      '[data-testid="files-tree-row-/tmp/Boop2/script-with-a-very-long-name.test.ts"]'
    ) as HTMLElement;
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    Object.assign(event, { clientX: 12, clientY: 34 });
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/FilesTree.test.tsx -t "onOpenEntryMenu"`
Expected: FAIL — `onOpenEntryMenu` never called (prop not wired).

- [ ] **Step 3: Add a `RenameInput` component to `FilesTree.tsx`**

Add near the top of `src/app/FilesTree.tsx` (after the `FileName` component, ~line 92):

```tsx
const RenameInput = ({
  node,
  onSubmit,
  onCancel,
}: {
  node: ProjectFileNode;
  onSubmit: (node: ProjectFileNode, newName: string) => void;
  onCancel: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const dotIndex = node.name.lastIndexOf('.');
    if (node.kind === 'file' && dotIndex > 0) {
      input.setSelectionRange(0, dotIndex);
    } else {
      input.select();
    }
  }, [node.kind, node.name]);

  return (
    <input
      ref={inputRef}
      className="files-tree__rename-input"
      data-testid="files-tree-rename-input"
      defaultValue={node.name}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onBlur={(event) => onSubmit(node, event.currentTarget.value)}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter') {
          event.preventDefault();
          onSubmit(node, event.currentTarget.value);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      }}
    />
  );
};
```

- [ ] **Step 4: Thread the new props through `FilesTreeProps`, `TreeRowsProps`, and `TreeRows`**

In `FilesTreeProps` (~line 17-25) add:

```tsx
  renamingPath?: string;
  onOpenEntryMenu?: (node: ProjectFileNode, position: { x: number; y: number }) => void;
  onRenameSubmit?: (node: ProjectFileNode, newName: string) => void;
  onRenameCancel?: () => void;
```

`TreeRowsProps extends FilesTreeProps` already, so no extra fields needed there. In the `TreeRows` destructured params (~line 148-160) add `renamingPath`, `onOpenEntryMenu`, `onRenameSubmit`, `onRenameCancel`. Pass all four down in the recursive `<TreeRows ... />` call (~line 195-207).

- [ ] **Step 5: Wire context menu + inline input into the folder and file rows**

For the **folder** row (`<div role="button" ... className="files-tree__row files-tree__row--folder...">`, ~line 170), add this handler attribute:

```tsx
              onContextMenu={(event) => {
                if (!onOpenEntryMenu) return;
                event.preventDefault();
                onOpenEntryMenu(node, { x: event.clientX, y: event.clientY });
              }}
```

and replace the `<FolderName name={node.name} />` child with:

```tsx
              {renamingPath === node.path && onRenameSubmit && onRenameCancel ? (
                <RenameInput node={node} onSubmit={onRenameSubmit} onCancel={onRenameCancel} />
              ) : (
                <FolderName name={node.name} />
              )}
```

For the **file** row (~line 213), add the same `onContextMenu` attribute, and replace `<FileName name={node.name} />` with:

```tsx
          {renamingPath === node.path && onRenameSubmit && onRenameCancel ? (
            <RenameInput node={node} onSubmit={onRenameSubmit} onCancel={onRenameCancel} />
          ) : (
            <FileName name={node.name} />
          )}
```

- [ ] **Step 6: Pass the new props from the `FilesTree` component body into `TreeRows`**

In the `FilesTree` component (~line 238), add `renamingPath`, `onOpenEntryMenu`, `onRenameSubmit`, `onRenameCancel` to its destructured props, and forward them in the `<TreeRows ... />` render (~line 376-388).

- [ ] **Step 7: Add the input style**

Append to `src/app/FilesTree.css`:

```css
.files-tree__rename-input {
  flex: 1 1 auto;
  min-width: 0;
  font: inherit;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--accent, #4a90d9);
  border-radius: 3px;
  padding: 0 4px;
  margin: 0;
  outline: none;
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/app/FilesTree.test.tsx`
Expected: PASS (all tests including the 3 new ones).

- [ ] **Step 9: Commit**

```bash
git add src/app/FilesTree.tsx src/app/FilesTree.css src/app/FilesTree.test.tsx
git commit -m "feat: add context-menu trigger and inline rename to FilesTree"
```

---

### Task 6: Wire the entry menu, rename state, and delete confirm in App.tsx

**Files:**
- Modify: `src/App.tsx` (`ShellContextMenu` type ~line 34; new state + handlers; `FilesTree` props ~line 562; `ContextMenu` render ~line 591)

**Interfaces:**
- Consumes: `projectWorkspace.renameEntry`, `projectWorkspace.deleteEntry`, `ask` from `@tauri-apps/plugin-dialog`, existing `MenuItem`, `ContextMenu`, `setContextMenu`, `setStatus`.
- Produces: end-to-end rename/delete UX.

- [ ] **Step 1: Extend the `ShellContextMenu` type**

Modify `src/App.tsx` (~line 34):

```ts
type ShellContextMenu =
  | { kind: 'project'; project: ProjectEntry; position: { x: number; y: number } }
  | { kind: 'entry'; node: ProjectFileNode; position: { x: number; y: number } };
```

- [ ] **Step 2: Import `ask`**

Add near the top of `src/App.tsx` (with other imports):

```ts
import { ask } from '@tauri-apps/plugin-dialog';
```

- [ ] **Step 3: Add `renamingPath` state**

Add beside the other `useState` calls (near `const [contextMenu, ...]`, ~line 94):

```ts
  const [renamingPath, setRenamingPath] = useState<string | undefined>(undefined);
```

- [ ] **Step 4: Add handlers**

Add after `handleMoveEntry` (~line 429):

```ts
  const handleOpenEntryMenu = useCallback(
    (node: ProjectFileNode, position: { x: number; y: number }) => {
      setContextMenu({ kind: 'entry', node, position });
    },
    []
  );

  const handleRenameSubmit = useCallback(
    async (node: ProjectFileNode, newName: string) => {
      setRenamingPath(undefined);
      const trimmed = newName.trim();
      if (!trimmed || trimmed === node.name) return;
      try {
        const renamed = await projectWorkspace.renameEntry(node, trimmed);
        if (renamed) {
          setStatus({ type: 'success', text: `Renamed to ${renamed.name}` });
        }
      } catch (error) {
        setStatus({ type: 'error', text: `Error renaming ${node.name}: ${error}` });
      }
    },
    [projectWorkspace]
  );

  const handleDeleteEntry = useCallback(
    async (node: ProjectFileNode) => {
      const confirmed = await ask(`"${node.name}"을(를) 휴지통으로 이동할까요?`, {
        title: '삭제 확인',
        kind: 'warning',
      });
      if (!confirmed) return;
      try {
        await projectWorkspace.deleteEntry(node);
        setStatus({ type: 'success', text: `Deleted ${node.name}` });
      } catch (error) {
        setStatus({ type: 'error', text: `Error deleting ${node.name}: ${error}` });
      }
    },
    [projectWorkspace]
  );

  const getEntryContextMenuItems = useCallback(
    (node: ProjectFileNode): MenuItem[] => [
      { label: '이름 변경', onClick: () => setRenamingPath(node.path) },
      { label: '삭제', onClick: () => void handleDeleteEntry(node) },
    ],
    [handleDeleteEntry]
  );
```

- [ ] **Step 5: Pass new props to `FilesTree`**

Modify the `<FilesTree ... />` render (~line 562) — add:

```tsx
          renamingPath={renamingPath}
          onOpenEntryMenu={handleOpenEntryMenu}
          onRenameSubmit={(node, newName) => void handleRenameSubmit(node, newName)}
          onRenameCancel={() => setRenamingPath(undefined)}
```

- [ ] **Step 6: Branch the `ContextMenu` items by kind**

Modify the `ContextMenu` render block (~line 591):

```tsx
          {contextMenu && (
            <ContextMenu
              items={
                contextMenu.kind === 'project'
                  ? getProjectContextMenuItems(contextMenu.project)
                  : getEntryContextMenuItems(contextMenu.node)
              }
              position={contextMenu.position}
              onClose={() => setContextMenu(null)}
            />
          )}
```

- [ ] **Step 7: Typecheck + full test + lint**

Run: `npx tsc --noEmit && npm run test:ci && npm run lint`
Expected: PASS (no type errors, all tests green, no lint errors).

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire file tree rename/delete context menu in App"
```

---

### Task 7: Manual verification & capability check

**Files:**
- Possibly modify: `src-tauri/capabilities/default.json` (if `dialog:allow-ask` permission is required)

- [ ] **Step 1: Confirm dialog capability**

Check `src-tauri/capabilities/default.json` for an existing dialog permission. If `ask`/`confirm` fails at runtime with a permission error, add `"dialog:allow-ask"` (and/or `"dialog:default"`) to the `permissions` array. Verify against the existing `open` usage which already works.

- [ ] **Step 2: Run the app and drive the feature**

Run: `npm run tauri dev`

Verify in the running app:
- Right-click a file row → menu shows 이름 변경 / 삭제.
- 이름 변경 → row becomes an input (stem selected for files) → type new name → Enter renames; Escape cancels; clicking away commits.
- Open the file first, then rename → its tab title/path updates.
- 삭제 → native confirm dialog → confirm → file disappears from tree and (if open) its tab closes; check it landed in the OS trash.
- Repeat for a folder row.
- Confirm left-click still opens files / toggles folders and drag-to-move still works.

- [ ] **Step 3: Commit any capability change**

```bash
git add src-tauri/capabilities/default.json
git commit -m "chore: allow dialog ask permission for delete confirm"
```

(Skip if no change was needed.)

---

## Self-Review

**Spec coverage:**
- Backend `rename_project_entry` → Task 1. `delete_project_entry` + trash dep → Task 2. ✅
- Client types/impl → Task 3. ✅
- `useProjectWorkspace` rename/delete (tab/selection updates, descendant tab closing) → Task 4. ✅
- `ShellContextMenu` extension, menu items (이름 변경/삭제), `onOpenEntryMenu`, inline edit state, FilesTree input → Tasks 5 & 6. ✅
- Native `ask` confirm for delete → Task 6. ✅
- Tests (Rust, useProjectWorkspace, FilesTree) → Tasks 1, 2, 4, 5. ✅
- Capability/permission risk for dialog → Task 7. ✅

**Placeholder scan:** No TBD/TODO; all steps contain concrete code/commands.

**Type consistency:** `renameEntry(node, newName)`, `deleteEntry(node)`, `renameProjectEntry(sourcePath, newName)`, `deleteProjectEntry(path)`, `onOpenEntryMenu(node, position)`, `onRenameSubmit(node, newName)`, `onRenameCancel()`, `renamingPath` used consistently across Tasks 3–6. Backend error strings (`"Invalid name"`, `"Destination already exists"`, `"Project entry does not exist"`) match between Task 1/2 implementation and tests.
