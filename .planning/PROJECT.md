# Boop2 - Tab Context Menu

## What This Is

탭 컨텍스트 메뉴 기능 추가. 탭에서 마우스 오른쪽 버튼을 클릭하면 컨텍스트 메뉴가 표시되어 탭을 다른 그룹으로 이동하거나 탭 관련 작업을 수행할 수 있습니다.

## Core Value

**탭을 다른 그룹으로 쉽게 이동할 수 있어야 합니다.** 현재 탭 그룹 기능이 있지만 탭을 그룹 간 이동하는 직관적인 방법이 없습니다.

## Requirements

### Validated

- ✓ Multi-tab interface - existing
- ✓ Tab groups with colors - existing (`src/lib/tabGroups.ts`)
- ✓ Tab management via useWorkspace hook - existing (`src/hooks/useWorkspace.ts`)
- ✓ TabBar component - existing (`src/components/TabBar.tsx`)

### Active

- [ ] 탭 우클릭 시 컨텍스트 메뉴 표시
- [ ] 다른 그룹으로 탭 이동 (서브메뉴로 그룹 목록 표시)
- [ ] 탭 복제 기능
- [ ] 탭 닫기
- [ ] 다른 탭 모두 닫기
- [ ] 오른쪽 탭 모두 닫기
- [ ] 왼쪽 탭 모두 닫기

### Out of Scope

- 드래그 앤 드롭으로 탭 이동 — 별도 기능으로 추후 고려
- 그룹 생성/삭제/관리 — 기존 그룹 UI에서 처리
- 탭 이름 변경 — 현재 우선순위 아님

## Context

**기존 코드베이스:**
- `src/components/TabBar.tsx` - 탭바 UI 컴포넌트
- `src/hooks/useWorkspace.ts` - 탭/그룹 상태 관리 (320줄)
- `src/lib/tabGroups.ts` - Tab, TabGroup, WorkspaceSnapshot 도메인 모델

**기술 스택:**
- React 19.1.0 + TypeScript 5.8
- 순수 React 구현 권장 (외부 컨텍스트 메뉴 라이브러리 불필요)
- 기존 CSS 패턴 사용 (BEM 스타일, CSS Custom Properties)

**관련 테스트:**
- `src/lib/tabGroups.test.ts` - 도메인 모델 테스트
- `e2e/editor-tabs.spec.ts` - E2E 탭 테스트

## Constraints

- **순수 React**: 외부 컨텍스트 메뉴 라이브러리 없이 구현
- **기존 패턴 유지**: useWorkspace 훅 확장, 기존 CSS 패턴 사용
- **접근성**: 키보드 네비게이션 지원 (화살표 키, Enter, Escape)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 순수 React 구현 | 의존성 최소화, 기존 스타일 일관성 | — Pending |
| 서브메뉴로 그룹 선택 | 그룹이 여러 개일 때 UX 개선 | — Pending |

---
*Last updated: 2025-01-12 after initialization*
