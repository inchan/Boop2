# Boop (Tauri Edition)

Boop is a text manipulation tool for developers. This is a port of the original Swift-based Boop to **Tauri**, allowing it to run cross-platform (macOS, Windows, Linux) while maintaining the original's speed and native feel.

## Key Features
*   **Native Performance:** Powered by Rust and Tauri.
*   **Scriptable:** Write custom scripts in JavaScript.
*   **Compatibility:** Supports most existing Boop scripts out of the box.
*   **Theme:** Dark mode with syntax highlighting (CodeMirror 6).

## How to use
Paste text into the editor, press `Cmd+B` (or `Ctrl+B`), and search for a transformation script (e.g., "JSON Format", "Base64 Encode").

## Custom Scripts
You can add your own scripts! 
See [CustomScripts.md](CustomScripts.md) for details.

## Modules
Boop Tauri supports common libraries like `lodash`, `moment` (via shim), etc.
See [Modules.md](Modules.md) for the list of supported built-in modules.