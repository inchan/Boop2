# Boop to Tauri Migration Plan (Revised)

## 1. Executive Summary
This document outlines the strategy to port **Boop** (macOS/Swift) to **Boop-Tauri** (Cross-platform/Rust+React).
Based on the `CONVERSION_RESEARCH.md`, this plan prioritizes **strict functional parity** over new features and identifies specific risks regarding text encoding and native integrations.

## 2. Technology Stack & Rationale

| Component | Choice | Justification |
| :--- | :--- | :--- |
| **Framework** | **Tauri 2.0** | Essential for native menus, global shortcuts, and smaller bundle size than Electron. |
| **Language** | **Rust (Backend)** | Handles file I/O, window state, and potentially native macOS Service integration. |
| **Language** | **TypeScript (Frontend)** | Ensures type safety when interacting with the Script Execution Engine. |
| **Editor** | **CodeMirror 6** | Best-in-class text editor for the web. Handles large files and virtualized rendering better than standard `textarea`. |
| **State** | **Zustand + Persist** | Replaces `UserDefaults`. Simple, hook-based state management. |

## 3. Detailed Migration Phases

### Phase 1: Foundation & De-risking (The "Skeleton")
*   **Objective:** Get the app running with a custom title bar and basic editor.
*   **Tasks:**
    *   Init Tauri 2 project.
    *   **CRITICAL:** Implement `tauri-plugin-window-state` to replicate `saveFrame`/`setFrameUsingName` behavior found in `AppDelegate.swift`.
    *   Setup `CodeMirror` with basic configuration (line numbers, dark mode).

### Phase 2: The Script Engine (The "Core")
*   **Objective:** Execute existing `.js` scripts without modifying them.
*   **Tasks:**
    *   Implement `ScriptExecution` interface in TypeScript (See `FEATURE_MAP.md`).
    *   Create a "Shim" for `require()`. Map internal libs (`lodash`, `base64`) to pre-bundled ES modules.
    *   **Verification:** Create a unit test suite that feeds standard inputs (e.g., "Hello") into `ScriptEngine` and asserts outputs match Boop's native outputs.

### Phase 3: UI/UX Parity
*   **Objective:** Match the look and feel of the Swift app.
*   **Tasks:**
    *   **Command Palette:** Reimplement `PopoverViewController` logic using a React Modal + Fuse.js.
    *   **Status Bar:** Reimplement `StatusView` (Toast messages).
    *   **Theme Support:** Implement Light/Dark mode switching (matching `ThemeSettingsViewController`).

### Phase 4: Native Integrations (The "Last Mile")
*   **Objective:** Handle OS-specific features.
*   **Tasks:**
    *   **Services Menu:** Investigate `textServiceHandler` (macOS). *Risk: High complexity in Tauri. Consider deferring to v1.1.*
    *   **File Association:** Update `tauri.conf.json` to handle opening `.txt`, `.json` files.

## 4. Risk Mitigation Strategy

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Text Encoding** | Swift `String` vs JS `String`. Emojis might break range calculations. | Use CodeMirror's `from`/`to` (offset based) instead of Swift's `NSRange`. Test with Emoji/Korean inputs extensively. |
| **Performance** | Web View might lag on 10MB+ files. | Enable CodeMirror's virtualization. Avoid passing full text to Rust unless saving. |
| **Lost Features** | "Services" menu might not work. | Document clearly in README if feature is dropped. |

## 5. Verification Checklist
- [ ] Window position restores after restart.
- [ ] `Cmd+B` opens script picker.
- [ ] "Add Slashes" script works on text with Emoji.
- [ ] User custom scripts folder (bookmarks) is loaded correctly.