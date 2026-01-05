# Implementation Plan: Editor Find Functionality

**Branch**: `006-editor-find` | **Date**: 2026-01-05 | **Spec**: [link](spec.md)
**Input**: Feature specification from `/specs/006-editor-find/spec.md`

## Summary

Implement a cmd+f text find feature for the Boop2 editor using the existing Slate.js editor. The feature includes:

- Find panel UI with keyboard shortcuts (cmd+f/ctrl+f, Escape)
- Real-time text search with case-insensitive matching
- Match highlighting and navigation (Next/Previous)
- IME composition handling using existing `isComposingRef` pattern
- Performance optimization for documents up to 10,000 lines

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1, Rust 1.75  
**Primary Dependencies**: Slate.js 0.120, Tauri 2.0, Vite 7.0  
**Storage**: N/A (local editor state only)  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: macOS, Windows, Linux (desktop via Tauri)  
**Project Type**: Single project (React frontend + Tauri backend)  
**Performance Goals**: Search results within 100ms per keystroke (10,000 line documents)  
**Constraints**: Must integrate with existing Slate.js editor; use existing IME handling pattern  
**Scale/Scope**: Single editor instance, local document search only

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

No constitution defined. Skipping gate checks.

**Post-Phase 1 Re-check**: All design decisions align with existing codebase patterns (Slate.js, React hooks, Tauri). No conflicts detected.

## Project Structure

### Documentation (this feature)

```text
specs/006-editor-find/
├── plan.md              # This file
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
│   ├── FindPanel.tsx    # NEW: Find panel UI component
│   └── SlateEditor.tsx  # EXISTING: Editor with find integration
├── hooks/
│   └── useFind.ts       # NEW: Find state management hook
└── lib/
    └── findUtils.ts     # NEW: Search algorithm utilities

tests/
├── unit/
│   └── find.test.ts     # NEW: Unit tests for search logic
└── e2e/
    └── editor-find.spec.ts  # NEW: E2E tests for find feature
```

**Structure Decision**: React components in `src/components/`, hook for state management in `src/hooks/`, utility functions in `src/lib/`. E2E tests extend existing Playwright test suite.

## Complexity Tracking

> N/A - No constitution violations
