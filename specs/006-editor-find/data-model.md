# Data Model: Editor Find Functionality

## Entities

### FindState

Manages the search state across the editor session.

| Field         | Type          | Required | Description                                 |
| ------------- | ------------- | -------- | ------------------------------------------- |
| `isOpen`      | boolean       | Yes      | Whether the find panel is visible           |
| `searchTerm`  | string        | Yes      | Current search query                        |
| `matches`     | SearchMatch[] | Yes      | Array of all match positions                |
| `activeIndex` | number        | Yes      | Currently selected match index (-1 if none) |
| `isComposing` | boolean       | Yes      | IME composition state                       |

### SearchMatch

Represents a single search result in the document.

| Field   | Type   | Required | Description                                 |
| ------- | ------ | -------- | ------------------------------------------- |
| `id`    | string | Yes      | Unique identifier for the match             |
| `start` | number | Yes      | Character offset from document start        |
| `end`   | number | Yes      | End character offset (start + query.length) |
| `line`  | number | Yes      | Line number containing the match            |

### FindPanelProps

Props passed to the FindPanel component.

| Field          | Type     | Required | Description                           |
| -------------- | -------- | -------- | ------------------------------------- |
| `isOpen`       | boolean  | Yes      | Panel visibility state                |
| `onClose`      | function | Yes      | Handler when panel closes             |
| `onSearch`     | function | Yes      | Callback when search term changes     |
| `onNavigate`   | function | Yes      | Callback for Next/Previous navigation |
| `matchCount`   | number   | Yes      | Total number of matches               |
| `activeIndex`  | number   | Yes      | Currently selected match index        |
| `documentText` | string   | Yes      | Full document text for searching      |

## State Transitions

```
Closed → (cmd+f pressed) → Open
Open → (Escape pressed) → Closed
Open → (click outside) → Closed
Open → (cmd+k pressed) → Closed (command palette opens)
```

## Validation Rules

- `searchTerm`: Maximum 500 characters
- `activeIndex`: Must be between -1 and matches.length - 1
- `matches`: Sorted by start position

## Persistence

Find state is ephemeral and does not persist across sessions. Opening the editor shows a fresh find panel.
