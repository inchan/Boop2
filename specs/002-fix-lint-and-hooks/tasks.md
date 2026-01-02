# Implementation Tasks: 린트 오류 수정 및 Git Hooks 도입

**Reference**: [plan.md](./plan.md)

## Status Check

- [x] ESLint 오류/경고 원인 파악 및 수정 경로 결정
- [x] React/DOM 글로벌 정의 추가 등 lint no-undef 수정
- [x] react-hooks set-state-in-effect 및 cleanup 경고 해결
- [x] 커밋/푸시/릴리즈 전 자동 lint 실행 훅 구성
- [x] lint 재실행 및 결과 확인

## Phase 1: Lint Fixes

### Task 1.1: Global definitions in `eslint.config.js`

- [x] Add `HTMLDivElement`, `DOMException`, `Worker`, `ErrorEvent` to globals.
- [x] Ensure `React` is recognized or correctly imported.

### Task 1.2: `SlateEditor.tsx` fixes

- [x] Wrap `setLineCount` and `setActiveLine` in `setTimeout` to avoid cascading renders.
- [x] Fix `React` is not defined error.

### Task 1.3: Hook fixes

- [x] Refactor `useSessions` and `useSettings` to use lazy state initialization.
- [x] Copy Ref to local variable in `useTabs` cleanup to satisfy `exhaustive-deps`.

## Phase 2: Git Hooks Setup

### Task 2.1: Dependency installation

- [x] Install `simple-git-hooks` and `lint-staged`.

### Task 2.2: Configuration

- [x] Add `simple-git-hooks` config to `package.json`.
- [x] Add `lint-staged` config for `.ts`, `.tsx` files.
- [x] Add `prepare` script.

### Task 2.3: Activation

- [x] Run `npx simple-git-hooks` to set up actual Git hooks.

## Verification

- [x] Run `npm run lint` and confirm 0 errors.
- [x] Perform a mock commit to test `lint-staged`.
- [x] Perform a mock push to test `pre-push` lint.
