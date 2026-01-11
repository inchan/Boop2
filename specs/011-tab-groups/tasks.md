# Tasks: 탭 그룹(Chrome 스타일) 지원

**Input**: Design documents from `/specs/011-tab-groups/`
**Prerequisites**: spec.md
**Tests**: Vitest(unit) + Playwright(E2E) 권장

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능(서로 다른 파일/영역, 의존성 없음)
- **[Story]**: US1..US5
- 모든 설명에 정확한 파일 경로 포함

---

## Phase 0: Alignment (필수 합의)
- [ ] T000 [US1] UI/UX 플로우 확정(그룹 생성/편집 진입) in `src/components/TabBar.tsx`

---

## Phase 1: Domain & Storage (Blocking)
**Purpose**: 그룹 기능의 규칙/데이터/마이그레이션을 안정적으로 정의

- [ ] T101 [P] [US4] 도메인 모델/유틸 작성 in `src/lib/tabGroups.ts`
- [ ] T102 [P] [US4] 도메인 유닛 테스트 작성(TDD) in `src/lib/tabGroups.test.ts`
- [ ] T103 [US4] 기존 탭 배열(v3) → WorkspaceSnapshot v1 마이그레이션 로직 확정 in `src/lib/tabGroups.ts`
- [ ] T104 [US3] 접힘 상태 영속 규칙(저장 키/저장 시점) 정의 및 테스트 추가 in `src/lib/tabGroups.test.ts`

**Checkpoint**: 도메인/마이그레이션 테스트 통과

---

## Phase 2: App State Integration (Blocking)
**Purpose**: 기존 탭 상태를 그룹 스키마로 전환하고 저장

- [ ] T201 [US4] Tab 타입에 groupId 반영(타입 이동/정리 포함) in `src/components/TabBar.tsx`
- [ ] T202 [US4] 초기 로드 시 스냅샷 normalize 적용 및 상태 구성 in `src/App.tsx`
- [ ] T203 [US4] 저장 포맷을 WorkspaceSnapshot v1로 변경(기존 키 유지/대체 결정) in `src/App.tsx`
- [ ] T204 [US2] 탭 생성 시 기본 그룹 할당 in `src/App.tsx`

**Checkpoint**: 앱 실행 시 기존 데이터가 깨지지 않고 로드됨

---

## Phase 3: TabBar UI - 그룹 렌더링/접기/색상 (P1)
**Purpose**: 사용자에게 그룹 단위를 시각적으로 제공

- [ ] T301 [P] [US3] TabBar에 그룹 헤더/접기 토글 UI 추가 in `src/components/TabBar.tsx`
- [ ] T302 [P] [US3] 그룹 헤더/탭 스타일(CSS) 추가 in `src/components/TabBar.css`
- [ ] T303 [US3] 접기 상태 변경 시 스냅샷 업데이트/영속 저장 연결 in `src/App.tsx`
- [ ] T304 [US1] 그룹 색상 UI(팔레트) + 저장 연결 in `src/components/TabBar.tsx`

**Checkpoint**: 그룹이 표시되고 접힘/색상이 저장됨

---

## Phase 4: 그룹 생성/이름 변경/삭제 (P1)
**Purpose**: 수동 그룹핑의 핵심 조작 제공

- [ ] T401 [US1] 그룹 생성 액션(UI) 추가 in `src/components/TabBar.tsx`
- [ ] T402 [US1] 그룹 이름 변경 UI(인라인 편집 또는 다이얼로그) 추가 in `src/components/TabBar.tsx`
- [ ] T403 [US4] 그룹 삭제 액션 + 기본 그룹으로 탭 이동 처리 in `src/App.tsx`

**Checkpoint**: 그룹 CRUD(기본 그룹 제외) 동작

---

## Phase 5: 탭을 그룹으로 이동(수동) (P1)
**Purpose**: 같은 주제끼리 묶기

- [ ] T501 [US2] 탭 컨텍스트 메뉴(또는 드롭다운)로 그룹 이동 UI 추가 in `src/components/TabBar.tsx`
- [ ] T502 [US2] 그룹 이동 로직 연결 및 순서 정책(그룹 끝/특정 위치) 확정 in `src/lib/tabGroups.ts`

**Checkpoint**: 클릭 기반 그룹 이동 가능

---

## Phase 6: (가능하면) Drag & Drop (P2)
**Purpose**: 빠른 이동/정렬

- [ ] T601 [US5] DnD 설계(라이브러리/순서 정책/드롭 영역) 확정 in `src/components/TabBar.tsx`
- [ ] T602 [US5] 탭 DnD로 그룹 간 이동 구현 in `src/components/TabBar.tsx`
- [ ] T603 [US5] 탭 DnD로 그룹 내 재정렬 구현 in `src/components/TabBar.tsx`

---

## Phase 7: Tests (TDD/Regression)
- [ ] T701 [P] [US3] E2E: 그룹 접힘 상태 재시작/복원 유지 in `e2e/tab-groups.spec.ts`
- [ ] T702 [P] [US1] E2E: 그룹 생성/이름/색상 유지 in `e2e/tab-groups.spec.ts`
- [ ] T703 [P] [US4] E2E: 그룹 삭제 시 기본 그룹으로 이동 in `e2e/tab-groups.spec.ts`
- [ ] T704 [P] [US2] E2E: 탭을 그룹으로 이동(수동) in `e2e/tab-groups.spec.ts`
- [ ] T705 [P] [US5] E2E: DnD 이동/정렬(가능하면) in `e2e/tab-groups.spec.ts`

---

## Phase 8: Quality Gate
- [ ] T801 `npm test` 통과
- [ ] T802 `npm run lint` 통과
- [ ] T803 (선택) `npm run test:e2e` 통과

---

## Parallel Opportunities (협업 분담 예시)
- **Agent A (Domain/Storage)**: T101-T104, T202-T203
- **Agent B (UI/UX)**: T301-T304, T401-T402, T501
- **Agent C (DnD)**: T601-T603
- **Agent D (Tests)**: T701-T705
