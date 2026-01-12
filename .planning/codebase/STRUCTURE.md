# Codebase Structure

**Analysis Date:** 2025-01-12

## Directory Layout

```
Boop2/
├── src/                    # Frontend source code (TypeScript/React)
│   ├── components/         # React UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Business logic and utilities
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Root component
│   ├── App.css             # Global styles
│   ├── main.tsx            # React entry point
│   └── vite-env.d.ts       # Vite type definitions
│
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/                # Rust source
│   │   ├── main.rs         # Entry point
│   │   └── lib.rs          # Core logic
│   ├── scripts/            # Bundled JavaScript scripts (73 files)
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
│
├── e2e/                    # Playwright E2E tests
│   ├── *.spec.ts           # Test specifications
│   └── helpers/            # Page Object helpers
│
├── specs/                  # Feature specifications (Spec-Kit)
│   ├── 001-fix-editor-tab/
│   ├── 003-script-favorites/
│   ├── 006-editor-find/
│   └── ...                 # 11 feature specs
│
├── docs/                   # User documentation
├── public/                 # Static assets
├── coverage/               # Test coverage reports
├── dist/                   # Vite build output
└── .github/workflows/      # CI/CD workflows
```

## Directory Purposes

**src/components/**
- Purpose: React UI components
- Contains: 9 component pairs (`.tsx` + `.css`)
- Key files: `SlateEditor.tsx`, `CommandPalette.tsx`, `TabBar.tsx`, `FindPanel.tsx`
- Pattern: Each component has co-located CSS

**src/hooks/**
- Purpose: Custom React hooks for state management
- Contains: 7 hook files
- Key files: `useWorkspace.ts` (core state), `useSettings.ts`, `useFind.ts`
- Pattern: `use` prefix naming convention

**src/lib/**
- Purpose: Business logic, utilities, and domain models
- Contains: 15+ files including tests
- Key files:
  - `ScriptRunner.ts` - Script execution entry point
  - `WorkerPool.ts` - Web Worker management
  - `worker.ts` - Worker code
  - `tabGroups.ts` - Domain models
  - `findUtils.ts` - Text search utilities
  - `RequireShim.ts` - Node.js require simulation
- Pattern: PascalCase naming, tests co-located (`.test.ts`)

**src/types/**
- Purpose: Shared TypeScript type definitions
- Contains: `index.ts` (Favorites), `find.ts` (Find feature)

**src-tauri/src/**
- Purpose: Rust backend for native functionality
- Contains: `main.rs` (entry), `lib.rs` (logic)
- Key functions: `load_scripts()` - scans script directories

**src-tauri/scripts/**
- Purpose: Bundled JavaScript scripts for text transformation
- Contains: 73 `.js` files (Base64, FormatJSON, Hash, etc.)
- Pattern: Single function per file with metadata header

**e2e/**
- Purpose: End-to-end tests with Playwright
- Contains: 5 spec files, helpers directory
- Key files: `editor-basic.spec.ts`, `editor-tabs.spec.ts`
- Pattern: Page Object pattern in `helpers/`

**specs/**
- Purpose: Feature specifications (Spec-Kit methodology)
- Contains: 11 feature directories with checklists and contracts

## Key File Locations

**Entry Points:**
- `src/main.tsx` - React app initialization
- `src/App.tsx` - Root component (464 lines)
- `src-tauri/src/main.rs` - Tauri app entry
- `index.html` - HTML entry for Vite

**Configuration:**
- `tsconfig.json` - TypeScript compiler
- `vite.config.ts` - Vite + Vitest
- `eslint.config.js` - ESLint rules
- `.prettierrc` - Code formatting
- `playwright.config.ts` - E2E test config
- `src-tauri/tauri.conf.json` - Tauri app config

**Core Logic:**
- `src/hooks/useWorkspace.ts` - Central state management (320 lines)
- `src/lib/WorkerPool.ts` - Script execution pool (244 lines)
- `src-tauri/src/lib.rs` - Backend logic (253 lines)

**Testing:**
- `src/lib/*.test.ts` - Unit tests (6 files)
- `e2e/*.spec.ts` - E2E tests (5 files)

## Naming Conventions

**Files:**
- PascalCase.tsx - React components (`CommandPalette.tsx`)
- camelCase.ts - Hooks with `use` prefix (`useSettings.ts`)
- PascalCase.ts - Libraries and utilities (`ScriptRunner.ts`)
- *.test.ts - Unit tests (`ScriptExecution.test.ts`)
- *.spec.ts - E2E tests (`editor-basic.spec.ts`)

**Directories:**
- lowercase - All directories (`components/`, `hooks/`, `lib/`)
- kebab-case - Feature specs (`003-script-favorites/`)

**Special Patterns:**
- index.ts - Barrel exports (`hooks/index.ts`)
- helpers/ - Test utilities (`e2e/helpers/`)

## Where to Add New Code

**New UI Component:**
- Implementation: `src/components/ComponentName.tsx`
- Styles: `src/components/ComponentName.css`
- Import in: `src/App.tsx` or parent component

**New Hook:**
- Implementation: `src/hooks/useName.ts`
- Export from: `src/hooks/index.ts`

**New Utility/Service:**
- Implementation: `src/lib/ServiceName.ts`
- Tests: `src/lib/ServiceName.test.ts`

**New Script:**
- Implementation: `src-tauri/scripts/ScriptName.js`
- Metadata: Add JSON header in `/** {...} **/` format

**New E2E Test:**
- Implementation: `e2e/feature-name.spec.ts`
- Helper: `e2e/helpers/feature.ts` (if needed)

## Special Directories

**dist/**
- Purpose: Vite build output
- Source: Generated by `npm run build`
- Committed: No (in .gitignore)

**coverage/**
- Purpose: Vitest coverage reports
- Source: Generated by `npm run test:coverage`
- Committed: No (in .gitignore)

**node_modules/**
- Purpose: npm dependencies
- Source: `npm install`
- Committed: No (in .gitignore)

**src-tauri/target/**
- Purpose: Rust build output
- Source: `cargo build`
- Committed: No (in .gitignore)

---

*Structure analysis: 2025-01-12*
*Update when directory structure changes*
