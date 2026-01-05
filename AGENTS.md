# BOOP2 PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-02  
**Commit:** 4199525  
**Branch:** 001-fix-editor-tab

## OVERVIEW

Scriptable text manipulation tool. Tauri 2.0 + React 19 + Slate editor + 73 bundled JS scripts.

## STRUCTURE

```
boop2/
├── src/                    # React frontend
│   ├── components/         # UI components (SlateEditor, TabBar, CommandPalette, ...)
│   ├── hooks/              # State hooks (useTabs, useSessions, useSettings)
│   └── lib/                # Core logic (WorkerPool, ScriptRunner, updater)
├── src-tauri/              # Rust backend
│   ├── src/                # lib.rs (script loading), main.rs
│   └── scripts/            # 73 bundled transformation scripts
├── e2e/                    # Playwright E2E tests
└── docs/                   # User guides
```

## WHERE TO LOOK

| Task              | Location                                  | Notes                                            |
| ----------------- | ----------------------------------------- | ------------------------------------------------ |
| Editor behavior   | `src/components/SlateEditor.tsx`          | IME, Tab indent, Copy handling                   |
| Script execution  | `src/lib/WorkerPool.ts`                   | Web Worker pool for non-blocking execution       |
| Add new script    | `src-tauri/scripts/`                      | Follow metadata format `/** { "name": ... } **/` |
| Tab/session state | `src/hooks/useTabs.ts`, `useSessions.ts`  | localStorage persistence                         |
| Backend commands  | `src-tauri/src/lib.rs`                    | Tauri IPC: `load_scripts`                        |
| E2E tests         | `e2e/*.spec.ts`                           | Playwright + `EditorHelper` utility              |
| CI/CD             | `.github/workflows/ci.yml`, `release.yml` | Multi-platform build                             |

## CODE MAP

| Symbol           | Location                          | Role                                    |
| ---------------- | --------------------------------- | --------------------------------------- |
| `App`            | src/App.tsx                       | Root component, global state            |
| `SlateEditor`    | src/components/SlateEditor.tsx    | Core editor (Slate.js)                  |
| `CommandPalette` | src/components/CommandPalette.tsx | Script search/execution UI              |
| `runScriptAsync` | src/lib/ScriptRunner.ts           | Worker dispatch                         |
| `WorkerPool`     | src/lib/WorkerPool.ts             | Concurrent script execution             |
| `load_scripts`   | src-tauri/src/lib.rs              | Rust: scan script directories           |
| `run` (setup)    | src-tauri/src/lib.rs              | macOS theme detection + window bg color |

## CONVENTIONS

### Editor: Slate (NOT CodeMirror)

- Custom `Descendant[]` for paragraphs
- Manual IME handling via `isComposingRef`
- Tab key → 4 spaces (INDENT constant)

### State Management

- React hooks only (no Redux/Zustand)
- localStorage keys: `boop_sessions_stack_v3`, `boop_current_session_tmp_v3`
- Debounced saves (300ms)

### Script Format

```javascript
/**
{
  "name": "Script Name",
  "description": "What it does",
  "icon": "emoji",
  "tags": "category"
}
**/
function main(input) {
  // input.text, input.fullText, input.postInfo(), input.postError()
  return input.text.toUpperCase();
}
```

### Testing

- **Unit**: Vitest (`npm test`) - `src/lib/*.test.ts`
- **E2E**: Playwright (`npm run test:e2e`) - `e2e/*.spec.ts`
- Use `EditorHelper` class for Slate interactions

## ANTI-PATTERNS (THIS PROJECT)

| Pattern                    | Reason                                                 |
| -------------------------- | ------------------------------------------------------ |
| `as any`, `@ts-ignore`     | Never suppress types                                   |
| Direct DOM manipulation    | Use Slate Transforms API                               |
| Sync setState in useEffect | Causes cascading renders (known issue, needs refactor) |
| Blocking main thread       | All scripts run in WorkerPool                          |

## KNOWN ISSUES (Pre-existing)

- ESLint: `React`, `HTMLDivElement`, `DOMException` not defined → global types config needed
- `setLineCount`/`setActiveLine` in useEffect → should use batched update

## COMMANDS

```bash
# Development
npm run dev              # Vite dev server only
npm run tauri dev        # Full Tauri development

# Quality
npm test                 # Vitest unit tests
npm run lint             # ESLint
npm run format:check     # Prettier check
npm run test:e2e         # Playwright E2E (headed: --headed)

# Build
npm run build            # Frontend build
npm run tauri build      # Full production build
npm run build:install    # Build + copy to /Applications (macOS)
```

## RELEASE

1. Bump version in `package.json` + `src-tauri/tauri.conf.json`
2. Commit: `chore: bump version to vX.Y.Z`
3. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
4. GitHub Actions builds + uploads artifacts

## NOTES

- Auto-updater enabled via `tauri-plugin-updater`
- User scripts: `~/Library/Application Support/com.chans.boop2/scripts/` (macOS)
- Session restore: latest 2 sessions shown in UI, up to 50 stored
- Clipboard history: last 20 items (toggleable in settings)
