# Boop2 Release Process

This document describes how to release a new version of Boop2. The release process is highly automated using GitHub Actions.

## 1. Versioning

Boop2 follows [Semantic Versioning (SemVer)](https://semver.org/):

- **MAJOR** version for incompatible API changes.
- **MINOR** version for functionality in a backwards compatible manner.
- **PATCH** version for backwards compatible bug fixes.

> **💡 Version Update Policy:**
>
> - **기본적으로 PATCH 버전**을 사용합니다 (버그 수정, 작은 개선).
> - 사용자가 명시적으로 요청한 경우에만 **MINOR** (새 기능) 또는 **MAJOR** (호환되지 않는 변경)로 버전업합니다.
> - 릴리즈 요청 시 버전을 명시하지 않으면 PATCH로 처리됩니다.
> - 예: "릴리즈해주세요" → PATCH | "0.4.0으로 린리즈해주세요" → MINOR

## 2. Pre-release Checklist

> **⚠️ IMPORTANT:** Always run all local checks before pushing. This prevents CI/CD failures and ensures a smooth release process.

### Step 1: Local Validation (Run All Before Pushing)

Always perform these validations locally **before** creating a release:

```bash
# From project root

# 1. Frontend checks
npm run lint              # ESLint (fix errors first!)
npm run format            # Prettier formatting
npm run format:check      # Verify formatting
npm run test              # Unit tests (Vitest)
npm run test:e2e          # E2E tests (Playwright)

# 2. TypeScript check
npx tsc --noEmit          # TypeScript compilation

# 3. Rust checks
cargo fmt --check --manifest-path src-tauri/Cargo.toml  # Rust formatting
cargo clippy --manifest-path src-tauri/Cargo.toml       # Rust linting
cargo check --manifest-path src-tauri/Cargo.toml        # Rust compilation

# 4. Build test (optional but recommended)
npm run build            # Frontend build
# npm run tauri build -- --bundles app  # Full bundle test (macOS only)
```

** Checklist:**

- [ ] `npm run lint` passes (no errors)
- [ ] `npm run format:check` passes
- [ ] `npm run test` passes (all 115+ tests)
- [ ] `npm run test:e2e` passes (E2E tests)
- [ ] `npx tsc --noEmit` passes (no TypeScript errors)
- [ ] `cargo fmt --check` passes
- [ ] `cargo clippy` passes (no warnings as errors)
- [ ] `cargo check` passes

### Step 2: Version Update

After local validation passes, update version numbers:

```bash
# Update both files to the same version (e.g., 0.3.5)
# Edit package.json: "version": "0.3.5"
# Edit src-tauri/tauri.conf.json: "version": "0.3.5"

git add package.json src-tauri/tauri.conf.json
git commit -m "chore: bump version to v0.3.5"
git push origin main
```

### Step 3: Create Tag & Release

```bash
# Create and push version tag
git tag v0.3.5
git push origin v0.3.5

# GitHub Actions will automatically:
# 1. Run Pre-flight Validation (lint, test, cargo check)
# 2. Build for macOS, Linux, Windows
# 3. Create release with binaries
```

### Common CI Failures & Solutions

#### Rust: Unused Imports on Linux

If you add macOS-specific code (e.g., `cocoa`, `objc`, `TitleBarStyle`), you **must** use conditional compilation:

```rust
// ✅ CORRECT: Conditional compilation
#[cfg(target_os = "macos")]
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

// ❌ WRONG: Unconditional import (fails on Linux CI)
// use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
```

#### Playwright: Version Conflict with Vitest

If E2E tests fail with `two different versions of @playwright/test`:

```bash
# Solution: Reinstall dependencies with fresh lock file
rm -rf node_modules package-lock.json
npm install
```

#### Lint: useEffect Dependency Warnings

When adding dependencies to `useEffect` arrays:

- **Option 1:** Add the correct dependency (if the value is stable via `useCallback`)
- **Option 2:** Use `// eslint-disable-next-line react-hooks/exhaustive-deps` on the `useEffect` line itself, NOT on the function call

```typescript
// ✅ CORRECT: Directive on useEffect declaration
useEffect(() => {
  initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [onScriptsLoaded]);

// ❌ WRONG: Directive on function call (may not suppress correctly)
// onScriptsLoaded(loadedScripts);
// eslint-disable-next-line react-hooks/exhaustive-deps
```

## 3. Creating a Release

To trigger an automated release:

1. **Update version numbers** in the following files:
   - `package.json`
   - `src-tauri/tauri.conf.json`

2. **Commit and Push** the changes:

   ```bash
   # Ensure you are on the main branch
   git checkout main
   git pull origin main

   git add package.json src-tauri/tauri.conf.json
   git commit -m "chore: bump version to vX.Y.Z"
   git push origin main
   ```

3. **Create and Push a Tag**:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

## 4. Automated Workflow

Once the tag is pushed, the **Release Workflow** (`release.yml`) will:

### Workflow Stages

| Stage             | Description                                               | Runs On            |
| ----------------- | --------------------------------------------------------- | ------------------ |
| **validate**      | Pre-flight checks (lint, test, cargo check, version sync) | ubuntu-latest      |
| **build**         | Platform-specific builds (macOS, Linux, Windows)          | 3 parallel runners |
| **merge-updater** | Merge signatures and create latest.json for auto-updates  | ubuntu-latest      |

### About merge-updater

The `merge-updater` job creates `latest.json` - a metadata file used by Tauri for auto-updates:

```json
{
  "version": "0.3.5",
  "platforms": {
    "darwin-universal": { "signature": "...", "url": "..." },
    "linux-x64": { "signature": "...", "url": "..." },
    "windows-x64": { "signature": "...", "url": "..." }
  }
}
```

> **Note:** The `Final status check` step may show as failed (exit code 4) due to `GH_TOKEN` environment variable issue. This is a known cosmetic issue - **the release and latest.json are created successfully regardless**.

### Key Behaviors

- **Fail-Fast:** If any platform build fails, all builds stop immediately
- **Concurrency:** Only one release runs at a time; in-progress runs are cancelled on new push
- **Status Tracking:** Each stage updates the commit status (visible in PR/commits page)
- **Pre-flight Validation:** Before building, the workflow validates:
  - `npm run lint` passes
  - `npm run test` passes
  - `cargo check` passes
  - Version numbers match between `package.json` and `tauri.conf.json`

### Manual Rerun

If a build fails, you can manuallyun from Git rerHub Actions:

1. Go to **Actions** → **Release** workflow
2. Select the failed run
3. Click **Rerun workflow** (top right)
4. Optionally provide a reason for the rerun

> **Note:** The `workflow_dispatch` input allows manual triggering without a tag.

### Release Status

Track progress via commit status badges or GitHub Actions tab:

```
✓ validate passed → Building macOS... → Building Linux... → Building Windows... → Complete
```

If any step fails, you'll see:

```
❌ validate FAILED (see logs)
# OR
❌ build FAILED: macOS-latest (check artifacts/logs)
```

## 5. Verification

After the workflow completes (approx. 20-30 minutes):

1. Go to the **Releases** section of the GitHub repository.
2. Verify that all platform binaries are attached.
3. Download and test the binaries on at least one platform to ensure integrity.
