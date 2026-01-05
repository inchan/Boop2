# Data Model: Command Palette Fixes

## Entities

### Script

Represents a transformation script.

| Field         | Type   | Description                              |
| ------------- | ------ | ---------------------------------------- |
| `name`        | string | Display name of the script.              |
| `path`        | string | Unique path identifying the script file. |
| `icon`        | string | Optional emoji or icon identifier.       |
| `description` | string | Short summary of what the script does.   |

### RecentStore (localStorage)

Stores the list of recently used script paths.

| Key                   | Type     | Description                                         |
| --------------------- | -------- | --------------------------------------------------- |
| `boop_recent_scripts` | string[] | Array of script `path` strings, ordered by recency. |

## State Transitions

1. **Palette Opened**:
   - Load `recentPaths` from `localStorage`.
   - Filter `sortedScripts` into `RECENT` (those in `recentPaths`) and `ALL SCRIPTS`.
2. **Search Query Entered**:
   - Filter both `RECENT` and `ALL SCRIPTS` based on the query.
3. **Script Executed**:
   - Add script `path` to the beginning of `recentPaths`.
   - Trim `recentPaths` to maximum size (e.g., 5).
   - Persist to `localStorage`.
4. **Remove from Recent**:
   - Remove script `path` from `recentPaths`.
   - Persist to `localStorage`.
