# Boop (Tauri) Architecture (Revised)

## System Overview

```mermaid
graph TD
    User[User] -->|Input| Editor[CodeMirror (React)]
    User -->|Cmd+B| Palette[Command Palette]
    
    subgraph "Frontend (Web View)"
        Editor <-->|Text State| Store[Zustand Store]
        Palette -->|Selects| ScriptEngine
        ScriptEngine -->|Runs| JS_Sandbox[Sandbox / Worker]
        JS_Sandbox -->|Modifies| Editor
        
        ThemeMgr[Theme Manager] -->|CSS Var| UI
    end
    
    subgraph "Backend (Rust)"
        FS_Cmd[File System Command] -->|Reads| ScriptsDir[Scripts Folder]
        WinState[Window State Plugin] -->|Saves| AppConfig[app-window-state.json]
        Menu[Native Menu] -->|Events| Frontend
    end
```

## Key Components

### 1. State Management (Zustand)
Replaces `UserDefaults` and `MainViewController` state.

```typescript
interface AppState {
    // Editor State
    content: string;
    
    // Preferences
    theme: 'light' | 'dark' | 'system';
    scriptsPath: string | null; // Custom scripts folder
    
    // Actions
    setTheme: (theme) => void;
    loadScripts: () => Promise<void>;
}
```

### 2. Script Engine (The "Shim" Layer)
We must mimic the `SavannaKit` + `JavaScriptCore` environment.

*   **`ScriptExecutionContext.ts`**:
    *   Implements the `input` object.
    *   **Crucial Change:** Instead of `NSRange` (Swift), we map `selection` to CodeMirror's `StateSelection`.
*   **`RequireShim.ts`**:
    *   Boop scripts use `require('./lib/lodash.boop.js')`.
    *   We cannot use Node.js `require` in the browser.
    *   **Solution:** We will bundle these specific library files into the app and serve them from a map:
        ```typescript
        const LIBS = {
            'lodash': LodashInstance,
            'base64': Base64Instance,
            // ...
        };
        ```

### 3. Backend (Rust)
*   **`main.rs`**: Initialize `tauri-plugin-window-state` (to replace `saveFrame`).
*   **`menu.rs`**: Recreate the `MainMenu.xib` structure (File, Edit, View, Scripts).
    *   *Note:* The "Services" menu (`NSServices`) is tricky. We might skip it for v1.0.

### 4. File System & Permissions
*   **Custom Scripts:**
    *   Swift: `URL.bookmarkData` (Security Scoped).
    *   Tauri: `tauri-plugin-fs` + `dialog.open`. We will store the *path string* in `localStorage`.
    *   *Constraint:* On macOS, sandboxed apps cannot access arbitrary folders without user interaction every time, unless configured carefully. We might need `tauri-plugin-persisted-scope` or just run non-sandboxed for the first release.

## Data Flow: Script Execution
1.  **Trigger:** User selects "Add Slashes".
2.  **Capture:** Frontend grabs `editor.state.doc.toString()` and `editor.state.selection`.
3.  **Construct:** Create `ScriptExecution` object.
4.  **Eval:**
    ```javascript
    // Inside ScriptEngine
    const main = new Function('input', 'require', scriptSource);
    main(executionObject, requireShim);
    ```
5.  **Apply:** `executionObject` tracks changes. On completion, dispatch `editor.dispatch({ changes: ... })`.