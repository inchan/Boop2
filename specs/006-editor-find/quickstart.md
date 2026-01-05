# Quickstart: Editor Find Feature

## Installation

No additional dependencies required. Uses existing Slate.js and React infrastructure.

## Usage

### Basic Setup

```typescript
import { useFind } from '@/hooks/useFind';

function EditorWithFind() {
  const { findState, openFind, closeFind, setSearchTerm, goToNext, goToPrevious } =
    useFind({ documentText: editorText });

  return (
    <>
      <SlateEditor onChange={handleTextChange} />
      {findState.isOpen && (
        <FindPanel
          isOpen={findState.isOpen}
          onClose={closeFind}
          onSearch={setSearchTerm}
          onNext={goToNext}
          onPrevious={goToPrevious}
          matchCount={findState.matches.length}
          activeIndex={findState.activeIndex}
          hasNoMatches={findState.searchTerm.length > 0 && findState.matches.length === 0}
        />
      )}
    </>
  );
}
```

### Keyboard Shortcuts

| Shortcut      | Platform      | Action           |
| ------------- | ------------- | ---------------- |
| `cmd+f`       | macOS         | Open find panel  |
| `ctrl+f`      | Windows/Linux | Open find panel  |
| `Escape`      | All           | Close find panel |
| `Enter`       | All           | Next match       |
| `Shift+Enter` | All           | Previous match   |

### IME Handling

The feature automatically handles Korean IME composition:

```typescript
// Composition during typing - search is paused
isComposingRef.current = true;
// Search resumes after composition completes
isComposingRef.current = false;
```

### Performance Optimization

For documents over 1000 lines, the search is automatically debounced:

```typescript
const debouncedSearch = useCallback(
  debounce((term: string) => {
    setSearchTerm(term);
  }, 100),
  []
);
```

## Testing

### Unit Tests

```bash
npm run test -- --grep "find"
```

### E2E Tests

```bash
npm run test:e2e -- --project=chromium
```

Key test scenarios:

- `e2e/editor-find.spec.ts: Open find panel with cmd+f`
- `e2e/editor-find.spec.ts: Search highlights all matches`
- `e2e/editor-find.spec.ts: Navigate between matches`
