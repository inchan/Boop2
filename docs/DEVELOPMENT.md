# Boop2 Development & Architecture

This document outlines the technical structure of Boop2 and how to contribute.

## 🏗 System Architecture

Boop2 follows a decoupled architecture between the UI, the Script Engine, and the Backend.

### 1. Frontend (React + TypeScript)
- **Editor:** Uses **CodeMirror 6**. Features include line wrapping and custom Boop theme.
- **State:** Managed via React hooks. Content is synchronized with current tabs.
- **Execution:** Scripts run in a **Web Worker** to prevent UI freezing.

### 2. Script Engine (Web Worker)
- **Shim Layer:** `RequireShim.ts` provides compatibility for scripts requiring `lodash`, `js-yaml`, `papaparse`, `he`, `jshashes`, and `vkbeautify`.
- **Async Flow:** Execution is handled via promises with a 5-second safety timeout.

### 3. Backend (Tauri / Rust)
- **Script Loader:** Scans `src-tauri/scripts/` and parses metadata from JS comments.
- **Capabilities:** Defined in `src-tauri/capabilities/default.json` with explicit command permissions.

## 🛠 Project Structure
- `src/` : React components, hooks, and UI logic.
- `src/lib/` : Core logic (Worker, Runner, Shims).
- `src-tauri/src/` : Rust backend entry point and command handlers.
- `src-tauri/scripts/` : Original JavaScript scripts.
- `docs/` : All user and developer documentation.

## 🚀 Build & Run
```bash
# Development
npm run tauri dev

# Production Build & Install to /Applications
npm run build:install
```

## 🧪 Testing
```bash
# Unit & Integration tests
npm run test
```
- `src/lib/ScriptExecution.test.ts`: Tests the API provided to scripts.
- `src/lib/Integration.test.ts`: Runs real `.js` script files to verify library shim compatibility.