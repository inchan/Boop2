# Boop2 Release Process

This document describes how to release a new version of Boop2. The release process is highly automated using GitHub Actions.

## 1. Versioning

Boop2 follows [Semantic Versioning (SemVer)](https://semver.org/):

- **MAJOR** version for incompatible API changes.
- **MINOR** version for functionality in a backwards compatible manner.
- **PATCH** version for backwards compatible bug fixes.

## 2. Pre-release Checklist

Before releasing, ensure you run these commands locally to prevent CI/CD failures:

> **⚠️ IMPORTANT:** Always run `lint` and `test` locally before pushing. The `pre-push` hook will block the push if they fail, but it's better to catch issues early.

### Required Checks

- [ ] All tests pass locally: `npm run test` (Unit) & `npm run test:e2e` (E2E)
- [ ] Code is formatted: `npm run format`
- [ ] Linting is clean: `npm run lint` (Fix any errors before committing!)
- [ ] Rust builds pass: `cargo check` (runs on Linux CI)
- [ ] Version in `package.json` is updated.
- [ ] Version in `src-tauri/tauri.conf.json` is updated.
- [ ] Documentation is up to date.

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
| **merge-updater** | Merge signatures and create latest.json                   | ubuntu-latest      |

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
