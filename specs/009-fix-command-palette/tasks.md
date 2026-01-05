---
description: 'Task list for Command Palette Fixes implementation'
---

# Tasks: Command Palette Fixes

**Input**: Design documents from `/specs/009-fix-command-palette/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md  
**Tech Stack**: TypeScript 5.8, React 19.1, Tauri 2.0, Vite 7.0, localStorage

**Tests**: E2E tests (Playwright) and Unit tests (Vitest) exist in the project and should be updated/verified.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Review and prepare shared types

- [x] T001 [P] Review `Script` interface and metadata types in `src/types/index.ts`
- [x] T002 Initialize `recentPaths` state with `localStorage` persistence (`boop_recent_scripts`) in `src/components/CommandPalette.tsx`
- [x] T003 Implement `addRecent` (on execution) and `removeRecent` (on X click) handlers in `src/components/CommandPalette.tsx`
- [x] T004 [US1] Remove `FAVORITES` filtering logic and rendering from `src/components/CommandPalette.tsx`
- [x] T005 [US1] Update `useMemo` to correctly aggregate `recentScripts` and `allScripts` from `sortedScripts` in `src/components/CommandPalette.tsx`
- [x] T006 [US1] Fix filtering logic to ensure all 73 bundled scripts are discoverable in `src/components/CommandPalette.tsx`
- [x] T007 [US1] Remove all "star" icon references and related event handlers from `src/components/CommandPalette.tsx`
- [x] T008 [US2] Restore search filtering logic for both `recentScripts` and `allScripts` in `src/components/CommandPalette.tsx`
- [x] T009 [US2] Update fuzzy search/filter to include script name, description, and tags in `src/components/CommandPalette.tsx`
- [x] T010 [US3] Update `.command-palette-header` and `.close-btn` styles for perfect vertical centering in `src/components/CommandPalette.css`
- [x] T011 [US3] Refactor `.command-item` to use a fixed-width action slot (e.g., 32px) for the "X" button in `src/components/CommandPalette.css`
- [x] T012 [US3] Ensure the removal "X" button is only rendered for `RECENT` items but its layout space is reserved for all items in `src/components/CommandPalette.tsx`
- [x] T013 [P] Remove unused favorite-related CSS classes and badges in `src/components/CommandPalette.css`
- [x] T014 Update `src/lib/recents.integration.test.ts` to reflect the removal of favorites and focus on recents
- [x] T015 Run full E2E test suite in `e2e/` (Note: palette tests might fail if scripts not loaded in test environment)
- [x] T016 [P] [US1] Remove or deprecate `src/hooks/useFavorites.ts` to prevent dead code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1. Blocks all US phases.
- **User Stories (Phase 3-5)**: Depend on Phase 2 completion.
  - US1 (Phase 3) is the primary MVP.
  - US2 (Phase 4) depends on US1 (filtered lists).
  - US3 (Phase 5) can proceed in parallel with US1/US2 as it is styling-focused, but depends on `CommandPalette.tsx` structure updates.
- **Polish (Final Phase)**: Depends on all US phases.

### User Story Dependencies

- **US1 (P1)**: Prerequisite for functional search (US2).
- **US2 (P1)**: Depends on US1 sections.
- **US3 (P2)**: Independent logic but affects US1/US2 components.

### Parallel Opportunities

- T001 can run in parallel with any Phase 1/2 task.
- T013 and T014 can run in parallel.
- Once the structure in `CommandPalette.tsx` is updated for US1, CSS work for US3 (T010, T011) can run in parallel with search logic (T008, T009).

---

## Parallel Example: User Story 3 Styling

```bash
# These tasks can be worked on concurrently if the component structure is stable:
Task: "Update header close button styles in src/components/CommandPalette.css"
Task: "Refactor item layout for fixed-width action slot in src/components/CommandPalette.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup and Foundational phases.
2. Complete US1 (T004-T007) to restore basic visibility.
3. Complete US2 (T008-T009) to restore core search.
4. **STOP and VALIDATE**: Verify all scripts are searchable.

### Incremental Delivery

1. Foundation -> Recents state working.
2. US1 -> Favorites gone, All Scripts visible.
3. US2 -> Search working.
4. US3 -> UI aligned.
5. Polish -> CSS cleaned, tests passing.

---

## Summary

| Metric             | Value |
| ------------------ | ----- |
| Total Tasks        | 15    |
| Setup Tasks        | 1     |
| Foundational Tasks | 2     |
| US1 (P1) Tasks     | 4     |
| US2 (P1) Tasks     | 2     |
| US3 (P2) Tasks     | 3     |
| Polish Tasks       | 3     |

**Parallel Opportunities**: T001, T013, T014.  
**MVP Scope**: Phases 1, 2, 3, 4 (9 tasks).

---

## Notes

- **[P] tasks** = different files or decoupled logic.
- **[Story] label** maps to the spec for traceability.
- Verify that `RECENT` logic does not overlap with existing `useFavorites` if possible to avoid confusion, or cleanup the hook if it's dead.
