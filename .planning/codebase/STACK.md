# Technology Stack

**Analysis Date:** 2025-01-12

## Languages

**Primary:**
- TypeScript 5.8.3 - All frontend application code (`package.json`, `tsconfig.json`)
- Rust Edition 2021 - Tauri backend (`src-tauri/Cargo.toml`)

**Secondary:**
- JavaScript ES2022 - Build scripts, config files, user scripts runtime

## Runtime

**Environment:**
- Node.js LTS - Frontend development and build (`.github/workflows/ci.yml`)
- Tauri 2.0 - Desktop app runtime (`src-tauri/Cargo.toml`)
- Browser/WebView - React UI rendering

**Package Manager:**
- npm - Primary package manager
- Lockfile: `package-lock.json` present (lockfileVersion: 3)

## Frameworks

**Core:**
- React 19.1.0 - UI framework (`package.json`)
- Slate.js 0.120.0 - Rich text editor (`package.json`, `src/App.tsx`)
  - slate-react 0.120.0
  - slate-history 0.113.1
- Tauri 2.0 - Desktop app framework (`src-tauri/Cargo.toml`)

**Testing:**
- Vitest 4.0.16 - Unit tests (`package.json`, `vite.config.ts`)
- Playwright 1.57.0 - E2E tests (`package.json`, `playwright.config.ts`)

**Build/Dev:**
- Vite 7.0.4 - Build tool and dev server (`vite.config.ts`)
- TypeScript 5.8.3 - Type checking and compilation

## Key Dependencies

**Critical:**
- lodash 4.17.21 - Utility functions (`src/lib/RequireShim.ts`)
- fuse.js 7.1.0 - Fuzzy search for command palette (`src/components/CommandPalette.tsx`)
- papaparse 5.5.3 - CSV parsing (`src/lib/RequireShim.ts`)
- js-yaml 4.1.1 - YAML parsing (`src/lib/RequireShim.ts`)
- he 1.2.0 - HTML entity encoding/decoding (`src/lib/RequireShim.ts`)
- jshashes 1.0.8 - Hash functions (MD5, SHA1, SHA256) (`src/lib/RequireShim.ts`)

**Infrastructure:**
- @tauri-apps/api ^2 - Tauri API bindings (`package.json`)
- @tauri-apps/plugin-updater ^2.9.0 - Auto-update (`src/lib/updater.ts`)
- @tauri-apps/plugin-opener ^2 - External link/file opening
- @tauri-apps/plugin-process ^2.3.1 - Process management

**Rust Dependencies:**
- serde 1.0 - Serialization (`src-tauri/Cargo.toml`)
- serde_json 1.0 - JSON processing
- cocoa 0.25 - macOS native API (macOS only)
- objc 0.2 - Objective-C runtime (macOS only)

## Configuration

**Environment:**
- No .env files required
- TAURI_DEV_HOST - Optional dev server host (`vite.config.ts`)

**Build:**
- `tsconfig.json` - TypeScript compiler options (ES2020 target, strict mode)
- `vite.config.ts` - Vite + Vitest configuration
- `eslint.config.js` - ESLint flat config
- `.prettierrc` - Code formatting
- `src-tauri/tauri.conf.json` - Tauri app configuration

**Storage Keys (localStorage):**
- `boop_workspace_v1` - Workspace state (tabs, groups)
- `boop_settings_v1` - User settings
- `boop_sessions_stack_v3` - Session history
- `boop_recent_scripts` - Recent script history

## Platform Requirements

**Development:**
- macOS/Linux/Windows with Node.js LTS
- Rust toolchain for Tauri backend
- No Docker required

**Production:**
- macOS: .app bundle (distributed via GitHub Releases)
- Windows: NSIS installer
- Linux: AppImage
- Auto-update via Tauri updater plugin

---

*Stack analysis: 2025-01-12*
*Update after major dependency changes*
