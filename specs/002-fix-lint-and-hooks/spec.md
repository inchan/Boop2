# Specification: 린트 오류 수정 및 Git Hooks 도입

**Status**: Completed | **Branch**: `main` (Implemented directly) | **Date**: 2026-01-02

## Summary

프로젝트의 코드 품질을 유지하고 협업 시 발생할 수 있는 잠재적 오류를 방지하기 위해, 현재 산재한 ESLint 오류 및 경고를 해결하고 커밋/푸시 전 자동으로 린트를 실행하는 시스템을 구축한다.

## User Scenarios

### Scenario 1: 커밋 시 자동 코드 수정

개발자가 코드를 수정하고 커밋을 시도할 때, `lint-staged`가 실행되어 변경된 파일에 대해 자동으로 `eslint --fix`와 `prettier --write`를 수행한다. 이를 통해 코딩 스타일 통일성과 기본적인 오류 수정을 자동화한다.

### Scenario 2: 푸시 전 전체 검증

개발자가 원격 저장소에 코드를 푸시하기 전, `pre-push` 훅이 트리거되어 프로젝트 전체의 `npm run lint`를 실행한다. 오류가 있을 경우 푸시가 중단되어 결함이 있는 코드가 공유되는 것을 방지한다.

## Functional Requirements

- **ESLint 오류 해결**: `no-undef` (React, DOM types), `react-hooks/set-state-in-effect` 등 모든 기존 린트 오류를 수정한다.
- **Git Hooks 설정**: `simple-git-hooks`를 사용하여 `pre-commit` 및 `pre-push` 이벤트를 가로챈다.
- **자동 수정 (Staged files)**: 커밋 대상 파일에 대해서만 린트 및 포맷팅을 실행하여 성능을 최적화한다.
- **전역 설정 업데이트**: `eslint.config.js`를 수정하여 브라우저 및 워커 환경의 전역 변수를 지원한다.

## Success Criteria

- `npm run lint` 실행 시 오류 및 경고가 발생하지 않아야 함.
- 커밋 시도 시 `lint-staged`가 정상적으로 동작함을 확인.
- 푸시 시도 시 전체 린트 체크가 수행되어야 함.
- 기존의 React 19 및 Tauri 2.0 환경과의 호환성이 유지되어야 함.

## Key Entities

- **ESLint Config**: `eslint.config.js`
- **Git Hooks Config**: `package.json` 내 `simple-git-hooks` 및 `lint-staged` 섹션
- **Editor Component**: `src/components/SlateEditor.tsx` (핵심 수정 대상)

## Assumptions

- 개발 환경에 Node.js 및 npm이 설치되어 있음.
- Git이 프로젝트에서 사용되고 있음.
