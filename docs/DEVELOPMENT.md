# Development & Architecture

This document outlines the technical structure of Boop Tauri and how to contribute.

## 🏗 System Architecture

Boop Tauri follows a decoupled architecture between the UI, the Script Engine, and the Backend.

### 1. Frontend (React + TypeScript)
- **Editor:** Uses **CodeMirror 6** for high-performance text rendering and syntax highlighting.
- **State:** Managed via React hooks and local state.
- **Execution:** Scripts are sent to a **Web Worker** to ensure the UI thread remains responsive even during heavy computation.

### 2. Script Engine (Web Worker)
- **Sandbox:** Each script runs in a dedicated worker.
- **Compatibility Layer:**
    - `ScriptExecution.ts`: Replicates the original Boop `input` API.
    - `RequireShim.ts`: Intercepts `require()` calls and provides bundled versions of `lodash`, `js-yaml`, `papaparse`, etc.

### 3. Backend (Tauri / Rust)
- **Script Loader:** Scans the application's resource directory and user's custom script directory.
- **Metadata Parser:** Extracts JSON metadata from the top-level comments of `.js` files.

## 🛠 Project Structure
- `src/` : React components and styles.
- `src/lib/` : Core logic (Worker, Runner, Shims).
- `src-tauri/src/` : Rust backend logic (Commands, Menu).
- `src-tauri/scripts/` : Built-in JavaScript scripts.

## 🚀 Build & Run
See the root `README.md` for build instructions.

## 🧪 Testing
We use **Vitest** for unit and integration testing.
```bash
npm run test
```
- `src/lib/ScriptExecution.test.ts`: Tests the API provided to scripts.
- `src/lib/Integration.test.ts`: Runs real `.js` script files to verify end-to-end compatibility.
