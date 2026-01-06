# Implementation Plan: Fix Tab-Specific Undo History

**Branch**: `010-fix-tab-undo` | **Date**: 2025-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-fix-tab-undo/spec.md`

## Summary

현재 SlateEditor 컴포넌트가 단일 에디터 인스턴스를 사용하여 모든 탭이 같은 Undo/Redo 히스토리를 공유하는 버그 수정. 탭별로 독립적인 에디터 인스턴스 또는 히스토리 상태를 관리하여 각 탭의 Undo/Redo가 독립적으로 동작하도록 함.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1
**Primary Dependencies**: Slate.js 0.120, slate-history 0.113.1, slate-react 0.120
**Storage**: N/A (in-memory state only)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: macOS/Linux/Windows (Tauri 2.0 desktop app)
**Project Type**: single (Tauri + React frontend)
**Performance Goals**: 탭 전환 시 즉각 반응, Undo/Redo 지연 없음
**Constraints**: 히스토리 깊이 100/탭, 메모리 누수 방지
**Scale/Scope**: 최대 10개 탭 동시 지원

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution이 기본 템플릿 상태이므로 특정 제약 없음. 기본 원칙 준수:
- ✅ 기존 코드 구조 유지 (SlateEditor 컴포넌트 수정)
- ✅ 테스트 작성 (Vitest + Playwright)
- ✅ 단순한 해결책 우선 (복잡한 상태 관리 라이브러리 불필요)

## Project Structure

### Documentation (this feature)

```text
specs/010-fix-tab-undo/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── SlateEditor.tsx  # 주요 수정 대상
├── App.tsx              # 탭 관리 로직
└── hooks/               # 잠재적 커스텀 훅 위치

tests/
├── unit/                # Vitest 단위 테스트
└── e2e/                 # Playwright E2E 테스트
```

**Structure Decision**: 기존 구조 유지. SlateEditor.tsx 수정 + 필요시 히스토리 관리 훅 추가.

## Complexity Tracking

해당 없음 - Constitution 위반 사항 없음

## Phase Outputs

### Phase 0: Research ✅

- **Output**: [research.md](./research.md)
- **Decision**: 탭별 에디터 인스턴스 방식 (Option A) 선택
- **Rationale**: 완전한 상태 분리, 히스토리 보존 요구사항 충족

### Phase 1: Design ✅

- **Data Model**: [data-model.md](./data-model.md)
- **Quickstart**: [quickstart.md](./quickstart.md)
- **Contracts**: N/A (UI 버그 수정, API 없음)

### Constitution Re-check (Post-Design)

- ✅ 기존 코드 구조 유지
- ✅ 테스트 계획 포함
- ✅ 단순한 해결책 (Map으로 에디터 인스턴스 관리)
- ✅ 메모리 관리 고려 (탭 닫기 시 정리)

## Implementation Summary

### 핵심 변경

1. **App.tsx**: `editorsRef` (Map<string, Editor>) 추가, `getOrCreateEditor` 함수
2. **SlateEditor.tsx**: `editor` prop 추가, 내부 useState 제거
3. **탭 닫기**: `editorsRef.current.delete(tabId)` 호출

### 파일별 예상 변경량

| 파일 | 추가 | 수정 | 삭제 |
|------|-----|------|------|
| App.tsx | ~20줄 | ~5줄 | 0줄 |
| SlateEditor.tsx | ~5줄 | ~10줄 | ~5줄 |
| E2E 테스트 | ~50줄 | 0줄 | 0줄 |
