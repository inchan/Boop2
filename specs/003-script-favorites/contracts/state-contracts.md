# Favorites Feature: Internal State Contracts

**Feature**: 003-script-favorites  
**Date**: 2026-01-04

## Overview

This document defines the internal state contracts for the favorites feature. Since this is a frontend-only feature with no external API, contracts define the expected state shapes and transitions.

## State Contracts

### 1. Favorites State (useFavorites hook)

```typescript
// Contract: FavoritesState
interface FavoritesState {
  favorites: FavoriteScript[]; // Ordered by createdAt, max 5 items
  isLoading: boolean;
  error: string | null;
}

// Initial State
const initialState: FavoritesState = {
  favorites: [],
  isLoading: false,
  error: null,
};

// Valid Transitions
type FavoritesAction =
  | { type: 'LOAD_SUCCESS'; payload: FavoriteScript[] }
  | { type: 'ADD_FAVORITE'; payload: FavoriteScript }
  | { type: 'REMOVE_FAVORITE'; payload: string } // scriptPath
  | { type: 'EXECUTE_FAVORITE'; payload: number } // assignedNumber
  | { type: 'REORDER'; payload: FavoriteScript[] }
  | { type: 'ERROR'; payload: string };
```

### 2. Command Palette Favorites Section

```typescript
// Contract: FavoritesDisplayState
interface FavoritesDisplayState {
  favorites: FavoriteScript[];
  visible: boolean; // Only visible when has favorites and no search query
  hoverIndex: number | null; // For tooltip display
}

// Rendering Rules
// - favorites.visible === favorites.length > 0 && !searchQuery
// - favorites.hoverIndex shows tooltip for that item
```

### 3. Keyboard Shortcut Handler

```typescript
// Contract: KeyboardHandlerState
interface KeyboardHandlerState {
  // Reserved shortcuts: Cmd+1, Cmd+2, Cmd+3, Cmd+4, Cmd+5
  reservedShortcuts: number[]; // [1, 2, 3, 4, 5]
  isPaletteOpen: boolean; // Shortcuts work regardless of palette state
}

// Handler Behavior
// If Cmd+1-5 pressed:
//   1. Check if number has assigned favorite
//   2. If yes: executeFavorite(number)
//   3. If no: do nothing (no error, no notification)
```

## Validation Rules

### FavoriteScript Validation

```typescript
function validateFavoriteScript(data: unknown): FavoriteScript {
  if (!isObject(data)) throw new Error('FavoriteScript must be an object');

  const script = data as FavoriteScript;

  if (typeof script.scriptPath !== 'string' || !script.scriptPath) {
    throw new Error('scriptPath must be a non-empty string');
  }

  if (
    typeof script.assignedNumber !== 'number' ||
    script.assignedNumber < 1 ||
    script.assignedNumber > 5
  ) {
    throw new Error('assignedNumber must be between 1 and 5');
  }

  if (typeof script.createdAt !== 'string' || !isValidDate(script.createdAt)) {
    throw new Error('createdAt must be a valid ISO date string');
  }

  // lastUsedAt is optional
  if (
    script.lastUsedAt !== undefined &&
    (typeof script.lastUsedAt !== 'string' || !isValidDate(script.lastUsedAt))
  ) {
    throw new Error('lastUsedAt must be a valid ISO date string if provided');
  }

  if (typeof script.usageCount !== 'number' || script.usageCount < 0) {
    throw new Error('usageCount must be a non-negative number');
  }

  return script;
}
```

### Collection Validation

```typescript
function validateFavoritesCollection(data: unknown): FavoritesCollection {
  const collection = data as FavoritesCollection;

  if (!Array.isArray(collection.favorites)) {
    throw new Error('favorites must be an array');
  }

  if (collection.favorites.length > 5) {
    throw new Error('favorites array cannot exceed 5 items');
  }

  if (collection.maxSize !== 5) {
    throw new Error('maxSize must be 5');
  }

  // Validate each favorite
  collection.favorites.forEach(validateFavoriteScript);

  return collection;
}
```

## Error Handling

| Error Type                      | Handler                   | User Feedback            |
| ------------------------------- | ------------------------- | ------------------------ |
| localStorage unavailable        | Catch and log             | No favorites loaded      |
| Invalid JSON in localStorage    | Reset to empty array      | Silent reset             |
| Script not found when executing | Remove favorite from list | One-time notification    |
| Duplicate favorite              | Ignore add request        | No feedback (idempotent) |

## Persistence Contract

### localStorage Schema

```typescript
// Key: 'boop_favorites_v1'
// Value: JSON string of FavoritesCollection
```

### Migration Strategy

| Version      | Schema              | Migration   |
| ------------ | ------------------- | ----------- |
| v1 (current) | FavoritesCollection | None needed |

### Fallback Behavior

If `boop_favorites_v1` is corrupted or missing:

1. Try to parse: `JSON.parse()`
2. If fails: Clear and use empty array
3. Log error for debugging
