# Project / Files / Content Panels Design

Date: 2026-06-19

## Goal

Redesign the Boop2 shell around three explicit panels:

1. Project
2. Files
3. Content

The first implementation opens root folders as Projects, renders the selected Project as a folder/file tree, and opens selected files into one in-memory Content tab per file. Disk save is out of scope for this phase.

## Current Friction

The current shell has a generic menu/list/content model, but the product direction is now folder-backed:

- The first panel is not a generic menu. It represents root folders.
- The second panel is not a generic list. It represents the selected root folder as a tree.
- The third panel should own file tabs directly.
- The current Content area still renders the legacy `TabBar` with group behavior inside the body while also having `ContentTabs` in the header. This creates duplicate tab concepts.

## Panel Definitions

### Panel 1: Project

A Project is one selected root folder.

The Project panel contains:

- A local panel header labeled `Project`.
- A `+` action at the far right of the Project panel header.
- A list of saved Project entries.

The Project `+` action opens a native folder picker. When the user chooses a folder:

- If the root path is new, the app creates a Project entry and activates it.
- If the root path already exists, the app activates the existing Project entry instead of duplicating it.

Project display names:

- Default to the final path segment of the selected root folder.
- Example: `/Users/inchan/workspace/private/Boop2` displays as `Boop2`.
- Rename is not part of this phase, but the data model should not block adding rename later.

Project persistence:

- Store the recent Project list in `localStorage`.
- This is intentionally lightweight. A database or app-data file is not needed for this phase.

### Panel 2: Files

The Files panel shows the selected Project's root folder as a folder/file tree.

Loading behavior:

- Load only the root level when a Project is selected.
- Lazy-load folder children when a folder is expanded.
- Keep expanded/collapsed state in React state for this phase.

Exclusion behavior:

- Hide dot-prefixed entries by default.
- Exclude heavy generated folders by default: `.git`, `node_modules`, `dist`, `dist-ssr`, `target`, `coverage`, `playwright-report`, `test-results`.
- The first implementation does not need a user-facing toggle for hidden files.

Folder row behavior:

- Row structure is `folder icon`, `folder name`, `disclosure control`.
- The disclosure control sits at the far right of the row.
- The disclosure control is hidden by default.
- The disclosure control appears on row hover and on row focus-within.
- The disclosure slot remains reserved so row text does not shift when the control appears.
- Long folder names truncate with trailing ellipsis before the disclosure slot.
- Show a tooltip with the full folder name only when the visible folder name is truncated.
- Do not show a tooltip when the full folder name fits.

File row behavior:

- Row structure is `file icon`, `file name`.
- Long file names keep the final extension visible.
- The filename stem truncates with trailing ellipsis.
- The extension remains visible at the end.
- Examples:
  - `very-long-name.tsx` truncates the stem and keeps `.tsx`.
  - `script-with-long-name.test.ts` truncates the stem and keeps `.ts`.
- Show a tooltip with the full file name only when the visible file name is truncated.
- Do not show a tooltip when the full file name fits.

### Panel 3: Content

The Content panel owns file tabs.

Content behavior:

- Selecting a file in the Files panel opens a Content tab.
- One file path maps to one Content tab.
- Selecting the same file again activates the existing tab instead of opening a duplicate.
- Content tabs are created only by selecting files from the Files panel.
- The Content tab strip does not show a new-tab `+` action in this phase.
- Each Content tab has a close action.
- Closing the active tab selects a neighboring open tab.
- Closing the last tab shows an empty Content state.

Editing behavior:

- File contents load into the editor surface.
- The user can edit the opened file content in memory.
- Disk save is out of scope for this phase.
- Dirty indicators are out of scope for this phase because there is no save path yet.

Removed behavior:

- Remove the legacy `TabBar` from inside the Content body.
- Remove content group UI from the new shell surface.
- Remove group controls from the new file-backed Content tab strip.
- Preserve existing document/workspace internals only where needed to keep editor content working during migration.

## Backend Boundary

Native folder selection:

- Add Tauri dialog support for choosing a root folder.
- The frontend receives the selected root path and creates or activates a Project entry.

Filesystem reads:

- Add Rust commands for reading the file tree and reading file text.
- The commands are read-only in this phase.
- The commands should reject or skip directories that match the exclusion rules.
- The commands should return structured data, not UI-ready HTML.

Expected read command shape:

```ts
interface ProjectFileNode {
  id: string;
  name: string;
  path: string;
  kind: 'folder' | 'file';
  extension?: string;
  children?: ProjectFileNode[];
  childrenLoaded?: boolean;
}
```

Use these Rust command names:

- `list_project_directory`: list children for a directory path
- `read_project_file`: read file text for a file path

No write command is added in this phase.

## Frontend State Model

Introduce a focused project/file shell model instead of stretching the current generic workbench section model.

Recommended frontend concepts:

```ts
interface ProjectEntry {
  id: string;
  name: string;
  rootPath: string;
}

interface OpenFileTab {
  id: string;
  path: string;
  title: string;
  content: string;
}
```

State responsibilities:

- Project state owns saved Projects, active Project, and add/activate behavior.
- Files state owns expanded folders, loaded children, selected file path, and tree loading errors.
- Content tab state owns open file tabs, active tab, and in-memory edited content.

## Existing Feature Placement

Scripts, sessions, clipboard, and settings should not remain as first-panel Project entries.

For this phase:

- Keep existing keyboard shortcuts and popovers where possible.
- Move utility actions to the shell top header when their old `TabBar` button is removed.
- The top header should expose utility actions for scripts, clipboard, sessions, and settings.
- Do not redesign scripts, sessions, clipboard, or settings in this spec.

This keeps the first panel structurally pure: Project entries only.

## Accessibility

Project panel:

- The Project `+` button has the accessible name `Add Project`.
- Project rows are buttons with visible active state.

Files panel:

- Folder rows expose expand/collapse state to assistive technology.
- The disclosure control is visible on hover and focus-within.
- Tooltip behavior uses the native `title` attribute only when text is truncated.
- Keyboard navigation for the full tree can be incremental, but folder controls must remain reachable.

Content panel:

- Tabs use tab semantics.
- Close buttons have accessible names that include the file title.
- Empty state text is visible when there are no open file tabs.

## Non-Goals

This phase does not include:

- Disk save.
- Dirty indicators.
- Rename Project.
- Remove Project.
- Hidden-file toggle.
- Full keyboard tree navigation.
- File watching or automatic reload.
- Binary file preview.
- Script catalog redesign.
- Session migration redesign.

## Acceptance Criteria

The implementation is complete when:

- The first panel header says `Project`.
- The Project panel header has a `+` action at the far right.
- The Project list contains only Project entries.
- The Project `+` flow opens a native folder picker.
- Selecting a folder creates or activates a Project.
- The second panel header says `Files`.
- The Files panel shows folder/file tree rows for the active Project.
- Folder disclosure controls are hidden by default and appear on hover/focus-within.
- Long folder names truncate before the disclosure slot.
- Long file names keep the extension visible.
- Tooltips appear only for visually truncated folder/file names.
- Selecting a file opens a Content tab.
- Selecting the same file again activates the existing tab.
- The Content tab strip does not render a new-tab `+` action.
- Closing the last file tab shows an empty Content state.
- The legacy content body `TabBar` and content group UI are not rendered in the new shell.
- Scripts, clipboard, sessions, and settings remain reachable from shell-level utility actions.
- No disk save command or UI is added.

## Implementation Notes

- Prefer a small file tree row module instead of putting truncation and tooltip logic directly in `App.tsx`.
- Keep the first pass read-only so the panel architecture lands without file persistence complexity.
- Use tests to lock down data behavior before visual styling:
  - duplicate Project root activates existing Project
  - duplicate file open activates existing tab
  - folder rows reserve disclosure space
  - file row extension remains visible
  - tooltips are conditional on overflow
