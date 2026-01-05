# Research: Editor Find Functionality

## Decision: Use React + Slate.js text search implementation

### Rationale

1. **Existing Editor Integration**: Boop2 already uses Slate.js for the editor, which provides a declarative way to handle text content and selections.

2. **IME Handling Pattern**: The codebase already has a working `isComposingRef` pattern in `SlateEditor.tsx`:

   ```typescript
   const isComposingRef = useRef(false);
   const handleCompositionStart = useCallback(() => {
     isComposingRef.current = true;
   }, []);
   const handleCompositionEnd = useCallback(() => {
     setTimeout(() => {
       isComposingRef.current = false;
       // Trigger onChange after composition
     }, 50);
   }, [editor, onChange]);
   ```

3. **Text Access**: Slate editor already exposes `getText()` method to retrieve plain text content.

4. **Selection Management**: Slate.js Transforms API allows programmatically selecting ranges.

### Alternatives Considered

| Alternative             | Why Rejected                                          |
| ----------------------- | ----------------------------------------------------- |
| CodeMirror find widget  | Would require replacing entire editor implementation  |
| Native browser find     | Limited control over UI, inconsistent across browsers |
| External search library | Overkill for single-document search, adds dependency  |

### Search Algorithm

For documents up to 10,000 lines, a simple string search with `String.indexOf()` is sufficient:

```typescript
function findMatches(text: string, query: string): number[] {
  const matches: number[] = [];
  let pos = text.indexOf(query);
  while (pos !== -1) {
    matches.push(pos);
    pos = text.indexOf(query, pos + 1);
  }
  return matches;
}
```

**Performance optimization for large documents (>1000 lines)**:

- Debounce search input by 50-100ms
- Limit visible highlights to first 100 matches
- Use web worker for search if performance degrades

### Highlight Implementation

Use Slate.js decorators ormarks to highlight search results:

```typescript
// Option: Using marks for highlights
const searchMark = { searchHighlight: true };

// Apply to matching ranges
Editor.addMark(editor, 'searchHighlight', true);
```

### Keyboard Shortcuts

| Shortcut           | Action           |
| ------------------ | ---------------- |
| `cmd+f` / `ctrl+f` | Open find panel  |
| `Escape`           | Close find panel |
| `Enter`            | Next match       |
| `Shift+Enter`      | Previous match   |

### References

- [Slate.js Documentation](https://docs.slatejs.org/)
- Existing `SlateEditor.tsx` implementation patterns
- VS Code find widget patterns (informational)
