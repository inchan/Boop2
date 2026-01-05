# Boop2 Development & Architecture

This document outlines the technical structure of Boop2 and how to contribute.

## 🏗 System Architecture

Boop2 follows a decoupled architecture between the UI, the Script Engine, and the Backend.

### 1. Frontend (React + TypeScript)

- **Editor:** Uses **Slate**. Features include line wrapping and custom Boop theme.
- **State:** Managed via React hooks. Content is synchronized with current tabs.
- **Execution:** Scripts run in a **Web Worker** to prevent UI freezing.

### 2. Script Engine (Web Worker)

- **Shim Layer:** `RequireShim.ts` provides compatibility for scripts requiring `lodash`, `js-yaml`, `papaparse`, `he`, `jshashes`, and `vkbeautify`. Supports Unicode Base64.
- **Stability:** Injects common variables (`buf`, `i`, `result`, etc.) to support legacy Boop scripts without modification.
- **Async Flow:** Execution is handled via promises with a 5-second safety timeout.

### 3. Backend (Tauri / Rust)

- **Script Loader:** Scans `src-tauri/scripts/` and parses metadata from JS comments.
- **Capabilities:** Permissions for custom commands are explicitly defined in `src-tauri/permissions/` and `src-tauri/capabilities/`.
- **Theme Detection (macOS):** Detects system dark/light mode via `NSUserDefaults` and sets native window background color before webview loads to prevent white flash on startup.

## 💾 State Persistence

Boop2 uses `localStorage` for all user-specific data. This ensures a "local-first" experience without a backend database.

### Storage Keys

- `boop_settings_v1`: User preferences (auto-restore, clipboard history, etc.).
- `boop_sessions_stack_v3`: An array of the last 50 `Session` objects.
- `boop_current_session_tmp_v3`: The current tab state, synced on every change for crash recovery.

### Data Structures

```typescript
interface Tab {
  id: string;
  title: string;
  content: string;
}

interface Session {
  id: string;
  timestamp: number;
  tabs: Tab[];
}
```

## 🛠 Expanding the Application

### Adding New JavaScript Libraries

To add a new library available to custom scripts:

1. Install via npm: `npm install <lib-name>`.
2. Map it in `src/lib/RequireShim.ts` within the `modules` object.
3. Add the library's typical Boop filename (e.g., `./lib/mylib.js`) as a key for backward compatibility.

### Adding New Rust Commands

1. Define the command in `src-tauri/src/lib.rs` using `#[tauri::command]`.
2. Register it in the `generate_handler!` macro in `run()`.
3. Call it from React using `@tauri-apps/api/core`'s `invoke` function.

## 🎨 Design System

Boop2 follows a minimalist "Boop Dark" aesthetic.

- **Typography:**
  - Primary: `SF Mono`, `Menlo`, `Monaco`, `monospace`.
  - UI: `SF Pro`, `Inter`, `System UI`.
- **Theme:**
  - Background: `#1e1e1e` (Editor), `#111111` (Status Bar/Tabs).
  - Selection: Active line highlight is subtle to prioritize readability.

## 🧪 Testing

We use **Vitest** for comprehensive script auditing and frontend logic verification.

```bash
# Run all tests
npm run test
```

- `src/lib/ScriptExecution.test.ts`: Tests the API provided to scripts.
- `src/lib/Integration.test.ts`: Verifies individual script logic.
- `src/lib/BulkScript.test.ts`: Audits all 72 built-in scripts for runtime and strict-mode compatibility.

### 🎭 End-to-End (E2E) Testing

We use **Playwright** for high-level user interaction and IME compatibility verification.

```bash
# Run all E2E tests
npm run test:e2e
```

- `e2e/editor-basic.spec.ts`: Core input and selection logic.
- `e2e/editor-korean-ime.spec.ts`: Verification of Korean character composition.
- `e2e/editor-linebreak.spec.ts`: Line break handling and multiline behavior.
- `e2e/editor-tabs.spec.ts`: Multi-tab synchronization and management.

## ⚙️ CI/CD Pipeline

Boop2 utilizes GitHub Actions for automated quality assurance and distribution.

### 1. Continuous Integration (`ci.yml`)

Triggered on every push and PR to `main` and `dev` branches.

- **Frontend Check:** Runs `npm audit`, `tsc`, `lint`, `format:check`, and `test`.
- **Backend Check:** Runs `cargo fmt` and `cargo clippy` with strict warning levels.
- **Build Verification:** Verifies that the app builds correctly on **Ubuntu**, **macOS**, and **Windows**.

### 2. Automated Release (`release.yml`)

Triggered when a version tag (e.g., `v*.*.*`) is pushed.

- Builds production binaries for multiple platforms.
- Automatically handles macOS Universal binaries (x86_64 + ARM).
- Generates a GitHub Release and uploads all artifacts (.dmg, .AppImage, .deb, .msi).

## 🪲 Debugging the App

If you are developing the application itself:

1. Run `npm run tauri dev`.
2. Right-click anywhere in the window and select **Inspect Element**.
3. Use the **Console** tab to view application logs and errors.
4. For Rust backend logs, check your terminal output.
