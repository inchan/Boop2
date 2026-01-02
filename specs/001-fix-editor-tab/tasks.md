# Tasks: 에디터 탭 키 입력 지원

**Input**: Design documents from `/specs/001-fix-editor-tab/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Constitution V(Test-Driven Quality)에 따라 핵심 기능 테스트 포함

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup

**Purpose**: Import 추가 및 상수 정의

- [x] T001 Add Range and Node imports to src/components/SlateEditor.tsx
- [x] T002 Define INDENT constant ('    ') in src/components/SlateEditor.tsx

**Checkpoint**: 기본 설정 완료 ✅

---

## Phase 2: User Story 1 - 탭 키로 들여쓰기 (Priority: P1) 🎯 MVP

**Goal**: Tab 키를 눌러 4개 공백 삽입

**Independent Test**: 에디터에서 Tab 키 누르면 4개 공백이 삽입되는지 확인

### Implementation for User Story 1

- [x] T003 [US1] Add Tab key detection in handleKeyDown with event.preventDefault() in src/components/SlateEditor.tsx
- [x] T004 [US1] Implement single cursor indent (insertText INDENT) in src/components/SlateEditor.tsx
- [x] T005 [US1] Verify focus is maintained after Tab key press in src/components/SlateEditor.tsx

### Tests for User Story 1

- [x] T006 [US1] Add E2E test for Tab key inserting 4 spaces in e2e/editor-indent.spec.ts

**Checkpoint**: Tab 키 들여쓰기 동작. MVP 완료. ✅

---

## Phase 3: User Story 2 - Shift+Tab으로 내어쓰기 (Priority: P2)

**Goal**: Shift+Tab을 눌러 줄 시작의 들여쓰기 제거

**Independent Test**: 들여쓰기된 줄에서 Shift+Tab 누르면 4개 공백이 제거되는지 확인

### Implementation for User Story 2

- [x] T007 [US2] Add Shift+Tab detection in handleKeyDown in src/components/SlateEditor.tsx
- [x] T008 [US2] Implement outdent logic (remove up to 4 leading spaces) in src/components/SlateEditor.tsx
- [x] T009 [US2] Handle edge case: less than 4 spaces at line start in src/components/SlateEditor.tsx

### Tests for User Story 2

- [x] T010 [US2] Add E2E test for Shift+Tab removing leading spaces in e2e/editor-indent.spec.ts

**Checkpoint**: 내어쓰기 동작. Tab/Shift+Tab 단일 줄 완료. ✅

---

## Phase 4: User Story 3 - 여러 줄 선택 후 들여쓰기/내어쓰기 (Priority: P3)

**Goal**: 여러 줄 선택 시 일괄 들여쓰기/내어쓰기

**Independent Test**: 3줄 선택 후 Tab 누르면 3줄 모두 들여쓰기되는지 확인

### Implementation for User Story 3

- [x] T011 [US3] Check Range.isCollapsed to detect multi-line selection in src/components/SlateEditor.tsx
- [x] T012 [US3] Implement multi-line indent (loop through selected lines) in src/components/SlateEditor.tsx
- [x] T013 [US3] Implement multi-line outdent (loop through selected lines) in src/components/SlateEditor.tsx

### Tests for User Story 3

- [x] T014 [US3] Add E2E test for multi-line indent in e2e/editor-indent.spec.ts
- [x] T015 [US3] Add E2E test for multi-line outdent in e2e/editor-indent.spec.ts

**Checkpoint**: 여러 줄 들여쓰기/내어쓰기 완료. 모든 기능 구현. ✅

---

## Phase 5: Polish & Verification

**Purpose**: 최종 검증 및 엣지 케이스 처리

- [x] T016 Verify Undo/Redo works for indent operations (E2E test E-075 in e2e/editor-indent.spec.ts)
- [x] T017 Build verification passed (Vite build successful)
- [ ] T018 Manual testing per quickstart.md scenarios (dev server required)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup
- **User Story 2 (Phase 3)**: Depends on US1 (shares handleKeyDown structure)
- **User Story 3 (Phase 4)**: Depends on US1+US2 (extends indent/outdent for multi-line)
- **Polish (Phase 5)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - No dependencies on other stories
- **User Story 2 (P2)**: Builds on US1's Tab handling structure
- **User Story 3 (P3)**: Extends US1+US2 logic for multi-line case

### Within Each User Story

- Implementation tasks first
- Test tasks after implementation (verify behavior)

### Parallel Opportunities

- **Limited parallelism**: All tasks modify the same file (SlateEditor.tsx)
- T001 and T002 can run in parallel (different code locations)
- Test tasks (T006, T010, T014, T015) are in a different file and can be parallelized with next story's implementation

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: User Story 1 (T003-T006)
3. **STOP and VALIDATE**: Tab 키 들여쓰기 동작 확인
4. 이 시점에서 사용 가능한 기능 제공

### Incremental Delivery

1. Setup → US1 완료 → **MVP 배포 가능**
2. US2 추가 → Shift+Tab 내어쓰기 동작
3. US3 추가 → 여러 줄 선택 지원
4. Polish → 최종 검증

### Task Count Summary

| Phase | Task Count |
|-------|------------|
| Setup | 2 |
| US1 (P1) | 4 |
| US2 (P2) | 4 |
| US3 (P3) | 5 |
| Polish | 3 |
| **Total** | **18** |

---

## Notes

- 모든 구현 태스크는 동일 파일(SlateEditor.tsx) 수정
- 순차 실행 권장 (병렬 시 merge conflict 위험)
- 각 User Story 완료 후 테스트 실행으로 회귀 방지
- quickstart.md의 코드 스니펫 참조하여 구현
