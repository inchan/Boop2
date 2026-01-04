# Quickstart: Script Favorites Feature

**Feature**: 003-script-favorites  
**Date**: 2026-01-04

## Overview

This guide provides a quick reference for implementing the favorites feature in Boop2.

## Files to Modify

| File                                | Changes                                          |
| ----------------------------------- | ------------------------------------------------ |
| `src/hooks/useFavorites.ts`         | **NEW** - Favorites state management hook        |
| `src/components/CommandPalette.tsx` | Add favorites section, star icons, tooltips      |
| `src/App.tsx`                       | Add global Cmd+1-5 keyboard handlers             |
| `src/types/index.ts`                | Add FavoriteScript and FavoritesCollection types |
| `src/components/CommandPalette.css` | Add favorites styling and tooltips               |

## Files to Create

| File                                 | Purpose                         |
| ------------------------------------ | ------------------------------- |
| `tests/unit/favorites.test.ts`       | Unit tests for favorites logic  |
| `tests/e2e/editor-favorites.spec.ts` | E2E tests for favorites feature |

## Implementation Checklist

### Step 1: Add Types

```typescript
// src/types/index.ts
export interface FavoriteScript {
  scriptPath: string;
  assignedNumber: number;
  createdAt: string;
  lastUsedAt: string;
  usageCount: number;
}

export interface FavoritesCollection {
  favorites: FavoriteScript[];
  maxSize: number;
  lastUpdated: string;
}
```

### Step 2: Create Favorites Hook

```typescript
// src/hooks/useFavorites.ts
const FAVORITES_KEY = 'boop_favorites_v1';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteScript[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const saveFavorites = (newFavorites: FavoriteScript[]) => {
    const collection: FavoritesCollection = {
      favorites: newFavorites,
      maxSize: 5,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(collection));
    setFavorites(newFavorites);
  };

  const addFavorite = (scriptPath: string) => {
    // Add to front, maintain max 5
    // Implement LRU eviction if needed
  };

  const removeFavorite = (scriptPath: string) => {
    // Remove from favorites
  };

  const executeFavorite = (number: number) => {
    // Execute script, update timestamp, move to front
  };

  return { favorites, addFavorite, removeFavorite, executeFavorite };
}
```

### Step 3: Update Command Palette

In `CommandPalette.tsx`:

1. Add favorites section at top (before RECENT and ALL SCRIPTS)
2. Add star icon next to each script item
3. Show tooltip with keyboard shortcut on hover
4. Handle click events for adding/removing favorites

### Step 4: Add Global Keyboard Handlers

In `App.tsx` (add to existing `handleKeyDown`):

```typescript
if ((e.metaKey || e.ctrlKey) && /^[1-5]$/.test(e.key)) {
  e.preventDefault();
  const number = parseInt(e.key);
  executeFavorite(number);
}
```

## Testing

### Unit Tests

```typescript
// tests/unit/favorites.test.ts
describe('useFavorites', () => {
  it('should add a favorite', () => {
    // Test addFavorite
  });

  it('should remove a favorite', () => {
    // Test removeFavorite
  });

  it('should enforce max 5 favorites', () => {
    // Test LRU eviction
  });

  it('should update lastUsedAt on execution', () => {
    // Test executeFavorite timestamp update
  });
});
```

### E2E Tests

```typescript
// tests/e2e/editor-favorites.spec.ts
describe('Favorites Feature', () => {
  it('should add a script to favorites', async () => {
    // Open Command Palette
    // Find script
    // Click star icon
    // Verify in FAVORITES section
  });

  it('should execute favorite with Cmd+number', async () => {
    // Add script as favorite
    // Press Cmd+1
    // Verify script executed
  });

  it('should show tooltip on hover', async () => {
    // Add script as favorite
    // Open Command Palette
    // Hover over favorite
    // Verify tooltip appears
  });
});
```

## Debugging

### Common Issues

1. **Keyboard shortcut not firing**: Check if Command Palette is open (shortcuts should work even when palette is closed)
2. **Favorites not persisting**: Verify `localStorage` key is correct and data format is valid
3. **LRU not working**: Check `lastUsedAt` timestamp is being updated on execution

### Console Commands

```javascript
// Debug: Check favorites in localStorage
JSON.parse(localStorage.getItem('boop_favorites_v1'));

// Debug: Clear favorites
localStorage.removeItem('boop_favorites_v1');
```

## Performance Considerations

- LRU with array of 5 items: O(n) is negligible (n=5)
- localStorage reads/writes: Fast enough for this use case
- Keyboard handlers: Must be efficient (avoid re-renders)
