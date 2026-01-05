# Research: Command Palette Fixes

## Decision: Consolidate filtering logic and unify layout architecture

### Rationale

1. **Filtering logic consolidation**: Currently, `CommandPalette.tsx` manually manages multiple lists (`favs`, `recentScripts`, `sortedScripts`). By removing `FAVORITES` and consolidating into `RECENT` and `ALL SCRIPTS`, we can simplify the `useMemo` block that aggregates these lists.
2. **Layout space reservation**: To achieve the horizontal alignment of script names across different lists (where some have an "X" button and some don't), we will use a CSS Grid or Flexbox container for the `ScriptItem`. The "X" button slot will have a fixed width (e.g., `32px`) and will be rendered as an empty `div` or a hidden element when the button is not needed.
3. **RECENT section restoration**: The `RECENT` functionality is already present but possibly buggy or hidden by overlapping lists. We will verify the `localStorage` key `boop_recent_scripts` and ensure the `executeScript` callback correctly updates this list.

### Alternatives Considered

| Alternative                                          | Why Rejected                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Keep FAVORITES and RECENT                            | User explicitly requested removing FAVORITES to simplify the UI and focus on RECENT usage.                               |
| Conditional rendering of X without space reservation | This would cause the script names and icons to shift horizontally between sections, violating the alignment requirement. |
| Use separate components for each list type           | Overkill; a single `CommandItem` component with a `showRemove` prop is more maintainable.                                |

## Layout Design: Vertical Centering of X Button

The main close button (X) in the header will be centered using `display: flex; align-items: center;` on the header container.

## Layout Design: Horizontal Alignment

```css
.command-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-content {
  flex: 1;
  /* Icon and Name go here */
}

.item-actions {
  width: 32px; /* Fixed width for X button slot */
  display: flex;
  justify-content: center;
}
```

This ensures that even if `.item-actions` is empty, the `.item-content` takes up the same amount of space.
