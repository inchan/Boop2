# Data Model: 투명도 설정 (Opacity Setting)

## Settings Interface Extension

The opacity setting extends the existing `Settings` interface in `src/hooks/useSettings.ts`:

```typescript
interface Settings {
  // Existing fields...
  enableSessionRestore: boolean;
  autoRestoreLastSession: boolean;
  openNewTabOnRestore: boolean;
  enableClipboardHistory: boolean;
  enableAutoUpdate: boolean;

  // New field for opacity
  opacity: number; // Range: 10-100, Default: 100
}
```

## Default Settings

```typescript
const DEFAULT_SETTINGS: Settings = {
  enableSessionRestore: true,
  autoRestoreLastSession: false,
  openNewTabOnRestore: false,
  enableClipboardHistory: true,
  enableAutoUpdate: true,
  opacity: 100, // Default to fully opaque
};
```

## CSS Custom Properties

Opacity is applied via CSS variables in `src/App.css`:

```css
:root {
  /* Existing theme variables... */
  --opacity: 1; /* Default: 100% */
}

/* Apply opacity to background elements */
.slate-editor-container {
  background-color: rgba(var(--editor-bg-rgb), var(--opacity));
}

/* Alternative: Use CSS opacity property directly */
.app-background {
  opacity: var(--opacity, 1);
}
```

### Elements Affected by Opacity

| Component        | CSS Selector                                                  | Notes                  |
| ---------------- | ------------------------------------------------------------- | ---------------------- |
| Editor container | `.slate-editor-container`                                     | Main text editing area |
| Tab bar          | `.tab-bar-container`                                          | Tab navigation         |
| Status bar       | `.status-bar`                                                 | Bottom status bar      |
| Popovers         | `.clipboard-popover`, `.session-popover`, `.settings-popover` | All popup menus        |

### Elements NOT Affected by Opacity

These elements remain fully opaque for readability:

- All text content (`.slate-editor`, tab titles, status text)
- All buttons and interactive elements
- Scrollbars
- Command palette items

## Validation Rules

- Minimum value: 10 (10%)
- Maximum value: 100 (100%)
- Default value: 100
- Type: Integer
