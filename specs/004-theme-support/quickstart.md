# Quickstart: 테마 지원 (Theme Support)

## Overview

This feature adds automatic dark/light theme support based on macOS system preferences.

## Files to Modify

| File          | Changes                                 |
| ------------- | --------------------------------------- |
| `index.html`  | Add inline theme background styles      |
| `src/App.css` | Define CSS custom properties for themes |
| `src/App.css` | Add theme transition animations         |

## Implementation Steps

### Step 1: Update index.html

Add inline styles to prevent white flash during initial load:

```html
<head>
  <style>
    body {
      background-color: #1e1e1e;
    }
    @media (prefers-color-scheme: light) {
      body {
        background-color: #ffffff;
      }
    }
  </style>
</head>
```

### Step 2: Define CSS Variables in App.css

Replace hardcoded colors with CSS custom properties:

1. Add `:root` block with light theme defaults
2. Add `@media (prefers-color-scheme: dark)` block with dark theme overrides
3. Replace all color values with CSS variable references

### Step 3: Add Theme Transitions

Add CSS transition rules for smooth theme switching:

```css
* {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none;
  }
}
```

## Testing

1. **Dark mode test**:
   - Set macOS to Dark Mode
   - Launch Boop2 - should show dark theme immediately
   - Change to Light Mode - should animate to light theme

2. **Flash test**:
   - Launch Boop2 multiple times
   - Verify no white flash on dark mode
   - Verify no dark flash on light mode

3. **Reduced motion test**:
   - Enable "Reduce Motion" in macOS Accessibility settings
   - Verify theme changes are instant (no animation)

## Verification Commands

```bash
# Build the app
npm run tauri build

# Run in development mode
npm run tauri dev

# Run E2E tests
npm run test:e2e
```

## Notes

- No new dependencies required
- All changes are pure CSS
- No API calls or data persistence involved
- Compatible with Tauri 2.0 + React 19
