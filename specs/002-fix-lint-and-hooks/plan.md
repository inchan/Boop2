# Implementation Plan: 린트 오류 수정 및 Git Hooks 도입

**Branch**: `main` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)

## Summary

현재 발생 중인 19개의 ESLint 오류(17개 에러, 2개 경고)를 수정하고, 향후 코드 품질을 강제하기 위해 `simple-git-hooks`와 `lint-staged`를 도입한다.

## Technical Context

- **Language/Version**: TypeScript 5.8, React 19.1
- **Primary Dependencies**: ESLint 9.x, simple-git-hooks, lint-staged
- **Testing**: npm run lint
- **Constraints**: 렌더링 사이클 내에서의 직접적인 `setState` 호출 방지

## Constitution Check

| 원칙                     | 상태    | 근거                                                 |
| ------------------------ | ------- | ---------------------------------------------------- |
| I. Simplicity First      | ✅ PASS | 라이트웨이트 훅 라이브러리(`simple-git-hooks`) 사용. |
| II. Performance          | ✅ PASS | `lint-staged`를 통한 변경 파일 한정 검사.            |
| III. Accessibility       | ✅ PASS | 해당 없음.                                           |
| IV. Script Compatibility | ✅ PASS | 기존 스크립트 실행 로직에 영향 없음.                 |
| V. Test-Driven Quality   | ✅ PASS | 품질 보증 시스템 자체를 구축하는 작업임.             |
| VI. Cross-Platform       | ✅ PASS | 모든 개발 환경에서 동일하게 동작.                    |
| VII. Security            | ✅ PASS | 의존성 보안 및 린트 룰 강화.                         |

## Project Structure

### Documentation

```text
specs/002-fix-lint-and-hooks/
├── spec.md
├── plan.md
└── tasks.md
```

### Affected Files

- `eslint.config.js`: 글로벌 변수 추가 및 설정 보강
- `package.json`: 훅 관련 스크립트 및 설정 추가
- `src/components/SlateEditor.tsx`: 상태 업데이트 로직 수정
- `src/hooks/*.ts`: 훅 내부의 `setState` 호출 시점 조정

## Implementation Strategy

1. **Global Definitions**: ESLint가 `HTMLDivElement`, `DOMException` 등을 인식하도록 전역 변수 설정.
2. **State Updates**: `useEffect` 내의 동기적 `setState`를 `setTimeout` 또는 초기화 시점으로 이동.
3. **Ref Safety**: Cleanup 함수에서 Ref 접근 시 복사본 사용 (`exhaustive-deps` 경고 해결).
4. **Hooks Integration**: `prepare` 스크립트를 통한 훅 자동 설치.
