# Custom Scripts

You can extend Boop's functionality by writing your own JavaScript scripts.

## Script Location
To add custom scripts, place your `.js` files in the following directory:

*   **macOS:** `~/Library/Application Support/com.chans.boop-tauri/scripts/`
    *(Note: You may need to create the `scripts` folder if it doesn't exist)*

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

## Troubleshooting
If your script doesn't appear:
1. Check if the JSON metadata is valid.
2. Ensure the file has a `.js` extension.
3. Check the debug logs in the app (Appears in the editor if loading fails).