# Software Conversion & Migration: Research & Guidelines

This document outlines the standard procedures, common pitfalls, and specific strategies for rewriting an existing application (Legacy) to a new platform (Target), specifically tailored for the **Boop (Swift/macOS) to Tauri (Rust/React)** migration.

## 1. The General Migration Process

A successful rewrite is not a linear coding task but a rigorous engineering process.

### Phase 1: Audit & Discovery (The "Archeology" Phase)
Before writing a single line of new code, we must understand the old code.
*   **Feature Inventory:** List every visible feature and hidden behavior (shortcuts, drag-and-drop, state persistence).
*   **Logic Extraction:** Identify core algorithms that are decoupled from the UI.
*   **Dependency Mapping:** What 3rd party libraries are used? Do they have equivalents in the new stack?

### Phase 2: De-risking (The "Tracer Bullet" Phase)
Identify the technically hardest parts that might block the project later.
*   *For Boop:* The hardest part is the **JS Execution Environment** and **Text/Range Handling**. Swift's `String` and `NSRange` handle Unicode differently than JavaScript strings.

### Phase 3: The "Strangler Fig" or Component Mapping
Instead of rewriting the whole app at once, map individual components.
*   Build the skeleton (Tauri App).
*   Port one complete vertical slice (e.g., "Load one script -> Run it -> Update Text").

### Phase 4: Verification (Parity Testing)
*   **Input/Output Matching:** The output of the new app must match the old app bit-for-bit for identical inputs.
*   **Performance Benchmarking:** Is the Web View version slower than Native?

## 2. Common Pitfalls & Risks (Why Rewrites Fail)

### A. The "Second System Effect" (Scope Creep)
*   **Trap:** "Since we are rewriting it, let's also add X, Y, and Z features we always wanted."
*   **Result:** The project becomes too big and never finishes.
*   **Solution:** **Strict Parity First.** Do not add new features until the port is 1:1 complete.

### B. Chesterton's Fence (Unknown Logic)
*   **Trap:** Removing code that looks useless or "bad" without understanding *why* it was put there (often to fix an obscure bug).
*   **Example:** "Why does this script replace `\u0000`?"
*   **Solution:** Assume all weird code exists for a reason until proven otherwise. Check git blame/commit messages.

### C. Subtle Platform Differences (The "Uncanny Valley")
*   **Issue:** Text rendering, scrolling physics, and keyboard shortcuts feel "off" in web apps compared to native apps.
*   **Specific to Boop:**
    *   **Undo/Redo Stack:** Native apps handle this differently than browsers.
    *   **Smart Quotes/Dashes:** macOS does this automatically; Web TextAreas might not.
    *   **Large File Handling:** Native text views handle 10MB text files easily. DOM-based editors (like CodeMirror) need optimization (virtualization) to handle this.

## 3. Specific Investigation Areas for Boop (Swift -> Tauri)

Based on general research, we need to investigate these specific areas in the Boop codebase before finalizing the plan:

| Area | Challenge | Investigation Needed |
| :--- | :--- | :--- |
| **String Indices** | Swift uses opaque indices (`String.Index`), JS uses UTF-16 code units. `NSRange` logic in scripts might break if the JS engine handles emojis/multibyte chars differently. | Analyze `ScriptManager.swift` text replacement logic carefully. |
| **Sandboxing** | Boop uses `SecurityScopedResource` (Bookmarks) to access user folders. Tauri has a completely different permissions model (`fs` scope). | Check `ScriptManager.getBookmarkURL`. |
| **State Persistence** | Swift uses `UserDefaults`. | Need to map `Info.plist` defaults to a Tauri Store. |
| **Menu Bar Integration** | Boop has native macOS menu bar items that trigger internal logic. | Need to map `MainMenu.xib` functionality to Tauri System Tray or Menu. |

## 4. The "Golden Rule" of Porting
**"Make it work, make it right, make it fast."**
1.  **Work:** Input A -> Output A (even if the code is ugly).
2.  **Right:** Refactor to idiomatic React/Rust patterns.
3.  **Fast:** Optimize the Web Worker / Text Editor performance.
