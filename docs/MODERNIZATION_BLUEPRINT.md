# Boop2 Modernization Blueprint

**Created:** 2026-06-18  
**Purpose:** A living, self-directed modernization plan for moving Boop2 from the current editor-centric implementation toward a durable, pane-based product architecture.

## 1. Why We Are Changing

The target product must survive beyond the current short-term architecture by separating product areas, making layout state explicit, and adding repeatable planning, research, and verification loops before large implementation work begins.

Current friction points observed in the codebase:

- `App.tsx` owns too many concerns at once: workspace tabs, scripts, sessions, settings, clipboard, update checks, find state, and editor instance orchestration.
- UI structure is editor-first, while the future product is shell-first: top, middle panes, and bottom.
- State is scattered across local component state, custom hooks, Slate editor instances, and `localStorage` persistence.
- The project has unit and E2E tests, but lacks architecture-decision records, migration harnesses, visual layout baselines, and repeatable research artifacts.

## 2. Target Product Layout

```text
[ Top / Global Header                                      ]
[ Menu Pane ][ List Pane ][ Content Pane with addable tabs ]
[ Bottom / Status, logs, progress, diagnostics             ]
```

### Shared pane rules

- Menu, list, and content each have a local header region.
- Content owns a nested tab system; tabs are not a global application primitive by default.
- Top and bottom are shell-level regions, not children of the editor.
- Panes must be independently testable and should not import editor internals directly.

## 3. Brainstorming Results

### Product model candidates

1. **Command-workspace model**
   - Menu selects capability areas: scripts, history, settings, workspaces, snippets.
   - List shows the selected area collection.
   - Content tabs show documents, script previews, logs, settings pages, or compare views.

2. **Document-workbench model**
   - Menu selects workspace modes.
   - List selects documents or transformations.
   - Content tabs are primary document surfaces.
   - Better for editor-heavy use, but risks recreating the current editor-centric design.

3. **Inspector-workbench model**
   - Menu and list drive context.
   - Content is composable: editor, result, preview, diff, metadata, documentation.
   - Bottom handles command output, errors, task progress, and debug traces.

**Recommended direction:** Inspector-workbench. It preserves Boop2's text transformation strength while opening room for scripts, sessions, diagnostics, and future plugin-style capabilities.

## 4. Architecture Principles

- **Shell first:** Layout and navigation should live in an app shell layer.
- **Feature slices:** Scripts, editor, sessions, clipboard, settings, find, and updater should have clear boundaries.
- **Explicit state contracts:** UI state, persisted state, and backend state need separate types and migration paths.
- **No hidden global editor coupling:** Editor APIs should be exposed through feature contracts, not refs passed through the root.
- **Incremental migration:** Build the new shell behind a feature flag or isolated route-like composition before replacing the current root.
- **Test harness before rewrite:** Add characterization and layout tests before major refactors.

## 5. Proposed Directory Shape

```text
src/
├── app/
│   ├── AppShell.tsx
│   ├── AppShell.css
│   ├── layoutTypes.ts
│   └── shellStore.ts
├── features/
│   ├── editor/
│   ├── scripts/
│   ├── sessions/
│   ├── clipboard/
│   ├── find/
│   ├── settings/
│   └── updater/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── storage/
│   └── testing/
└── legacy/
    └── LegacyApp.tsx
```

This is a migration target, not a single-shot move. The first implementation step should create only the shell primitives and keep existing behavior intact.

## 6. State Design Proposal

### State layers

| Layer           | Owner             | Examples                                                              | Persistence                                              |
| --------------- | ----------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| Shell UI state  | `app/shellStore`  | selected menu item, selected list item, pane sizes, bottom visibility | localStorage with versioned schema                       |
| Workspace state | workspace feature | documents, content tabs, active content tab                           | existing session migration first, then versioned storage |
| Editor runtime  | editor feature    | Slate editor instances, composition state, selection                  | runtime only                                             |
| Backend state   | Tauri/Rust        | script directories, filesystem-backed user scripts, update data       | OS/app data directories                                  |

### React state notes from research

- For app-level external stores, React's official `useSyncExternalStore` API is designed for subscribing to an external store from React components.
- For expensive non-urgent UI updates, React transitions can be considered, but editor typing must remain urgent and responsive.

## 7. Tauri Boundary Proposal

- Keep script execution non-blocking and worker-based in the frontend for current JavaScript scripts.
- Use Tauri commands for request/response backend actions such as loading scripts or reading app metadata.
- Use Tauri events/channels only for dynamic backend-to-frontend flows such as long-running indexing, file watching, or updater progress.
- Avoid moving UI orchestration into Rust; Rust should own OS integration, filesystem, secure persistence, and native app lifecycle concerns.

## 8. Harnesses We Need Before Major Refactor

### Characterization harness

Capture current behavior so modernization does not silently regress it:

- open app with restored session
- add/close/rename/duplicate tabs
- run a script on selected/full text
- find, replace current, replace all
- clipboard history toggle and insertion
- settings persistence

### Layout harness

Add Playwright checks for the shell shape:

- top region exists
- menu/list/content pane headers exist
- content tabs can be added
- bottom region can show status/log/progress
- keyboard focus remains predictable after pane and tab changes

### Visual harness

Use Playwright screenshot comparisons for stable shell states once the shell is introduced. This should start with narrow baselines only: empty shell, one document tab, command palette open, find panel open.

### Migration harness

Create fixture-driven tests for localStorage schemas:

- current workspace/session schemas load without data loss
- corrupted storage falls back safely
- future schema version bump preserves active tab and document content

## 9. Research Backlog

Research should produce short notes in `docs/research/` with date, source links, decision impact, and open questions.

1. React external store patterns for pane and workspace state.
2. React rendering performance for Slate-heavy editor surfaces.
3. Tauri 2 command/event/channel boundary design.
4. Playwright visual regression setup and baseline management.
5. Desktop app layout accessibility: keyboard navigation, ARIA landmarks, focus restoration.
6. Plugin-capable feature architecture for user scripts and future extensions.

## 10. Execution Roadmap

### Phase 0: Project operating system

- Create this blueprint.
- Add an Architecture Decision Record template.
- Add a research note template.
- Add a modernization task checklist.

### Phase 1: Discovery and characterization

- Map current app responsibilities.
- Add behavior characterization tests before changing UI architecture.
- Document storage schemas and migration risks.

### Phase 2: Shell prototype without behavior replacement

- Build `AppShell` with top/menu/list/content/bottom slots.
- Render current editor flow inside the content pane as a legacy surface.
- Add shell layout tests and minimal visual baselines.

### Phase 3: Feature extraction

- Move editor-specific contracts into `features/editor`.
- Move script catalog and execution UI into `features/scripts`.
- Move settings, sessions, clipboard, find, and updater into feature slices.

### Phase 4: Content tab system

- Introduce content tabs as typed surfaces: `document`, `script`, `settings`, `diff`, `log`.
- Migrate existing document tabs into the content tab model.
- Preserve old session data through migration tests.

### Phase 5: Hardening

- Performance budget for editor typing, script execution, and session restore.
- Accessibility pass for shell navigation.
- CI enforcement for unit, E2E smoke, storage migration, and format checks.

## 11. Immediate Next Actions

1. Add ADR and research templates.
2. Create a current-state responsibility map from `App.tsx`, `useWorkspace`, `SlateEditor`, and script execution modules.
3. Add one characterization test for the current tab lifecycle.
4. Create an `AppShell` spike behind a non-default flag after tests exist.

## 12. Initial References

- React `useSyncExternalStore`: https://react.dev/reference/react/useSyncExternalStore
- React `startTransition`: https://react.dev/reference/react/startTransition
- Tauri 2 calling Rust from frontend: https://v2.tauri.app/develop/calling-rust/
- Tauri 2 state management: https://v2.tauri.app/develop/state-management/
- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
