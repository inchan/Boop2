# Custom Scripts

You can extend Boop's functionality by writing your own JavaScript scripts.

### Script Locations
Boop2 scans multiple directories for scripts:

1. **User Custom Scripts:**
   - **macOS:** `~/Library/Application Support/com.chans.boop2/scripts/`
   - **Linux:** `~/.config/com.chans.boop2/scripts/`
   - **Windows:** `%APPDATA%\com.chans.boop2\scripts\`
2. **Internal Bundled Scripts:** Bundled with the application package.
3. **Development Paths:** (During development) `scripts/` and `src-tauri/scripts/` in the project root.

*(Note: You may need to create the `scripts` folder in your User directory if it doesn't exist)*

## File Format
Each script must start with a metadata block in comments, followed by a `main` function.

```javascript
/**
    {
        "api": 1,
        "name": "My Custom Script",
        "description": "Does something cool",
        "author": "Your Name",
        "icon": "code",
        "tags": "cool,script,example"
    }
**/

function main(input) {
    // input.text       -> The current text (full or selection)
    // input.fullText   -> The complete document text
    // input.selection  -> The selected text
    
    // Modify text
    input.text = input.text.toUpperCase();
    
    // Or insert text
    // input.insert("Hello");
    
    // Show notification
    // input.postInfo("Done!");
}
```

## Supported Icons
Boop Tauri supports the same icon set as the original app (e.g., `quote`, `code`, `b64`, etc.).

## Scripting API Reference

The `main(input)` function receives an `input` object that serves as the interface between your script and the Boop2 editor.

### The `input` Object
- **`input.text` (Getter/Setter)**: 
  - If text is selected, returns the selection.
  - If no text is selected, returns the full document text.
  - Setting this property replaces the selection (if active) or the entire document.
- **`input.fullText` (Getter/Setter)**: Always returns or replaces the entire document text, regardless of selection.
- **`input.selection` (Getter/Setter)**: Always returns or replaces only the currently selected text.
- **`input.insert(string)`**: Inserts a string at the current cursor position or replaces the current selection.
- **`input.postInfo(string)`**: Displays a temporary toast notification in the status bar.
- **`input.postError(string)`**: Displays an error message alert.

### Global Shimmed Variables
To maintain compatibility with original Boop scripts that occasionally use undeclared variables for intermediate steps, the following variables are pre-injected into the script scope:
`buf`, `i`, `url`, `R`, `G`, `B`, `result`, `res`, `data`

## Debugging Scripts
Since Boop2 scripts run in a **Web Worker**, standard console logs might not always be visible in the main process.
- Use `input.postInfo("Message")` to show a quick toast message for debugging variables.
- Use `input.postError("Error")` to display error alerts.
- You can also use `console.log()` while running in development mode (`npm run tauri dev`) and inspecting the Web Worker console.

## Troubleshooting
If your script doesn't appear:
1. Check if the JSON metadata is valid.
2. Ensure the file has a `.js` extension.
3. Check the debug logs in the app (Appears in the editor if loading fails).