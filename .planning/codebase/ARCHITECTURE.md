# Architecture

**Analysis Date:** 2025-01-12

## Pattern Overview

**Overall:** Tauri-based Hybrid Desktop Application (Frontend-heavy + Minimal Backend)

**Key Characteristics:**
- React SPA frontend with Slate.js rich text editor
- Rust/Tauri backend for native functionality (file I/O only)
- Web Workers for sandboxed script execution
- No external server dependencies (fully offline-capable)

## Layers

**Presentation Layer (UI Components):**
- Purpose: User interface rendering and interaction
- Contains: React components (`.tsx` + `.css`)
- Location: `src/components/*.tsx`
- Depends on: State layer (hooks)
- Used by: App root component

**State Management Layer (React Hooks):**
- Purpose: Application state and business logic coordination
- Contains: Custom React hooks
- Location: `src/hooks/*.ts`
- Depends on: Business logic layer (lib)
- Used by: UI components

**Business Logic Layer (Lib):**
- Purpose: Core domain logic and utilities
- Contains: Script execution, domain models, utilities
- Location: `src/lib/*.ts`
- Depends on: Tauri IPC (for native features)
- Used by: State layer

**Native Layer (Tauri/Rust):**
- Purpose: File system access and native window management
- Contains: Script loader, window configuration
- Location: `src-tauri/src/*.rs`
- Depends on: Operating system APIs
- Used by: Frontend via Tauri IPC (`invoke()`)

## Data Flow

**App Initialization:**
1. `main.tsx` → ReactDOM.createRoot() → ErrorBoundary → App.tsx
2. App.tsx useEffect:
   - Load settings from localStorage
   - Load sessions from localStorage
   - `invoke('load_scripts')` → Rust backend scans script directories
   - Check for updates (optional)
3. useWorkspace initializes workspace state from localStorage

**Script Execution Flow:**
1. User → Cmd+B → CommandPalette opens
2. Script selection → `runScriptAsync()`
3. `ScriptRunner.runScriptAsync()` → `WorkerPool.execute()`
4. Worker receives message → RequireShim injection → script eval()
5. WorkerResponse (SUCCESS/ERROR/INFO) returned
6. SlateEditor state updated → debounced localStorage save

**Tab Switching Flow:**
1. User clicks tab or Cmd+1~9
2. `setActiveTabId(newId)`
3. useWorkspace state update
4. App.tsx: activeEditor useMemo recalculates
5. Editor instance retrieved from cache or created
6. SlateEditor re-renders with new editor prop

**State Management:**
- localStorage-based persistence (no database)
- Debounced saves to prevent I/O thrashing
- Each command execution is independent (stateless)

## Key Abstractions

**Domain Models (`src/lib/tabGroups.ts`):**
- Tab - Individual text document (id, title, content, groupId)
- TabGroup - Tab grouping (id, title, color, collapsed)
- WorkspaceSnapshot - Complete workspace state (version, tabs[], groups[], activeTabId)

**ScriptRunner (`src/lib/ScriptRunner.ts`):**
- Purpose: Entry point for script execution
- Pattern: Facade over WorkerPool

**WorkerPool (`src/lib/WorkerPool.ts`):**
- Purpose: Manage pool of Web Workers (2 workers, 5s timeout)
- Pattern: Object Pool for performance

**ScriptExecution (`src/lib/ScriptExecution.ts`):**
- Purpose: Adapter between Slate editor and script execution context
- Pattern: Adapter pattern

**RequireShim (`src/lib/RequireShim.ts`):**
- Purpose: Simulate Node.js `require()` in browser environment
- Pattern: Strategy pattern for library loading

## Entry Points

**Frontend Entry:**
- Location: `src/main.tsx`
- Triggers: Browser/WebView load
- Responsibilities: React app initialization, ErrorBoundary wrapping

**App Root:**
- Location: `src/App.tsx` (464 lines)
- Triggers: React render
- Responsibilities: UI orchestration, state coordination, keyboard shortcuts

**Backend Entry:**
- Location: `src-tauri/src/main.rs` (6 lines, delegates to lib.rs)
- Triggers: App launch
- Responsibilities: Window creation

**Backend Logic:**
- Location: `src-tauri/src/lib.rs` (253 lines)
- Triggers: IPC calls from frontend
- Responsibilities: `load_scripts` command, window styling (macOS)

## Error Handling

**Strategy:** Throw exceptions, catch at boundaries, display user-friendly messages

**Patterns:**
- ErrorBoundary component at app root (`src/components/ErrorBoundary.tsx`)
- try/catch in hooks and async operations
- Script execution errors displayed as notifications
- Console logging for debugging

## Cross-Cutting Concerns

**Logging:**
- console.log/error for development
- No external logging service

**Validation:**
- TypeScript strict mode for type safety
- Runtime validation in hooks for localStorage data

**State Persistence:**
- localStorage with versioned keys
- Debounced writes (performance optimization)

---

*Architecture analysis: 2025-01-12*
*Update when major patterns change*
