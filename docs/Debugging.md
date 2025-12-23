# Debugging Scripts

Since Boop Tauri runs on a WebView, you can use standard web debugging tools.

## Using Console Logs
You can use `console.log()`, `console.warn()`, and `console.error()` in your scripts.
However, since scripts run in a **Web Worker**, these logs might not appear in the main window's console immediately or might be stripped in production builds.

The recommended way to debug logic is:
1.  Use `input.postInfo("Message")` to show a toast message.
2.  Use `input.postError("Error")` to show an error message.

## Developing Boop Tauri
If you are developing the app itself:
1.  Run `npm run tauri dev`.
2.  Right-click anywhere in the window and select **Inspect Element**.
3.  Go to the **Console** tab to see app logs.