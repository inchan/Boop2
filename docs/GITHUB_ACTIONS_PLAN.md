# GitHub Actions CI/CD 구현 계획

> **생성일**: 2025-12-26
> **목표**: Boop2 프로젝트에 완전한 CI/CD 파이프라인 구축
> **범위**: 코드 품질 검사, 테스트 자동화, 멀티플랫폼 빌드, 릴리스 자동화

---

## 📋 프로젝트 현황 분석

### 기술 스택
- **Frontend**: React 19.1.0, TypeScript 5.8.3, Vite 7.0.4, CodeMirror 6
- **Backend**: Tauri 2, Rust (edition 2021)
- **테스트**: vitest 4.0.16 (3개의 테스트 파일 존재)
- **빌드**: `tsc && vite build` + `tauri build`

### 현재 부족한 부분
- ❌ ESLint 설정 없음
- ❌ Prettier 설정 없음
- ❌ GitHub Actions 워크플로우 없음
- ❌ vitest 설정 파일 없음 (vite.config.ts에 통합 필요)

### 참고 자료
- [Tauri v2 GitHub Actions 공식 가이드](https://v2.tauri.app/distribute/pipelines/github/)
- [tauri-apps/tauri-action](https://github.com/tauri-apps/tauri-action)

---

## 🎯 구현 목표

### 1. CI (Continuous Integration)
- Pull Request/Push 시 자동 코드 품질 검사
- 멀티플랫폼 빌드 검증 (Linux, macOS, Windows)
- 테스트 자동 실행

### 2. CD (Continuous Deployment)
- 태그 생성 시 자동 릴리스
- 멀티플랫폼 바이너리 자동 빌드
- GitHub Release 자동 생성 및 아티팩트 업로드

---

## 📝 구현 계획 체크리스트

### Phase 1: 기본 설정 파일 추가

#### 1.1 ESLint 설정
- [ ] `.eslintrc.js` 생성
  - TypeScript 파서 설정 (`@typescript-eslint/parser`)
  - React 플러그인 활성화 (`eslint-plugin-react`)
  - 권장 규칙 세트 적용
  - CodeMirror 관련 특수 규칙 추가
- [ ] 필요한 패키지 설치
  ```bash
  npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks
  ```
- [ ] `package.json`에 스크립트 추가
  ```json
  "lint": "eslint src --ext .ts,.tsx",
  "lint:fix": "eslint src --ext .ts,.tsx --fix"
  ```

#### 1.2 Prettier 설정
- [ ] `.prettierrc` 생성
  - 탭 너비 2칸
  - 세미콜론 사용
  - 싱글 쿼트 사용
  - 줄 길이 100자
- [ ] `.prettierignore` 생성
  - `node_modules`, `dist`, `src-tauri/target` 제외
- [ ] 필요한 패키지 설치
  ```bash
  npm install --save-dev prettier eslint-config-prettier
  ```
- [ ] `package.json`에 스크립트 추가
  ```json
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
  "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
  ```

#### 1.3 vitest 설정
- [ ] `vite.config.ts`에 vitest 설정 추가
  ```typescript
  import { defineConfig } from 'vite'

  export default defineConfig({
    // 기존 설정...
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts', // 필요 시
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html']
      }
    }
  })
  ```
- [ ] 필요한 패키지 설치 확인 (이미 설치됨)
  - `vitest` ✓
  - `@vitest/ui` (선택 사항)
- [ ] `package.json`에 스크립트 추가/확인
  ```json
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
  ```

#### 1.4 Rust 코드 품질 도구 확인
- [ ] `cargo fmt` 동작 확인
- [ ] `cargo clippy` 동작 확인
- [ ] `cargo test` 동작 확인 (Rust 테스트 있는 경우)

---

### Phase 2: CI 워크플로우 생성

#### 2.1 디렉토리 구조 생성
- [ ] `.github/workflows/` 디렉토리 생성

#### 2.2 CI 워크플로우 파일 생성 (`.github/workflows/ci.yml`)
- [ ] 워크플로우 트리거 설정
  - `push` (main, dev 브랜치)
  - `pull_request` (main, dev 브랜치)

- [ ] **Frontend 검사 Job**
  - [ ] Node.js LTS 설정 (`actions/setup-node@v4`)
  - [ ] 의존성 캐싱 (`npm ci`)
  - [ ] TypeScript 타입 체크 (`tsc --noEmit`)
  - [ ] ESLint 실행 (`npm run lint`)
  - [ ] Prettier 체크 (`npm run format:check`)
  - [ ] vitest 실행 (`npm run test`)

- [ ] **Backend 검사 Job**
  - [ ] Rust 툴체인 설정 (`dtolnay/rust-toolchain@stable`)
  - [ ] Rust 캐시 설정 (`swatinem/rust-cache@v2`)
  - [ ] `cargo fmt --check` 실행
  - [ ] `cargo clippy -- -D warnings` 실행
  - [ ] `cargo test` 실행 (테스트 있는 경우)

- [ ] **빌드 검증 Job** (멀티플랫폼 매트릭스)
  - [ ] 매트릭스 설정
    - Ubuntu 22.04 (x64)
    - macOS (latest, ARM + x64)
    - Windows (latest)
  - [ ] 각 플랫폼에서 빌드 테스트 (`npm run build`)
  - [ ] Tauri 빌드 검증 (단, 릴리스 아티팩트는 생성하지 않음)

#### 2.3 워크플로우 권한 설정
- [ ] GitHub 프로젝트 설정에서 Actions 권한 확인
  - Settings > Actions > Workflow permissions
  - "Read and write permissions" 활성화

---

### Phase 3: Release 워크플로우 생성

#### 3.1 Release 워크플로우 파일 생성 (`.github/workflows/release.yml`)
- [ ] 워크플로우 트리거 설정
  - `push` (tags: `v*.*.*` 패턴)
  - `workflow_dispatch` (수동 실행 옵션)

- [ ] **멀티플랫폼 빌드 매트릭스**
  - [ ] 플랫폼 설정
    - `ubuntu-22.04` (Linux x64)
    - `ubuntu-22.04-arm` (Linux ARM - 공개 저장소만)
    - `macos-latest` (macOS x64 + ARM)
    - `windows-latest` (Windows x64)

- [ ] **빌드 단계**
  - [ ] Repository checkout (`actions/checkout@v4`)
  - [ ] Node.js LTS 설정 + 캐싱 (`actions/setup-node@v4`)
  - [ ] Rust 툴체인 설정 (`dtolnay/rust-toolchain@stable`)
  - [ ] Rust 캐시 (`swatinem/rust-cache@v2`)
  - [ ] 의존성 설치 (`npm ci`)
  - [ ] Frontend 빌드 (`npm run build`)

- [ ] **Tauri 빌드 & 릴리스**
  - [ ] `tauri-apps/tauri-action@v0` 사용
  - [ ] 입력 파라미터 설정
    - `tagName`: Git 태그 이름
    - `releaseName`: `Boop2 v__VERSION__`
    - `releaseBody`: 릴리스 노트 (자동 생성)
    - `releaseDraft`: `false`
    - `prerelease`: `false`
  - [ ] 자동 생성될 아티팩트
    - macOS: `.dmg`, `.app.tar.gz`
    - Linux: `.AppImage`, `.deb`
    - Windows: `.msi`, `.exe` (NSIS)

#### 3.2 코드 서명 (선택 사항, 나중에 추가)
- [ ] macOS 코드 서명 설정
- [ ] Windows 코드 서명 설정

---

### Phase 4: 문서화 및 테스트

#### 4.1 README 업데이트
- [ ] GitHub Actions 배지 추가
  ```markdown
  ![CI](https://github.com/username/Boop2/actions/workflows/ci.yml/badge.svg)
  ![Release](https://github.com/username/Boop2/actions/workflows/release.yml/badge.svg)
  ```
- [ ] CI/CD 섹션 추가
  - 자동화된 테스트 설명
  - 릴리스 프로세스 설명

#### 4.2 워크플로우 테스트
- [ ] CI 워크플로우 테스트
  - [ ] PR 생성하여 CI 동작 확인
  - [ ] 모든 체크 통과 확인
  - [ ] 실패 케이스 테스트 (의도적 에러 추가)
- [ ] Release 워크플로우 테스트
  - [ ] 테스트 태그 생성 (`v0.1.1-test`)
  - [ ] 멀티플랫폼 빌드 확인
  - [ ] GitHub Release 생성 확인
  - [ ] 아티팩트 다운로드 및 실행 테스트

#### 4.3 릴리스 프로세스 문서화
- [ ] `docs/RELEASE_PROCESS.md` 생성
  - 버전 번호 규칙 (Semantic Versioning)
  - 릴리스 체크리스트
  - 태그 생성 명령어
  - 롤백 절차

---

## 🔧 기술 상세

### CI 워크플로우 핵심 요소

```yaml
# .github/workflows/ci.yml 구조 예시
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  frontend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test
      - run: npx tsc --noEmit

  backend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: swatinem/rust-cache@v2
        with:
          workspaces: src-tauri
      - run: cargo fmt --check --manifest-path src-tauri/Cargo.toml
      - run: cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

### Release 워크플로우 핵심 요소

```yaml
# .github/workflows/release.yml 구조 예시
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  publish:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest'
            args: '--target universal-apple-darwin'
          - platform: 'ubuntu-22.04'
            args: ''
          - platform: 'windows-latest'
            args: ''

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      - uses: dtolnay/rust-toolchain@stable
      - uses: swatinem/rust-cache@v2
        with:
          workspaces: src-tauri
      - run: npm ci
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Boop2 v__VERSION__'
          releaseBody: 'See the assets to download and install this version.'
          releaseDraft: false
          prerelease: false
          args: ${{ matrix.args }}
```

---

## ⚠️ 주의사항

### 권한 관련
- GitHub Actions에서 릴리스를 생성하려면 `contents: write` 권한 필요
- "Resource not accessible by integration" 에러 발생 시:
  - Settings > Actions > Workflow permissions
  - "Read and write permissions" 활성화

### 플랫폼별 고려사항
- **Linux ARM**: 공개 저장소에서만 `ubuntu-22.04-arm` 사용 가능
- **macOS Universal Binary**: `--target universal-apple-darwin` 사용
- **Windows**: 코드 서명 없으면 SmartScreen 경고 발생 가능

### 빌드 시간
- 첫 빌드: 각 플랫폼당 10-20분 소요
- 캐시 활용 시: 5-10분으로 단축
- 총 릴리스 시간: 약 30-60분 (3개 플랫폼 병렬 빌드)

---

## 📊 성공 지표

### Phase 1 완료 조건
- [x] ESLint 실행 시 에러 없음
- [x] Prettier 체크 통과
- [x] vitest 모든 테스트 통과
- [x] `cargo fmt --check` 통과
- [x] `cargo clippy` 경고 없음

### Phase 2 완료 조건
- [x] PR 생성 시 CI 자동 실행
- [x] 모든 체크 통과 시 초록색 체크마크
- [x] 실패 시 명확한 에러 메시지

### Phase 3 완료 조건
- [x] 태그 푸시 시 자동 릴리스 생성
- [x] 3개 플랫폼 모두 바이너리 업로드
- [x] 다운로드한 바이너리 정상 실행

### Phase 4 완료 조건
- [x] README에 배지 표시
- [x] 릴리스 프로세스 문서화 완료
- [x] 팀원이 문서만 보고 릴리스 가능

---

## 🎯 다음 단계

1. **Phase 1 시작**: ESLint, Prettier, vitest 설정 추가
2. **로컬 테스트**: 모든 스크립트가 로컬에서 정상 동작하는지 확인
3. **Phase 2 진행**: CI 워크플로우 생성 및 테스트
4. **Phase 3 진행**: Release 워크플로우 생성 및 테스트
5. **Phase 4 마무리**: 문서화 및 배지 추가

---

## 📚 추가 참고 자료

- [GitHub Actions 문법](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Tauri v2 빌드 가이드](https://v2.tauri.app/build/)
- [ESLint TypeScript 가이드](https://typescript-eslint.io/)
- [Prettier 설정 옵션](https://prettier.io/docs/en/options.html)
- [Vitest 설정 가이드](https://vitest.dev/config/)

---

> **마지막 업데이트**: 2025-12-26
> **작성자**: Claude Code (AI Assistant)
> **검토 필요**: 프로젝트 리드, DevOps 담당자
