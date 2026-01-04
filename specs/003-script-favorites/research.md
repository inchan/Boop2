# Research: Script Favorites System with Keyboard Shortcuts

**Date**: 2026-01-04  
**Feature**: 003-script-favorites

## Decision 1: Global Keyboard Shortcuts in Tauri/React

**Question**: How to globally capture Cmd+1-5 without conflicting with existing shortcuts?

### Findings

Looking at existing code in `src/App.tsx`:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      setIsPaletteOpen((prev) => !prev);
    }
    // ... other shortcuts
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [activeTabId, handleAddTab, handleCloseTab, tabs]);
```

### Decision

**Use `window.addEventListener('keydown')` at App level**

- Add Cmd+1-5 handlers in `App.tsx` (same pattern as existing shortcuts)
- Check if Command Palette is open before executing (prioritize Command Palette)
- Use `e.preventDefault()` to prevent any browser/system conflicts
- Numbers 1-5 are safe on macOS (no system conflicts like Cmd+Q or Cmd+W)

### Rationale

- Consistent with existing architecture
- No additional dependencies needed
- Simple and maintainable

---

## Decision 2: Tooltip Implementation

**Question**: What's the best approach for tooltips in the CommandPalette?

### Findings

The codebase currently has no tooltip implementation. Options:

1. **CSS-only tooltips**: Simple `title` attribute or custom CSS-based tooltips
2. **React-based tooltip**: Inline tooltips with positioning
3. **Existing UI library**: Not applicable (no UI library in use)

### Decision

**CSS-only custom tooltips**

```css
.favorite-item {
  position: relative;
}

.favorite-item:hover::after {
  content: 'Press Cmd+1';
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}
```

### Rationale

- Zero dependencies
- Accessible (can add `aria-label`)
- Matches existing CSS-in-CSS pattern (see `CommandPalette.css`)
- Simple to maintain

---

## Decision 3: LRU Algorithm for Small Dataset

**Question**: What's the most efficient LRU implementation for 5 items?

### Findings

With only 5 items, a simple array-based approach is most efficient:

```typescript
// When adding a new favorite (at position 0):
favorites.unshift(newFavorite);

// Remove if > 5
if (favorites.length > 5) {
  favorites.pop(); // Remove least recently used (oldest)
}
```

For LRU on usage, update the timestamp and reorder:

```typescript
// When executing favorite at index i:
const favorite = favorites[i];
favorite.lastUsedAt = new Date().toISOString();
// Move to front
favorites.splice(i, 1);
favorites.unshift(favorite);
```

### Decision

**Simple array-based LRU with timestamp tracking**

- `createdAt` for initial ordering (Cmd+1, Cmd+2, etc.)
- `lastUsedAt` for LRU eviction when exceeding 5 favorites
- Array operations are O(n) but n=5 is negligible

### Rationale

- No external LRU library needed
- Clear and maintainable code
- Matches the spec's `lastUsedAt` timestamp approach

---

## Alternatives Considered

| Alternative                               | Why Rejected                                     |
| ----------------------------------------- | ------------------------------------------------ |
| Use Tauri global shortcut API             | Overkill for app-internal shortcuts              |
| Use a tooltip library (Tippy.js, etc.)    | Unnecessary dependency for simple feature        |
| LinkedHashMap for LRU                     | Too complex for 5 items                          |
| LocalStorage directly vs hook abstraction | Hook provides better testability and reusability |

---

## Implementation Notes

1. **Keyboard handling**: Add in `App.tsx`, prioritize over Command Palette search
2. **Tooltips**: CSS-based, shown on hover over favorite items
3. **LRU**: Simple array with timestamp tracking
4. **Persistence**: Use localStorage key `boop_favorites_v1`
