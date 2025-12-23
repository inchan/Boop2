# Boop2 Development & Architecture

This document outlines the technical structure of Boop2 and how to contribute.

## 🏗 System Architecture

Boop2 follows a decoupled architecture between the UI, the Script Engine, and the Backend.

### 1. Frontend (React + TypeScript)
- **Editor:** Uses **CodeMirror 6**. Features include line wrapping and custom Boop theme.
- **State:** Managed via React hooks. Content is synchronized with current tabs.
- **Execution:** Scripts run in a **Web Worker** to prevent UI freezing.

### 2. Script Engine (Web Worker)
- **Shim Layer:** `RequireShim.ts` provides compatibility for scripts requiring `lodash`, `js-yaml`, `papaparse`, `he`, `jshashes`, and `vkbeautify`. Supports Unicode Base64.
- **Stability:** Injects common variables (`buf`, `i`, `result`, etc.) to support legacy Boop scripts without modification.
- **Async Flow:** Execution is handled via promises with a 5-second safety timeout.

### 3. Backend (Tauri / Rust)
- **Script Loader:** Scans `src-tauri/scripts/` and parses metadata from JS comments.
- **Capabilities:** Permissions for custom commands are explicitly defined in `src-tauri/permissions/` and `src-tauri/capabilities/`.

## 🛠 Project Structure
- `src/` : React components, hooks, and UI logic.
- `src/lib/` : Core logic (Worker, Runner, Shims, Themes).
- `src-tauri/src/` : Rust backend entry point and command handlers.
- `src-tauri/scripts/` : Original JavaScript scripts.
- `src-tauri/permissions/` : Tauri 2.0 command permission definitions.
- `docs/` : All user and developer documentation.

## 🚀 Build & Run
```bash
# Development (with Hot Reload)
npm run tauri dev

# Production Build & Install to /Applications (MacOS)
./scripts/BIR.sh
```

## 🧪 Testing
We use **Vitest** for comprehensive script auditing.
```bash
# Run all tests
npm run test
```
- `src/lib/ScriptExecution.test.ts`: Tests the API provided to scripts.
- `src/lib/Integration.test.ts`: Verifies individual script logic.
- `src/lib/BulkScript.test.ts`: Audits all 70+ scripts for runtime and strict-mode compatibility.
