# Roadmap: Tab Context Menu

## Overview

탭에서 마우스 오른쪽 버튼을 클릭하면 컨텍스트 메뉴가 표시되어 탭을 다른 그룹으로 이동하거나 탭 관련 작업을 수행할 수 있습니다. 순수 React로 구현하며, 기존 useWorkspace 훅과 tabGroups 도메인 모델을 확장합니다.

## Domain Expertise

None

## Phases

- [ ] **Phase 1: Foundation** - 컨텍스트 메뉴 컴포넌트 기본 구조
- [ ] **Phase 2: Core Actions** - 기본 탭 작업 (닫기, 복제)
- [ ] **Phase 3: Bulk Actions** - 대량 탭 작업 (다른 탭/오른쪽/왼쪽 닫기)
- [ ] **Phase 4: Group Move** - 그룹 이동 서브메뉴
- [ ] **Phase 5: Polish** - 접근성 및 E2E 테스트

## Phase Details

### Phase 1: Foundation
**Goal**: 탭 우클릭 시 컨텍스트 메뉴 표시, 기본 UI 및 위치 계산
**Depends on**: Nothing (first phase)
**Research**: Unlikely (순수 React 컴포넌트, 기존 CSS 패턴)
**Plans**: 3 plans

Plans:
- [ ] 01-01: ContextMenu 컴포넌트 생성 (위치 계산, 외부 클릭 닫기)
- [ ] 01-02: TabBar에 우클릭 이벤트 핸들러 추가
- [ ] 01-03: 메뉴 스타일링 (기존 CSS 패턴 적용)

### Phase 2: Core Actions
**Goal**: 기본 탭 작업 구현 (탭 닫기, 탭 복제)
**Depends on**: Phase 1
**Research**: Unlikely (기존 useWorkspace 훅 확장)
**Plans**: 2 plans

Plans:
- [ ] 02-01: 탭 닫기 기능 (closeTab 액션)
- [ ] 02-02: 탭 복제 기능 (duplicateTab 액션 추가)

### Phase 3: Bulk Actions
**Goal**: 대량 탭 작업 구현 (다른 탭 모두 닫기, 오른쪽/왼쪽 탭 닫기)
**Depends on**: Phase 2
**Research**: Unlikely (기존 패턴 확장)
**Plans**: 2 plans

Plans:
- [ ] 03-01: 다른 탭 모두 닫기 (closeOtherTabs 액션)
- [ ] 03-02: 오른쪽/왼쪽 탭 닫기 (closeTabsToRight/Left 액션)

### Phase 4: Group Move
**Goal**: 탭을 다른 그룹으로 이동하는 서브메뉴 구현
**Depends on**: Phase 3
**Research**: Unlikely (기존 tabGroups 모델 활용)
**Plans**: 3 plans

Plans:
- [ ] 04-01: 서브메뉴 컴포넌트 (호버 시 그룹 목록 표시)
- [ ] 04-02: moveTabToGroup 액션 추가
- [ ] 04-03: 그룹 색상 표시 및 현재 그룹 비활성화

### Phase 5: Polish
**Goal**: 접근성 및 테스트 완성
**Depends on**: Phase 4
**Research**: Unlikely (Playwright E2E 패턴 존재)
**Plans**: 2 plans

Plans:
- [ ] 05-01: 키보드 네비게이션 (화살표 키, Enter, Escape)
- [ ] 05-02: E2E 테스트 작성 (e2e/context-menu.spec.ts)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Core Actions | 0/2 | Not started | - |
| 3. Bulk Actions | 0/2 | Not started | - |
| 4. Group Move | 0/3 | Not started | - |
| 5. Polish | 0/2 | Not started | - |
