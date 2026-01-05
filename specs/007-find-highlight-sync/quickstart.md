# Quickstart: Find Highlight Synchronization

## Overview

This feature synchronizes text highlight state with search mode lifecycle in the Boop2 editor.

## Core Behaviors

### 1. Search Close → Clear Highlights

When `toggleFind()` closes search mode (sets `isOpen: false`), all `find-match` and `find-active` marks must be removed from the editor.

**Current Implementation**:

```typescript
// useFind.ts
const toggleFind = useCallback(() => {
  setFindState((prev) => ({
    ...prev,
    isOpen: !prev.isOpen,
    searchTerm: prev.isOpen ? '' : prev.searchTerm,
    replaceTerm: prev.isOpen ? '' : prev.replaceTerm,
    matches: prev.isOpen ? [] : prev.matches,
    activeIndex: prev.isOpen ? -1 : prev.activeIndex,
  }));
}, []);
```

### 2. Search Text Change → Update Highlights

When `searchTerm` changes, `useEffect` in SlateEditor must:

1. Remove all existing find marks
2. Calculate new match positions
3. Apply `find-match` or `find-active` marks to new matches

**Current Implementation**:

```typescript
// SlateEditor.tsx
useEffect(() => {
  if (!findState?.searchTerm || findState.matches.length === 0) {
    // Remove all highlights
    const marks = Editor.marks(editor);
    if (marks) {
      Object.keys(marks).forEach((key) => {
        if (key.startsWith('find-')) {
          Editor.removeMark(editor, key);
        }
      });
    }
    return;
  }
  // Apply new highlights...
}, [findState?.searchTerm, findState?.matches, findState?.activeIndex, editor]);
```

## Key Files

| File                             | Role                          |
| -------------------------------- | ----------------------------- |
| `src/components/SlateEditor.tsx` | Editor with highlight effects |
| `src/hooks/useFind.ts`           | Search state management       |
| `src/components/FindPanel.tsx`   | Search UI component           |
| `src/types/find.ts`              | TypeScript interfaces         |
| `src/components/SlateEditor.css` | Highlight styles              |

## Testing Checklist

- [ ] Escape closes search and removes highlights
- [ ] Cmd+F toggle closes search and removes highlights
- [ ] Typing in search bar updates highlights immediately
- [ ] Clearing search bar removes all highlights
- [ ] Active match has different style than inactive matches
- [ ] Enter navigates to next match and updates active style

## Related Features

This feature extends the existing Editor Find (006) feature. See `specs/006-editor-find/` for full find functionality including replace.
