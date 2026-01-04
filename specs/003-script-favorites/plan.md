# Implementation Plan: Script Favorites System with Keyboard Shortcuts

**Branch**: `003-script-favorites` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-script-favorites/spec.md`

## Summary

A favorites system for Boop2 scripts that allows users to pin their most-used scripts for quick access via keyboard shortcuts (Cmd+1 through Cmd+5). The feature includes:

- Star icon in Command Palette to add/remove favorites
- FAVORITES section at top of Command Palette (up to 5 scripts)
- Cmd+number keyboard shortcuts for instant script execution
- LRU (Least Recently Used) auto-eviction when exceeding 5 favorites
- Tooltip hints showing keyboard shortcuts on hover
- Persistent storage via localStorage

## Technical Context

**Language/Version**: TypeScript 5.x, JavaScript ES2022  
**Primary Dependencies**: React 19, Slate.js (rich text editor), Fuse.js (fuzzy search in Command Palette)  
**Storage**: localStorage (existing Boop2 persistence layer)  
**Testing**: Vitest (existing test framework), Playwright (E2E)  
**Target Platform**: macOS 12+ (Tauri 2.0 desktop app)  
**Project Type**: Single project - Frontend-focused React application  
**Performance Goals**:

- Script execution within 200ms (FR-003)
- No startup impact >100ms (SC-004)
- Single-key access in under 1 second (SC-001)

**Constraints**:

- Cmd+1 through Cmd+5 reserved exclusively for favorites
- Korean IME input support not required for UI interactions
- Backward compatible with existing Command Palette behavior
- No external API or network dependencies

**Scale/Scope**:

- Maximum 5 favorites per user
- ~73 bundled scripts + user custom scripts
- Single-user local persistence

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

The project constitution (`.specify/memory/constitution.md`) is a template without specific rules. This feature follows general best practices:

| Principle           | Status | Notes                                                |
| ------------------- | ------ | ---------------------------------------------------- |
| Library-First       | N/A    | No external libraries needed beyond existing deps    |
| CLI Interface       | N/A    | Desktop app, no CLI component                        |
| Test-First          | ✅     | Tests can be written using existing Vitest framework |
| Integration Testing | ✅     | E2E tests via existing Playwright infrastructure     |
| Observability       | ✅     | Uses existing status bar messaging system            |

**Gate Status**: ✅ PASSED - No constitution violations

## Project Structure

### Documentation (this feature)

```text
specs/003-script-favorites/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── CommandPalette.tsx      # Modified: Favorites section, star icons
│   └── TabBar.tsx              # Possibly modified: keyboard shortcut handling
├── hooks/
│   └── useFavorites.ts         # NEW: Favorites state management
├── lib/
│   └── ScriptRunner.ts         # Modified: Execute script by path
├── App.tsx                     # Modified: Global keyboard shortcuts
└── types/
    └── index.ts                # Modified: FavoriteScript types

tests/
├── unit/
│   └── favorites.test.ts       # NEW: Favorites logic tests
└── e2e/
    └── editor-favorites.spec.ts # NEW: E2E tests for favorites
```

**Structure Decision**: Single project structure with React frontend. New hooks file (`useFavorites.ts`) for favorites state management, modifying existing `CommandPalette.tsx` for UI, and adding global keyboard handlers in `App.tsx`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed                 | Simpler Alternative Rejected Because |
| --------- | -------------------------- | ------------------------------------ |
| N/A       | No constitution violations | -                                    |

---

## Phase 0: Outline & Research

### Technical Unknowns

The following items require research or clarification:

| ID  | Item                    | Research Question                                                                     |
| --- | ----------------------- | ------------------------------------------------------------------------------------- |
| U1  | Keyboard Event Handling | How to globally capture Cmd+1-5 without conflicting with existing shortcuts in Tauri? |
| U2  | Tooltip Implementation  | What's the best approach for tooltips in the CommandPalette? CSS-only or React-based? |
| U3  | LRU Algorithm           | What's the most efficient way to track LRU for 5 items?                               |

### Research Tasks

1. **Task: Research global keyboard shortcuts in Tauri/React**
   - Capture Cmd+1 through Cmd+5 globally in the app
   - Ensure no conflicts with system or app shortcuts
   - Reference: `src/App.tsx` existing keyboard handling

2. **Task: Research tooltip implementation patterns**
   - Existing tooltip patterns in the codebase
   - CSS-only vs JavaScript-based tooltips
   - Accessibility considerations

3. **Task: Research LRU implementation for small datasets**
   - Simple array-based LRU for 5 items
   - Consideration: `lastUsedAt` timestamp tracking

---

## Phase 1: Design & Contracts

### Data Model (from spec.md)

**FavoriteScript**:

```typescript
{
  scriptPath: string,      // Reference to the script
  assignedNumber: number,  // 1-5
  createdAt: string,       // ISO timestamp
  lastUsedAt: string,      // ISO timestamp (for LRU)
  usageCount: number       // For analytics
}
```

**FavoritesCollection**:

```typescript
{
  favorites: FavoriteScript[],  // Max 5 items, ordered by createdAt
  maxSize: number,              // Always 5
  lastUpdated: string           // ISO timestamp
}
```

### API Contracts

This feature operates within the existing React state management. No external API contracts needed.

**Internal Functions**:

- `addToFavorites(scriptPath: string): void`
- `removeFromFavorites(scriptPath: string): void`
- `executeFavorite(number: 1-5): void`
- `getFavorites(): FavoriteScript[]`
- `reorderFavorites(): void` // LRU eviction

---

## Phase 2: Task Breakdown (from /speckit.tasks)

See `tasks.md` for the full task breakdown.
