# Tasks: 투명도 설정 (Opacity Setting)

**Input**: Design documents from `/specs/005-opacity-setting/`
**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md
**Tech Stack**: TypeScript 5.x, React 19, Tauri 2.0, CSS Custom Properties

## Phase 1: Foundational - Settings Interface Update

**Purpose**: Add opacity field to the settings system that all user stories depend on

- [ ] T001 Add opacity field to Settings interface in src/hooks/useSettings.ts
  - Add `opacity: number` field (range: 10-100, default: 100)
  - Update DEFAULT_SETTINGS to include `opacity: 100`

- [ ] T002 Add --opacity CSS variable to src/App.css
  - Add `--opacity: 1` to :root
  - Apply `opacity: var(--opacity)` to background elements:
    - .slate-editor-container
    - .tab-bar-container
    - .status-bar

**Checkpoint**: Foundation ready - UI and persistence can now be implemented

---

## Phase 2: User Story 1 - Opacity Slider UI (Priority: P1) 🎯 MVP

**Goal**: Users can adjust opacity using a slider in the settings

**Independent Test**: Open settings, move slider, verify background transparency changes in real-time

### Implementation for User Story 1

- [ ] T003 [US1] Add opacity slider to SettingsPopover.tsx
  - Add range input with min="10" max="100"
  - Display current opacity value as percentage
  - Call updateSettings with new opacity value on change
  - File: `src/components/SettingsPopover.tsx`

- [ ] T004 [US1] Add slider styling to SettingsPopover.css
  - Style the range input
  - Position slider properly in settings layout
  - File: `src/components/SettingsPopover.css`

**Checkpoint**: User Story 1 complete - opacity slider fully functional

---

## Phase 3: User Story 2 - Opacity Persistence (Priority: P1) 🎯

**Goal**: Opacity setting is saved and restored across app restarts

**Independent Test**: Change opacity to 70%, restart app, verify setting is preserved

### Implementation for User Story 2

- [ ] T005 [US2] Verify opacity persistence in useSettings.ts
  - Confirm opacity is included in localStorage serialization
  - Confirm opacity is loaded from localStorage on app start
  - File: `src/hooks/useSettings.ts`

**Note**: This functionality is already handled by the existing useSettings hook. T001 ensures opacity is saved.

**Checkpoint**: User Story 2 complete - opacity setting persists across restarts

---

## Phase 4: User Story 3 - Opacity Reset (Priority: P2)

**Goal**: Users can reset opacity to default (100%) with one click

**Independent Test**: Set opacity to 30%, click reset button, verify opacity returns to 100%

### Implementation for User Story 3

- [ ] T006 [US3] Add reset button to SettingsPopover.tsx
  - Add "Reset to Default" button
  - Button calls updateSettings({ opacity: 100 })
  - File: `src/components/SettingsPopover.tsx`

**Checkpoint**: User Story 3 complete - reset functionality working

---

## Phase 5: User Story 4 - Theme Interaction (Priority: P2)

**Goal**: Opacity works correctly with light/dark theme changes

**Independent Test**: Set opacity to 50%, switch system theme, verify opacity remains at 50%

### Implementation for User Story 4

- [ ] T007 [US4] Verify opacity works with theme variables
  - Confirm --opacity variable is independent of theme
  - Confirm background elements use both theme colors and opacity
  - File: `src/App.css`

**Note**: This is already handled by the CSS structure in Phase 1. The opacity variable works independently of theme colors.

**Checkpoint**: User Story 4 complete - opacity and theme work together

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [ ] T008 [P] Run build verification
  - Command: `npm run build`
  - Verify no build errors

- [ ] T009 [P] Run lsp_diagnostics on modified files
  - Command: `lsp_diagnostics` on TypeScript files
  - Verify no type errors

- [ ] T010 Run E2E tests
  - Command: `npm run test:e2e`
  - Verify all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Name         | Depends On       | Description                   |
| ----- | ------------ | ---------------- | ----------------------------- |
| 1     | Foundational | None             | Settings interface & CSS      |
| 2     | User Story 1 | Phase 1          | Slider UI                     |
| 3     | User Story 2 | Phase 1          | Persistence (automatic)       |
| 4     | User Story 3 | Phase 1, Phase 2 | Reset button                  |
| 5     | User Story 4 | Phase 1          | Theme interaction (automatic) |
| 6     | Polish       | All              | Verification                  |

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 1 completion
- **User Story 2 (P1)**: Depends on Phase 1 completion (automatic via useSettings)
- **User Story 3 (P2)**: Depends on Phase 1 and Phase 2 completion
- **User Story 4 (P2)**: Depends on Phase 1 completion (automatic)

### Parallel Opportunities

| Tasks      | Can Run In Parallel Because   |
| ---------- | ----------------------------- |
| T003, T004 | Different files (TSX and CSS) |
| T008, T009 | Different checks              |

---

## Parallel Example

```bash
# After Phase 1 completes, run these in parallel:
Task T003: Add opacity slider to SettingsPopover.tsx
Task T004: Add slider styling to SettingsPopover.css
Task T005: Verify opacity persistence (code review)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (T001, T002)
2. Complete Phase 2: User Story 1 (T003, T004)
3. **STOP and VALIDATE**: Test opacity slider
4. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 → Foundation ready
2. Add Phase 2 (US1) → Slider works (MVP!)
3. Add Phase 3 (US2) → Persistence works
4. Add Phase 4 (US3) → Reset works
5. Add Phase 5 (US4) → Theme interaction works
6. Add Phase 6 (Polish) → Ready for release

---

## Summary

| Phase     | Tasks        | User Stories  | Focus                         |
| --------- | ------------ | ------------- | ----------------------------- |
| 1         | 2 tasks      | -             | Settings interface & CSS      |
| 2         | 2 tasks      | US1           | Opacity slider UI             |
| 3         | 1 task       | US2           | Persistence (automatic)       |
| 4         | 1 task       | US3           | Reset button                  |
| 5         | 1 task       | US4           | Theme interaction (automatic) |
| 6         | 3 tasks      | -             | Polish & verification         |
| **Total** | **10 tasks** | **4 stories** |                               |

**MVP Scope**: Phases 1-2 (T001-T004) - Opacity slider working
