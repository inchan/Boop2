# Boop Feature Map (Swift -> Tauri) (Revised)

## 1. Application Lifecycle & System

| Swift Component | Responsibility | Tauri Equivalent | Status |
| :--- | :--- | :--- | :--- |
| `AppDelegate.applicationWillTerminate` | Saves window frame (`saveFrame`). | `tauri-plugin-window-state` | **Planned** |
| `AppDelegate.textServiceHandler` | macOS Services Menu support. | *Native Ext Needed* | **Deferred (v1.1)** |
| `MainMenu.xib` | Native Menu Bar. | `src-tauri/src/menu.rs` | **Planned** |
| `Info.plist` | App Permissions & File Types. | `tauri.conf.json` | **Planned** |
| `Assets.xcassets` | App Icons. | `src-tauri/icons/` | **Planned** |

## 2. Editor & Main View

| Swift Component | Responsibility | Tauri Equivalent | Implementation Detail |
| :--- | :--- | :--- | :--- |
| `MainViewController.clear()` | Clear text. | `editor.dispatch({ changes: { form: 0, to: doc.length, insert: '' } })` | - |
| `MainViewController.openScripts()` | Opens website. | `open('https://...')` | Use Tauri `opener` API. |
| `BoopLexer.swift` | Syntax highlighting. | `codemirror/lang-*` | Use auto-detect or specific language packs. |
| `ThemeSettingsViewController` | Manage colors. | CSS Variables | `:root` vs `.dark-mode`. |

## 3. Script Execution Logic (The Core)

| Swift Logic | JS/TS Equivalent | Notes |
| :--- | :--- | :--- |
| `ScriptManager.loadScripts()` | `commands.load_scripts()` (Rust) | Reads file content + parses `/** JSON */`. |
| `Script.swift` (JSContext) | `Function()` constructor | We execute in the main thread (carefully) or Worker. |
| `ScriptExecution.fullText` | `editor.state.doc.toString()` | - |
| `ScriptExecution.selection` | `editor.state.sliceDoc(...)` | - |
| `ScriptExecution.insert()` | `editor.dispatch(...)` | Map carefully to CodeMirror Transaction. |
| `Script.run()` | `script.main(execution)` | Call the `main` function defined in the script string. |

## 4. Specific Script Dependencies
Boop scripts rely on these specific files in `Boop/Boop/scripts/lib/`. We must provide them.

| File | Library | Strategy |
| :--- | :--- | :--- |
| `lodash.boop.js` | Lodash (custom build?) | Import `lodash` from npm. |
| `base64.js` | Base64 | Use Browser `atob`/`btoa` or npm package if API differs. |
| `hashes.js` | MD5, SHA | Import `crypto-js` or use Web Crypto API. |
| `js-yaml.js` | YAML parser | Import `js-yaml` from npm. |
| `xml-js` (implied) | XML parser | Import `xml-js` or similar. |

**Action Item:** We cannot just "copy" the lib folder because the scripts utilize `require()`. We must implement a `require` shim that returns these npm packages when asked for the specific file paths.