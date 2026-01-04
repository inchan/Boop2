# Quickstart: 투명도 설정 (Opacity Setting)

## Overview

This feature adds an opacity slider to the settings UI, allowing users to adjust background transparency between 10% and 100%.

## Files to Modify

| File                                 | Changes                                                       |
| ------------------------------------ | ------------------------------------------------------------- |
| `src/hooks/useSettings.ts`           | Add `opacity` field to Settings interface                     |
| `src/App.css`                        | Add `--opacity` CSS variable and apply to background elements |
| `src/components/SettingsPopover.tsx` | Add opacity slider UI component                               |
| `src/components/SettingsPopover.css` | Add slider styling                                            |

## Implementation Steps

### Step 1: Update Settings Interface

In `src/hooks/useSettings.ts`:

```typescript
// Add opacity to Settings interface
interface Settings {
  // ... existing fields
  opacity: number; // 10-100, default 100
}

const DEFAULT_SETTINGS: Settings = {
  // ... existing defaults
  opacity: 100,
};
```

### Step 2: Add CSS Variable

In `src/App.css`:

```css
:root {
  /* ... existing variables ... */
  --opacity: 1;
}

/* Apply opacity to background elements */
.slate-editor-container,
.tab-bar-container,
.status-bar {
  opacity: var(--opacity);
}
```

### Step 3: Add Opacity Slider UI

In `src/components/SettingsPopover.tsx`:

```tsx
// Add inside the settings content
<div className="settings-section">
  <h4>Appearance</h4>
  <div className="settings-item">
    <span>Opacity: {settings.opacity}%</span>
    <input
      type="range"
      min="10"
      max="100"
      value={settings.opacity}
      onChange={(e) =>
        updateSettings({
          opacity: parseInt(e.target.value),
        })
      }
    />
  </div>
  <button onClick={() => updateSettings({ opacity: 100 })}>Reset to Default</button>
</div>
```

### Step 4: Add Slider Styling

In `src/components/SettingsPopover.css`:

```css
/* Add slider styles */
.settings-item input[type='range'] {
  width: 100px;
  margin-left: auto;
}
```

## Testing

1. **Opacity slider test**:
   - Open settings
   - Move slider to 50%
   - Verify background becomes semi-transparent
   - Verify text remains fully opaque

2. **Persistence test**:
   - Set opacity to 70%
   - Restart the app
   - Verify opacity setting is preserved

3. **Reset test**:
   - Set opacity to 30%
   - Click reset button
   - Verify opacity returns to 100%

4. **Theme interaction test**:
   - Set opacity to 50%
   - Switch system theme (dark/light)
   - Verify opacity setting is preserved

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
- Uses existing settings storage mechanism (localStorage)
- CSS opacity is performant and causes no layout recalculation
- Text remains readable at minimum 10% opacity
