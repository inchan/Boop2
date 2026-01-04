# Data Model: 테마 지원 (Theme Support)

## Theme Configuration

Theme support is implemented entirely through CSS Custom Properties (CSS Variables). No TypeScript/JavaScript data structures required.

### CSS Custom Properties Schema

All theme variables are defined in `src/App.css` and consumed by components.

```css
:root {
  /* Light Theme (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e8e8e8;
  --text-primary: #1e1e1e;
  --text-secondary: #666666;
  --border-color: #d0d0d0;
  --editor-bg: #ffffff;
  --status-bar-bg: #e0e0e0;
  --status-bar-text: #555555;
  --scrollbar-thumb: #c0c0c0;
  --scrollbar-track: transparent;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark Theme */
    --bg-primary: #1e1e1e;
    --bg-secondary: #181818;
    --bg-tertiary: #2d2d2d;
    --text-primary: #abb2bf;
    --text-secondary: #6e7681;
    --border-color: #3d3d3d;
    --editor-bg: #1e1e1e;
    --status-bar-bg: #181818;
    --status-bar-text: #6e7681;
    --scrollbar-thumb: #424242;
    --scrollbar-track: transparent;
  }
}
```

### CSS Variables by Component

| Component                               | CSS Variables Used                                   |
| --------------------------------------- | ---------------------------------------------------- |
| App (root)                              | `--bg-primary`, `--text-primary`                     |
| SlateEditor                             | `--editor-bg`, `--text-primary`                      |
| TabBar                                  | `--bg-secondary`, `--text-primary`, `--border-color` |
| StatusBar                               | `--status-bar-bg`, `--status-bar-text`               |
| CommandPalette                          | `--bg-primary`, `--text-primary`, `--border-color`   |
| Popovers (Clipboard, Session, Settings) | `--bg-primary`, `--text-primary`, `--border-color`   |
| Scrollbars                              | `--scrollbar-thumb`, `--scrollbar-track`             |

### Theme Transition Animation

```css
/* Apply transition to all themed elements */
* {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

/* Disable animation for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none;
  }
}
```

### Initial Load (Flash Prevention)

For `index.html`, add inline styles to prevent white flash:

```html
<style>
  body {
    background-color: #1e1e1e; /* Default to dark, matches app default */
  }
  @media (prefers-color-scheme: light) {
    body {
      background-color: #ffffff;
    }
  }
</style>
```
