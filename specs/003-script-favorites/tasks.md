# Tasks: Script Favorites System with Keyboard Shortcuts

**Input**: Design documents from `/specs/003-script-favorites/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/
**Tests**: Not explicitly requested - tests are OPTIONAL and not included

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Types and Infrastructure)

**Purpose**: Define types and create foundational infrastructure

- [x] T001 Create FavoriteScript and FavoritesCollection types in `src/types/index.ts`
- [x] T002 [P] Create useFavorites hook skeleton in `src/hooks/useFavorites.ts`
- [x] T003 [P] Add favorites CSS styles for tooltips and star icons in `src/components/CommandPalette.css`

---

## Phase 2: Foundational (Core Hook Logic)

**Purpose**: Core favorites state management that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement localStorage persistence in useFavorites hook (`src/hooks/useFavorites.ts`)
- [x] T005 Implement addToFavorites function with LRU eviction logic in `src/hooks/useFavorites.ts`)
- [x] T006 Implement removeFromFavorites function in `src/hooks/useFavorites.ts`)
- [x] T007 Implement executeFavorite function in `src/hooks/useFavorites.ts`)
- [x] T008 Export useFavorites hook from `src/hooks/index.ts`

**Checkpoint**: Foundational ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Quick Script Access with Number Shortcuts (Priority: P1) 🎯 MVP

**Goal**: Users can press Cmd+1-5 to instantly execute their favorite scripts

**Independent Test**: Open Boop2, press Cmd+1, verify the assigned script executes immediately without any additional steps

### Implementation for User Story 1

- [x] T009 [US1] Add global keyboard shortcut handlers for Cmd+1 through Cmd+5 in `src/App.tsx`
- [x] T010 [US1] Import and integrate useFavorites hook in `src/App.tsx`
- [x] T011 [US1] Connect keyboard shortcuts to executeFavorite function in `src/App.tsx`
- [x] T012 [US1] Add graceful handling when editor is empty (no-op with status message) - covered by existing runSelectedScript
- [x] T013 [US1] Add status bar message when favorite executes in `src/App.tsx` - covered by existing runSelectedScript

**Checkpoint**: User Story 1 complete - Cmd+number shortcuts work

---

## Phase 4: User Story 2 - Adding Scripts to Favorites (Priority: P1) 🎯 MVP

**Goal**: Users can add scripts to favorites with a single click in the Command Palette

**Independent Test**: Open Command Palette, find a script, click star icon, verify it appears in FAVORITES section and responds to Cmd+number shortcuts

### Implementation for User Story 2

- [x] T014 [US2] Add star icon component to script items in `src/components/CommandPalette.tsx`
- [x] T015 [US2] Implement addToFavorites on star click in `src/components/CommandPalette.tsx`
- [x] T016 [US2] Update Command Palette to reflect favorites changes immediately in `src/components/CommandPalette.tsx`
- [x] T017 [US2] Add visual feedback when adding to favorites (status message or UI change)

**Checkpoint**: User Story 2 complete - Scripts can be added to favorites

---

## Phase 5: User Story 3 - Favorites Section in Command Palette (Priority: P1) 🎯 MVP

**Goal**: Favorites are prominently displayed at the top of Command Palette with tooltip hints

**Independent Test**: Open Command Palette, verify FAVORITES section appears at top with up to 5 starred scripts, hover to see Cmd+number tooltip

### Implementation for User Story 3

- [x] T018 [US3] Render FAVORITES section at top of Command Palette when no search query in `src/components/CommandPalette.tsx`
- [x] T019 [US3] Hide FAVORITES section when in search mode (search results take precedence) in `src/components/CommandPalette.tsx`
- [x] T020 [US3] Add CSS tooltip on hover showing "Press Cmd+X" in `src/components/CommandPalette.css`
- [x] T021 [US3] Show placeholder message when no favorites configured in `src/components/CommandPalette.tsx`

**Checkpoint**: User Story 3 complete - Favorites section displays correctly with tooltips

---

## Phase 6: User Story 4 - Removing Scripts from Favorites (Priority: P2)

**Goal**: Users can remove scripts from favorites with a single click

**Independent Test**: Remove a favorite, verify it no longer appears in FAVORITES section and its keyboard shortcut becomes available

### Implementation for User Story 4

- [ ] T022 [US4] Toggle star icon state (filled/empty) based on favorite status in `src/components/CommandPalette.tsx`
- [ ] T023 [US4] Implement removeFromFavorites on star click in `src/components/CommandPalette.tsx`
- [ ] T024 [US4] Handle shortcut availability after removal (Cmd+X becomes available) in `src/hooks/useFavorites.ts`

**Checkpoint**: User Story 4 complete - Favorites can be removed

---

## Phase 7: User Story 5 - Recent Scripts Independence (Priority: P2)

**Goal**: Executing via favorite shortcuts does NOT add scripts to recent list

**Independent Test**: Execute a script via Cmd+2, open Command Palette, verify script is NOT in RECENT section

### Implementation for User Story 5

- [ ] T025 [US5] Modify executeFavorite to NOT update recent scripts list in `src/hooks/useFavorites.ts`
- [ ] T026 [US5] Verify favorites don't appear in RECENT section when opened in `src/components/CommandPalette.tsx`

**Checkpoint**: User Story 5 complete - Favorites and recent lists are independent

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and edge case handling

- [ ] T027 Add edge case handling for missing/deleted scripts in `src/hooks/useFavorites.ts`
- [ ] T028 Add one-time notification when invalid favorite is removed
- [ ] T029 [P] Verify keyboard shortcuts don't conflict with existing app shortcuts
- [ ] T030 [P] Performance validation - ensure <100ms startup impact
- [ ] T031 [P] Run lint and prettier checks on all modified files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - May integrate with US1 but should be independently testable
- **User Story 3 (P1)**: Can start after Foundational - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P2)**: Can start after Foundational - Builds on US2 functionality
- **User Story 5 (P2)**: Can start after Foundational - Independent of other stories

### Within Each User Story

- Types before hooks
- Hook core logic before UI integration
- UI components before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Different user stories can be worked on in parallel by different team members
- Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Add global keyboard shortcut handlers for Cmd+1 through Cmd+5 in src/App.tsx"
Task: "Import and integrate useFavorites hook in src/App.tsx"
Task: "Connect keyboard shortcuts to executeFavorite function in src/App.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008) - CRITICAL
3. Complete Phase 3: User Story 1 (T009-T013)
4. **STOP and VALIDATE**: Test Cmd+1-5 shortcuts work
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Polish → Final release
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Summary

| Metric               | Value |
| -------------------- | ----- |
| Total Tasks          | 31    |
| Setup Tasks          | 3     |
| Foundational Tasks   | 5     |
| User Story 1 Tasks   | 5     |
| User Story 2 Tasks   | 4     |
| User Story 3 Tasks   | 4     |
| User Story 4 Tasks   | 3     |
| User Story 5 Tasks   | 2     |
| Polish Tasks         | 5     |
| Parallelizable Tasks | 12    |

**Recommended MVP Scope**: Phases 1-3 (Setup + Foundational + User Story 1) = 13 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
