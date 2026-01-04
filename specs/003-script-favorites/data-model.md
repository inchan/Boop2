# Data Model: Script Favorites System

**Feature**: 003-script-favorites  
**Date**: 2026-01-04

## Overview

This document defines the data structures for the favorites feature, derived from the feature specification and research findings.

## Entities

### FavoriteScript

Represents a single favorited script with its metadata.

```typescript
interface FavoriteScript {
  // Primary key reference to the script
  scriptPath: string;

  // Assigned keyboard shortcut (1-5)
  assignedNumber: number;

  // Timestamps for ordering and LRU
  createdAt: string; // ISO 8601 when favorited
  lastUsedAt: string; // ISO 8601 when last executed via shortcut

  // Analytics data
  usageCount: number; // Number of times executed via favorite
}
```

**Validation Rules**:

- `scriptPath`: Required, non-empty string
- `assignedNumber`: Required, integer 1-5
- `createdAt`: Required, valid ISO date string
- `lastUsedAt`: Optional, valid ISO date string (null if never used)
- `usageCount`: Required, non-negative integer

### FavoritesCollection

Manages the collection of favorites.

```typescript
interface FavoritesCollection {
  // Ordered list of favorites (max 5 items)
  favorites: FavoriteScript[];

  // Configuration constant
  maxSize: number; // Always 5

  // Metadata
  lastUpdated: string; // ISO 8601 timestamp
}
```

**Validation Rules**:

- `favorites`: Required, array, max length = 5
- `maxSize`: Required, always equals 5
- `lastUpdated`: Required, valid ISO date string

## Storage Schema

### localStorage Key

```
boop_favorites_v1
```

### JSON Format

```json
{
  "favorites": [
    {
      "scriptPath": "FormatJSON.js",
      "assignedNumber": 1,
      "createdAt": "2026-01-04T20:00:00.000Z",
      "lastUsedAt": "2026-01-04T21:30:00.000Z",
      "usageCount": 15
    },
    {
      "scriptPath": "Base64Decode.js",
      "assignedNumber": 2,
      "createdAt": "2026-01-04T20:05:00.000Z",
      "lastUsedAt": "2026-01-04T15:00:00.000Z",
      "usageCount": 8
    }
  ],
  "maxSize": 5,
  "lastUpdated": "2026-01-04T21:30:00.000Z"
}
```

## State Transitions

### Adding a Favorite

```
State: favorites = [A, B, C, D] (4 items)
Action: Add E
       ↓
State: favorites = [E, A, B, C, D] (5 items)
       ↓
If Action: Add F (6th item)
       ↓
LRU Eviction: Remove D (least recently used)
       ↓
State: favorites = [F, E, A, B, C] (5 items)
```

### Removing a Favorite

```
State: favorites = [A, B, C, D, E] (5 items)
Action: Remove B
       ↓
State: favorites = [A, C, D, E] (4 items)
       ↓
Note: Cmd+2 is now available for re-assignment
```

### Executing via Shortcut

```
State: favorites = [A(1), B(2), C(3), D(4), E(5)]
Action: Execute Cmd+3 (C)
       ↓
Update: C.lastUsedAt = now, C.usageCount++
       ↓
Reorder: Move C to front
       ↓
State: favorites = [C(1), A(2), B(3), D(4), E(5)]
       ↓
Note: Cmd+1 and Cmd+3 are now available
```

## Relationships

### Script Reference

Favorites reference scripts by their `scriptPath`. The path corresponds to:

- **Bundled scripts**: `FormatJSON.js`, `Base64Decode.js`, etc.
- **User scripts**: Full path to user's custom script file

When a script is deleted or moved, the favorite becomes invalid and should be removed with a notification.

### Recent Scripts Independence

Favorites and recent scripts are separate:

- **Favorites**: User-curated, manual management
- **Recent**: System-tracked, automatic based on usage

Executing via favorite shortcut does NOT add to the recent scripts list (FR-008).
