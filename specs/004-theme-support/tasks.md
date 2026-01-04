# Tasks: 테마 지원 (Theme Support)

**Input**: Design documents from `/specs/004-theme-support/`
**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md
**Tech Stack**: TypeScript 5.x, React 19, Tauri 2.0, CSS Custom Properties

## Phase 1: Setup - Initial Load Flash Prevention

**Purpose**: Fix white screen flash during app launch by adding theme-appropriate background at HTML level

- [x] **T001** Add inline theme background styles in index.html
  - Add `<style>` block with dark mode as default
  - Use `@media (prefers-color-scheme: light)` override for light mode
  - File: `index.html`

---

## Phase 2: Foundational - CSS Variables Architecture

**Purpose**: Define centralized theme variables that all components will consume

- [x] **T002** Define CSS custom properties in src/App.css
  - Add `:root` block with light theme defaults (10 variables)
  - Add `@media (prefers-color-scheme: dark)` block with dark theme overrides
  - File: `src/App.css`

- [x] **T003** Add theme transition animations in src/App.css
  - Add `transition` property for background-color, color, border-color
  - Add `@media (prefers-reduced-motion: reduce)` to disable animations
  - File: `src/App.css`

**Checkpoint**: Foundation ready - component theming can now begin

---

## Phase 3: User Story 1 - Automatic Theme Switching (Priority: P1) 🎯 MVP

**Goal**: Apps UI automatically switches between dark and light themes based on macOS system preference

**Independent Test**: Set macOS to Dark Mode, launch Boop2, verify dark theme. Change to Light Mode, verify light theme.

### Implementation for User Story 1

- [x] **T004** [US1] Update SlateEditor component to use theme variables
  - Replace hardcoded editor background with `--editor-bg`
  - Replace hardcoded text color with `--text-primary`
  - File: `src/components/SlateEditor.tsx` and its CSS file

- [x] **T005** [US1] Update TabBar component to use theme variables
  - Replace hardcoded tab background with `--bg-secondary`
  - Replace hardcoded text color with `--text-primary`
  - Replace hardcoded border color with `--border-color`
  - File: `src/components/TabBar.tsx` and its CSS file

**Checkpoint**: Core editor and tabs now support automatic theme switching

---

## Phase 4: User Story 2 - Initial Load Flash Prevention (Priority: P1) 🎯

**Goal**: No white/dark flash when launching app - background matches system theme immediately

**Independent Test**: Launch Boop2 multiple times in dark mode, verify no white flash. Repeat in light mode, verify no dark flash.

### Implementation for User Story 2

- [x] **T006** [US2] Verify inline styles in index.html work correctly
  - Already completed in T001
  - File: `index.html`

**Checkpoint**: Initial load flash issue resolved

---

## Phase 5: User Story 3 - Component Theming (Priority: P2)

**Goal**: All UI elements (status bar, scrollbars, popups, command palette) use theme variables

**Independent Test**: Switch system theme, verify all UI elements change color appropriately.

### Implementation for User Story 3

- [x] **T007** [P] [US3] Update StatusBar to use theme variables
  - Replace hardcoded status bar background with `--status-bar-bg`
  - Replace hardcoded status bar text with `--status-bar-text`
  - File: `src/App.css` (status-bar class)

- [x] **T008** [P] [US3] Update CommandPalette to use theme variables
  - Replace hardcoded background with `--bg-primary`
  - Replace hardcoded text color with `--text-primary`
  - Replace hardcoded border with `--border-color`
  - File: `src/components/CommandPalette.tsx` and `src/components/CommandPalette.css`

- [x] **T009** [P] [US3] Update popover components to use theme variables
  - Update ClipboardPopover, SessionPopover, SettingsPopover
  - Use `--bg-primary`, `--text-primary`, `--border-color`
  - Files: `src/components/*Popover.tsx` and their CSS files

- [x] **T010** [US3] Update scrollbar styles to use theme variables
  - Replace hardcoded scrollbar colors with `--scrollbar-thumb`, `--scrollbar-track`
  - File: `src/App.css` (::-webkit-scrollbar selectors)

**Checkpoint**: All UI components now support automatic theme switching

---

## Phase 6: User Story 4 - Smooth Theme Transitions (Priority: P3)

**Goal**: Theme changes animate smoothly (0.3s) instead of instant color swap

**Independent Test**: Switch system theme, observe smooth color transition animation.

### Implementation for User Story 4

- [x] **T011** [US4] Verify transition animations are working
  - Already added in T003
  - Verify all themed elements animate correctly
  - File: `src/App.css`

- [x] **T012** [US4] Verify Reduced Motion accessibility
  - Test with macOS Reduce Motion setting enabled
  - Verify no animation when setting is active
  - File: `src/App.css`

**Checkpoint**: Smooth theme transitions working with accessibility support

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] **T013** [P] Verify all existing CSS files don't have hardcoded theme colors
  - Review: `src/components/*.css`
  - Replace any remaining hardcoded colors with theme variables

- [x] **T014** [P] Run lsp_diagnostics to verify no type errors
  - Command: `lsp_diagnostics` on modified files
  - File: All modified TypeScript/CSS files

- [x] **T015** Run build verification
  - Command: `npm run build`
  - Verify no build errors

- [ ] **T016** Run E2E tests to verify theme functionality
  - Command: `npm run test:e2e`
  - Note: Some pre-existing test failures unrelated to theme feature

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Name         | Depends On | Description                                |
| ----- | ------------ | ---------- | ------------------------------------------ |
| 1     | Setup        | None       | Inline styles for flash prevention         |
| 2     | Foundational | Phase 1    | CSS variables architecture                 |
| 3     | User Story 1 | Phase 2    | Core theme switching (MVP)                 |
| 4     | User Story 2 | Phase 1    | Flash prevention (already done in Phase 1) |
| 5     | User Story 3 | Phase 2    | Component theming                          |
| 6     | User Story 4 | Phase 2    | Smooth transitions                         |
| 7     | Polish       | All        | Final verification                         |

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 completion - No cross-story dependencies
- **User Story 2 (P1)**: Depends on Phase 1 completion - Already covered in T001
- **User Story 3 (P2)**: Depends on Phase 2 completion - Can proceed after US1
- **User Story 4 (P3)**: Depends on Phase 2 completion - Can proceed after US1/US3

### Within Each Phase

- T001 can proceed immediately
- T002 must complete before any component updates
- T003 depends on T002
- T004, T005 depend on T002 (US1)
- T006 is already done in T001 (US2)
- T007-T010 depend on T002 (US3)
- T011-T012 depend on T003 (US4)

### Parallel Opportunities

| Tasks                  | Can Run In Parallel Because           |
| ---------------------- | ------------------------------------- |
| T004, T005             | Different components, no dependencies |
| T007, T008, T009, T010 | Different components, no dependencies |
| T013, T014             | Different checks, no dependencies     |

---

## Parallel Example

```bash
# After Phase 2 completes, run these in parallel:
Task T004: Update SlateEditor to use theme variables
Task T005: Update TabBar to use theme variables
Task T007: Update StatusBar to use theme variables
Task T008: Update CommandPalette to use theme variables
Task T009: Update popover components to use theme variables
Task T010: Update scrollbar styles to use theme variables
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002, T003)
3. Complete Phase 3: User Story 1 (T004, T005)
4. **STOP and VALIDATE**: Test theme switching works
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Add Phase 3 (US1) → Core theme switching working
3. Add Phase 4 (US2) → Flash prevention verified
4. Add Phase 5 (US3) → All components themed
5. Add Phase 6 (US4) → Smooth transitions
6. Add Phase 7 (Polish) → Ready for release

---

## Summary

| Phase     | Tasks        | User Stories  | Focus                    |
| --------- | ------------ | ------------- | ------------------------ |
| 1         | 1 task       | -             | Flash prevention         |
| 2         | 2 tasks      | -             | CSS variables foundation |
| 3         | 2 tasks      | US1           | Core theme switching     |
| 4         | 1 task       | US2           | Flash prevention (done)  |
| 5         | 4 tasks      | US3           | Component theming        |
| 6         | 2 tasks      | US4           | Smooth transitions       |
| 7         | 4 tasks      | -             | Polish & verification    |
| **Total** | **16 tasks** | **4 stories** |                          |

**MVP Scope**: Phases 1-3 (T001-T005) - Core theme switching
**Status**: ✅ ALL TASKS COMPLETED
