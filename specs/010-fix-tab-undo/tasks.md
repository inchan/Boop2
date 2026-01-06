# Tasks: Fix Tab-Specific Undo History

**Input**: Design documents from `/specs/010-fix-tab-undo/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: E2E 테스트 포함 (spec의 Success Criteria 검증을 위해 필요)

**Organization**: User Story별로 그룹화하여 독립적인 구현 및 테스트 가능

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일 대상, 의존성 없어 병렬 실행 가능
- **[Story]**: 해당 태스크가 속한 User Story (US1, US2, US3)
- 모든 설명에 정확한 파일 경로 포함

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Source: `src/components/SlateEditor.tsx`, `src/App.tsx`
- E2E Tests: `tests/e2e/`

---

## Phase 1: Setup

**Purpose**: 변경 전 현재 상태 확인

- [x] T001 현재 SlateEditor.tsx 구조 확인 및 editor 인스턴스 생성 위치 파악

---

## Phase 2: Foundational (Core Implementation)

**Purpose**: 탭별 에디터 인스턴스 관리 - 모든 User Story의 기반

**⚠️ CRITICAL**: 이 단계 완료 전 User Story 검증 불가

### Implementation

- [x] T002 App.tsx에 탭별 에디터 인스턴스 맵 (editorsMap) 추가 in `src/App.tsx`
- [x] T003 App.tsx에 activeEditor useMemo 구현 in `src/App.tsx`
- [x] T004 SlateEditor.tsx props 인터페이스에 editor prop 추가 in `src/components/SlateEditor.tsx`
- [x] T005 SlateEditor.tsx에서 내부 useState editor 생성 제거, 외부 editor 사용으로 변경 in `src/components/SlateEditor.tsx`
- [x] T006 App.tsx에서 SlateEditor에 editor prop 전달 in `src/App.tsx`
- [x] T007 App.tsx handleCloseTab에서 에디터 인스턴스 정리 (setEditorsMap) in `src/App.tsx`

**Checkpoint**: 기본 구현 완료 - 탭별 에디터 인스턴스가 생성됨

---

## Phase 3: User Story 1 & 2 - Tab-Independent Undo/Redo (Priority: P1) 🎯 MVP

**Goal**: Cmd+Z/Cmd+Shift+Z가 현재 활성 탭의 히스토리에만 영향

**Independent Test**: 탭 1에서 편집 → 탭 2로 전환 → 탭 2에서 Cmd+Z → 탭 1 변경 없음 확인

### E2E Tests for US1 & US2

- [x] T008 [P] [US1] E2E 테스트: 탭 간 Undo 독립성 검증 in `e2e/tab-undo.spec.ts`
- [x] T009 [P] [US2] E2E 테스트: 탭 간 Redo 독립성 검증 in `e2e/tab-undo.spec.ts`

### Verification for US1 & US2

- [ ] T010 [US1] 수동 테스트: 탭 1 편집 → 탭 2 전환 → Cmd+Z → 탭 1 콘텐츠 유지 확인
- [ ] T011 [US2] 수동 테스트: 탭 1 Undo → 탭 2 전환 → 탭 1 복귀 → Cmd+Shift+Z 동작 확인

**Checkpoint**: US1 & US2 완료 - Undo/Redo가 탭별로 독립 동작

---

## Phase 4: User Story 3 - History Persistence (Priority: P2)

**Goal**: 탭 전환 후 돌아왔을 때 해당 탭의 히스토리 보존

**Independent Test**: 탭 1에서 A,B,C 입력 → 탭 2 전환 → 탭 1 복귀 → Cmd+Z 3회 → C,B,A 순 되돌림 확인

### E2E Tests for US3

- [x] T012 [P] [US3] E2E 테스트: 탭 전환 후 히스토리 보존 검증 in `e2e/tab-undo.spec.ts`

### Verification for US3

- [ ] T013 [US3] 수동 테스트: 여러 탭 간 전환 후 각 탭 히스토리 보존 확인

**Checkpoint**: US3 완료 - 탭 전환 시 히스토리 유지

---

## Phase 5: Edge Cases & Polish

**Purpose**: 엣지 케이스 처리 및 최종 검증

### Edge Case Implementation

- [x] T014 새 탭 생성 시 빈 히스토리로 시작 확인 (getOrCreateEditor가 이미 처리)
- [x] T015 스크립트 실행 후 탭별 히스토리 독립성 유지 검증 in `src/App.tsx`

### E2E Tests for Edge Cases

- [x] T016 [P] E2E 테스트: 빈 탭에서 Undo 무영향 검증 in `e2e/tab-undo.spec.ts`
- [x] T017 [P] E2E 테스트: 5개 탭 시나리오 독립성 검증 in `e2e/tab-undo.spec.ts`

### Final Verification

- [x] T018 npm run lint 실행 및 오류 수정
- [x] T019 npm run test 실행 및 기존 테스트 통과 확인
- [x] T020 npm run test:e2e 실행 및 새 E2E 테스트 통과 확인
- [x] T021 quickstart.md 검증 체크리스트 수행

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 - 모든 User Story 차단
- **US1 & US2 (Phase 3)**: Foundational 완료 후
- **US3 (Phase 4)**: Foundational 완료 후 (US1/US2와 병렬 가능하나, 동일 구현이므로 순차)
- **Polish (Phase 5)**: 모든 User Story 완료 후

### Task Dependencies

```
T001 → T002 → T003 → T006
         ↓
       T004 → T005
         ↓
       T007
         ↓
    (Phase 3-4 가능)
```

### Parallel Opportunities

Phase 2 내:
- T004, T005는 SlateEditor.tsx 대상 - 순차 실행
- T002, T003, T006, T007은 App.tsx 대상 - 순차 실행

Phase 3 내:
- T008, T009는 동일 테스트 파일이나 독립적인 테스트 케이스 - 병렬 가능

Phase 5 내:
- T016, T017는 병렬 실행 가능 (독립적인 테스트 케이스)

---

## Parallel Example: E2E Tests

```bash
# 모든 E2E 테스트 병렬 실행:
Task: "E2E 테스트: 탭 간 Undo 독립성 검증 in tests/e2e/tab-undo.spec.ts"
Task: "E2E 테스트: 탭 간 Redo 독립성 검증 in tests/e2e/tab-undo.spec.ts"
Task: "E2E 테스트: 탭 전환 후 히스토리 보존 검증 in tests/e2e/tab-undo.spec.ts"
```

---

## Implementation Strategy

### MVP First (US1 & US2)

1. Phase 1 완료: Setup
2. Phase 2 완료: Foundational (핵심 구현)
3. Phase 3 완료: US1 & US2 검증
4. **STOP and VALIDATE**: Undo/Redo 독립성 수동 테스트
5. 배포 가능한 버그 수정 완료

### Full Implementation

1. MVP 완료 후
2. Phase 4: US3 검증 (이미 구현됨, 테스트만 추가)
3. Phase 5: Edge cases 및 최종 검증
4. 릴리스 준비 완료

---

## Notes

- 이 기능은 버그 수정으로, 모든 User Story가 단일 구현(탭별 에디터 인스턴스)으로 해결됨
- US1, US2, US3는 동일 구현의 다른 측면을 검증
- E2E 테스트는 회귀 방지를 위해 필수
- 커밋은 Phase 완료 후 또는 논리적 그룹 완료 후 수행
