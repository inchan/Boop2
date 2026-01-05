---
description: 'Task list for Editor Find Feature implementation'
---

# Tasks: Editor Find Functionality

**Input**: Design documents from `/specs/006-editor-find/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/
**Tech Stack**: TypeScript 5.8, React 19.1, Slate.js 0.120, Tauri 2.0, Vite 7.0

**Tests**: E2E tests via Playwright, unit tests via Vitest

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project structure and utility functions for the find feature

- [ ] T001 Create find utility module `src/lib/findUtils.ts` with search algorithm
- [ ] T002 Create TypeScript interfaces for FindState and SearchMatch in `src/types/find.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hook that manages find state - MUST complete before ANY user story

- [ ] T003 Create `useFind` hook in `src/hooks/useFind.ts` implementing FindState management
- [ ] T004 Implement `findMatches` function in `src/lib/findUtils.ts` for text search
- [ ] T005 Add debounce logic for search input (performance optimization)

**Checkpoint**: Hook ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Open Find Panel (Priority: P1) 🎯 MVP

**Goal**: Display find panel when user presses cmd+f, close on Escape or click outside

**Independent Test**: Press cmd+f → Find panel appears. Press Escape → Panel closes.

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create FindPanel component in `src/components/FindPanel.tsx`
- [ ] T007 [P] [US1] Add CSS styles for FindPanel in `src/components/FindPanel.css`
- [ ] T008 [US1] Integrate keyboard shortcuts (cmd+f/ctrl+f, Escape) in SlateEditor.tsx
- [ ] T009 [US1] Implement onClose handler to hide panel and return focus to editor

**Checkpoint**: User can open and close the find panel with keyboard

---

## Phase 4: User Story 2 - Search for Text (Priority: P1)

**Goal**: Real-time text search with case-insensitive matching and match highlighting

**Independent Test**: Open find panel, type search term → Matches highlighted, first match selected

### Implementation for User Story 2

- [ ] T010 [US2] Connect useFind hook to FindPanel component (onSearch callback)
- [ ] T011 [US2] Implement real-time search with case-insensitive matching
- [ ] T012 [US2] Add "No results" indicator when search finds no matches
- [ ] T013 [US2] Integrate IME composition handling (isComposingRef check)

**Checkpoint**: Users can search and see highlighted results

---

## Phase 5: User Story 3 - Navigate Between Matches (Priority: P2)

**Goal**: Navigate between search matches with Next/Previous controls and wrap-around

**Independent Test**: Search for common text, press Enter → Moves to next match. At end → wraps to first.

### Implementation for User Story 3

- [ ] T014 [US3] Add Next/Previous buttons to FindPanel component
- [ ] T015 [US3] Implement goToNext and goToPrevious in useFind hook
- [ ] T016 [US3] Add keyboard shortcuts (Enter = Next, Shift+Enter = Previous)
- [ ] T017 [US3] Implement match selection and scroll-into-view in editor

**Checkpoint**: Users can navigate through all matches

---

## Phase 6: User Story 4 - Replace Text (Priority: P3)

**Goal**: Replace selected match or all matches with new text

**Independent Test**: Search for text, enter replacement, click Replace → Text replaced

### Implementation for User Story 4

- [ ] T018 [P] [US4] Add replace input field to FindPanel component
- [ ] T019 [P] [US4] Add Replace and Replace All buttons to FindPanel
- [ ] T020 [US4] Implement single replace logic in useFind hook
- [ ] T021 [US4] Implement Replace All logic with confirmation

**Checkpoint**: Users can replace text in the document

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that enhance the overall feature

- [ ] T022 [P] Add unit tests for findUtils in `tests/unit/find.test.ts`
- [ ] T023 [P] Add E2E tests for find feature in `tests/e2e/editor-find.spec.ts`
- [ ] T024 Performance optimization for documents over 1000 lines
- [ ] T025 Update AGENTS.md and CLAUDE.md with new feature context

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase            | Depends On   | Blocks           |
| ---------------- | ------------ | ---------------- |
| Setup (1)        | None         | Foundational     |
| Foundational (2) | Setup        | All User Stories |
| User Story 1 (3) | Foundational | None (MVP!)      |
| User Story 2 (4) | Foundational | None             |
| User Story 3 (5) | Foundational | None             |
| User Story 4 (6) | Foundational | None             |
| Polish (7)       | User Stories | -                |

### User Story Completion Order

1. **US1 (P1)**: Can start after Foundational - Opens/closes panel
2. **US2 (P1)**: Depends on US1 UI, adds search functionality
3. **US3 (P2)**: Depends on US2 search, adds navigation
4. **US4 (P3)**: Depends on US2 search, adds replace functionality

**Each story is independently testable** - you can demo after completing any user story.

### Parallel Opportunities

- T001, T002 can run in parallel (utility files)
- T006, T007 can run in parallel (component + styles)
- T018, T019 can run in parallel (replace UI elements)
- T022, T023 can run in parallel (tests)

---

## Parallel Example: User Story 1

```bash
# Launch all implementations for User Story 1 together:
Task: "Create FindPanel component in src/components/FindPanel.tsx"
Task: "Add CSS styles for FindPanel in src/components/FindPanel.css"
Task: "Integrate keyboard shortcuts in SlateEditor.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003, T004, T005)
3. Complete Phase 3: User Story 1 (T006, T007, T008, T009)
4. **STOP and VALIDATE**: Test opening/closing find panel
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP!)
3. Add US2 → Test independently → Deploy/Demo
4. Add US3 → Test independently → Deploy/Demo
5. Add US4 → Test independently → Deploy/Demo

---

## Summary

| Metric                 | Count                 |
| ---------------------- | --------------------- |
| **Total Tasks**        | 25                    |
| **Parallelizable [P]** | 11                    |
| **User Stories**       | 4 (P1, P1, P2, P3)    |
| **MVP Scope**          | Phases 1-3 (US1 only) |

### MVP Tasks (To deliver User Story 1)

- T001, T002, T003, T004, T005, T006, T007, T008, T009 = 9 tasks

### Suggested Next Command

`/speckit.implement` - Execute tasks.md and implement the feature
