# Data Model: Find Highlight Synchronization

## Overview

This feature uses existing data structures from the Editor Find (006) feature. No new data models are required.

## Existing Entities (from 006-editor-find)

### FindState

Used to track search mode state and highlights.

```typescript
interface FindState {
  isOpen: boolean; // Search bar visibility
  searchTerm: string; // Current search query
  replaceTerm: string; // Replacement text
  matches: SearchMatch[]; // All match positions
  activeIndex: number; // Currently active match
  isComposing: boolean; // IME composition state
}
```

### SearchMatch

Used to identify highlight positions in the editor.

```typescript
interface SearchMatch {
  id: string; // Unique match identifier
  start: number; // Character offset start
  end: number; // Character offset end
  line: number; // Line number containing match
}
```

## Highlight Marks

The feature adds custom marks to Slate text nodes for styling:

| Mark Name     | Purpose                  | CSS Class                              |
| ------------- | ------------------------ | -------------------------------------- |
| `find-match`  | Inactive match highlight | `.find-match` (yellow background)      |
| `find-active` | Active match highlight   | `.find-match-active` (blue background) |

## State Transitions

### Search Open → Close

```
{ isOpen: true, searchTerm: "...", matches: [...] }
  ↓ toggleFind() or closeFind()
{ isOpen: false, searchTerm: "", matches: [], activeIndex: -1 }
  → useEffect removes all find-* marks
```

### Search Term Change

```
{ searchTerm: "old", matches: [...] }
  ↓ setSearchTerm("new")
{ searchTerm: "new", matches: [...] }  // matches recalculated
  → useEffect removes old marks, applies new marks
```

## Dependencies

- Uses existing `useFind` hook from `src/hooks/useFind.ts`
- Uses existing `SlateEditor` component from `src/components/SlateEditor.tsx`
- Uses existing `FindState` interface from `src/types/find.ts`
