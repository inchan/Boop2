# Roadmap: Tab Context Menu

## Overview

탭에서 마우스 오른쪽 버튼을 클릭하면 컨텍스트 메뉴가 표시되어 탭을 다른 그룹으로 이동하거나 탭 관련 작업을 수행할 수 있습니다. 순수 React로 구현하며, 기존 useWorkspace 훅과 tabGroups 도메인 모델을 확장합니다.

## Domain Expertise

None

## Phases

- [x] **Phase 1: Foundation** - 컨텍스트 메뉴 컴포넌트 기본 구조
- [x] **Phase 2: Core Actions** - 기본 탭 작업 (닫기, 복제)
- [x] **Phase 3: Bulk Actions** - 대량 탭 작업 (다른 탭/오른쪽/왼쪽 닫기)
- [x] **Phase 4: Group Move** - 그룹 이동 서브메뉴
- [x] **Phase 5: Polish** - 접근성 및 키보드 네비게이션

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Foundation | Complete | 2025-01-12 |
| 2. Core Actions | Complete | 2025-01-12 |
| 3. Bulk Actions | Complete | 2025-01-12 |
| 4. Group Move | Complete | 2025-01-12 |
| 5. Polish | Complete | 2025-01-12 |

## Summary

모든 Phase 완료:
- ContextMenu 컴포넌트 (위치 계산, 외부 클릭/Escape 닫기)
- 탭 닫기/복제 기능
- 다른 탭 모두 닫기, 오른쪽/왼쪽 탭 닫기
- 그룹으로 이동 서브메뉴
- 키보드 네비게이션 (화살표 키, Enter)
- ARIA 접근성 속성
