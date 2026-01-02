# Implementation Plan: 에디터 탭 키 입력 지원

**Branch**: `001-fix-editor-tab` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-editor-tab/spec.md`

## Summary

에디터에서 Tab 키가 브라우저 기본 동작(포커스 이동)으로 처리되는 문제를 수정한다. Tab 키 입력 시 4개의 공백을 삽입하고, Shift+Tab 시 줄 시작의 들여쓰기를 제거한다. 여러 줄 선택 시에도 일괄 들여쓰기/내어쓰기를 지원한다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1
**Primary Dependencies**: Slate 0.120.0, slate-react, slate-history
**Storage**: N/A (에디터 상태는 메모리에서 관리)
**Testing**: Vitest (단위 테스트), Playwright (E2E)
**Target Platform**: macOS, Windows, Linux (Tauri 2.0)
**Project Type**: Single (Tauri desktop app)
**Performance Goals**: Tab 키 응답 100ms 이내 (1000줄 기준)
**Constraints**: 메인 스레드에서 실행, UI 프리징 금지
**Scale/Scope**: 단일 컴포넌트 수정 (SlateEditor.tsx)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 근거 |
|------|------|------|
| I. Simplicity First | ✅ PASS | 기존 handleKeyDown에 Tab 처리 추가만 필요. 새 추상화 없음. |
| II. Performance | ✅ PASS | Tab 삽입은 동기 연산으로 100ms 미만. Worker 불필요. |
| III. Accessibility | ✅ PASS | Tab 키 들여쓰기는 키보드 접근성 향상. |
| IV. Script Compatibility | ✅ PASS | 스크립트 API 변경 없음. |
| V. Test-Driven Quality | ✅ PASS | Tab 동작은 핵심 에디터 기능이므로 테스트 추가. |
| VI. Cross-Platform | ✅ PASS | Tab 키는 모든 플랫폼에서 동일하게 동작. |
| VII. Security | ✅ PASS | 스크립트 실행과 무관한 순수 UI 기능. |

**Result**: 모든 원칙 통과. Phase 0 진행 가능.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-editor-tab/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # N/A (상태 변경 없음)
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A (API 없음)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
└── components/
    └── SlateEditor.tsx    # 수정 대상

tests/
└── components/
    └── SlateEditor.test.tsx  # 테스트 추가
```

**Structure Decision**: 기존 SlateEditor.tsx의 handleKeyDown 함수에 Tab/Shift+Tab 처리 로직 추가. 새 파일 생성 불필요.

## Complexity Tracking

> **No violations detected. This section remains empty.**
