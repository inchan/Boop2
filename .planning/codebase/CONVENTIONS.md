# Coding Conventions

**Analysis Date:** 2025-01-12

## Naming Patterns

**Files:**
- PascalCase.tsx - React components (`CommandPalette.tsx`, `SlateEditor.tsx`)
- camelCase.ts - Hooks with `use` prefix (`useSettings.ts`, `useWorkspace.ts`)
- PascalCase.ts - Libraries, services, classes (`ScriptRunner.ts`, `WorkerPool.ts`)
- *.test.ts - Co-located unit tests (`ScriptExecution.test.ts`)
- *.spec.ts - E2E tests (`editor-basic.spec.ts`)

**Functions:**
- camelCase for all functions
- No special prefix for async functions
- handle* for event handlers (`handleSelect`, `handleClose`)
- on* for callback props (`onClose`, `onSelect`)

**Variables:**
- camelCase for variables and parameters
- UPPER_SNAKE_CASE for constants (`STORAGE_KEY_SETTINGS`, `MAX_RECENT`)
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces (`EditorAdapter`, `ScriptModel`)
- PascalCase for type aliases (`UpdateInfo`, `Settings`)
- No `I` prefix for interfaces
- Props suffix for component props (`CommandPaletteProps`)

## Code Style

**Formatting (`.prettierrc`):**
- Semicolons: Required (`semi: true`)
- Quotes: Single quotes (`singleQuote: true`)
- Indentation: 2 spaces (`tabWidth: 2, useTabs: false`)
- Line width: 100 characters (`printWidth: 100`)
- Trailing comma: ES5 style (`trailingComma: 'es5'`)
- Arrow parens: Always (`arrowParens: 'always'`)
- End of line: LF (`endOfLine: 'lf'`)

**Linting (`eslint.config.js`):**
- ESLint 9.x with flat config
- TypeScript ESLint recommended rules
- React + React Hooks plugins
- Key rules:
  - `react/react-in-jsx-scope: 'off'` (React 19 auto-import)
  - `react/prop-types: 'off'` (using TypeScript)
  - `@typescript-eslint/no-explicit-any: 'warn'`
  - `@typescript-eslint/no-unused-vars: 'warn'` (allows _ prefix)
  - `no-console: 'off'` (allowed in development)

## Import Organization

**Order:**
1. React and React-related (`react`, `slate`, `slate-react`)
2. External packages (`@tauri-apps/api`, `lodash`, `fuse.js`)
3. Internal components (`./components/*`)
4. Internal hooks (`./hooks/*`)
5. Internal lib (`./lib/*`)
6. Types (`./types/*`)
7. Styles (`./App.css`)

**Patterns:**
- Named imports preferred (`import { useState } from 'react'`)
- Type imports use `type` keyword (`import type { UpdateInfo }`)
- Default + named imports allowed (`import SlateEditor, { SlateEditorHandle }`)
- No path aliases (relative imports only)

## Error Handling

**Patterns:**
- try/catch for async operations and localStorage access
- ErrorBoundary at app root for React errors
- Console logging before fallback to default values
- User-facing errors displayed via notification system

**Example:**
```typescript
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return { ...DEFAULT, ...JSON.parse(saved) };
  }
} catch (e) {
  console.error('Failed to load settings:', e);
}
return DEFAULT;
```

## Logging

**Framework:**
- console.log/error for development
- No external logging service

**Patterns:**
- Log errors with context: `console.error('Failed to X:', error)`
- No console.log in production (enforced in CI, but `no-console: 'off'` locally)

## Comments

**When to Comment:**
- Explain why, not what
- Document business logic or algorithms
- Mark workarounds with explanation

**JSDoc/TSDoc:**
- Optional for internal functions
- Use for public API if ambiguous
- Page Object helpers in E2E tests documented

**TODO Comments:**
- Format: `// TODO: description`
- No username, use git blame

## Function Design

**Size:**
- Keep under 50 lines when practical
- Extract helpers for complex logic

**Parameters:**
- Max 3-4 parameters
- Use object for more parameters
- Destructure in parameter list

**Return Values:**
- Explicit return statements
- Return early for guard clauses

## Module Design

**Exports:**
- Named exports preferred
- Default exports for React components (when single component per file)
- Barrel files (`index.ts`) for hooks

**Barrel Files:**
- `src/hooks/index.ts` - Re-exports all hooks
- Avoid circular dependencies

## React Patterns

**Components:**
- Function components only (no class components)
- Props interface defined inline or as `*Props` type
- Destructure props in parameter

**Hooks:**
- Custom hooks for reusable state logic
- useCallback for stable function references
- useMemo for expensive computations
- useRef for mutable values that don't trigger re-render

**State:**
- useState for local state
- Lift state to common ancestor when needed
- localStorage for persistence

## CSS Patterns

**Organization:**
- Co-located CSS files (ComponentName.tsx + ComponentName.css)
- CSS custom properties for theming
- Global styles in `App.css`

**Naming:**
- BEM-inspired class names (`command-palette-overlay`, `tab-item.active`)
- Lowercase with hyphens

**Theming:**
- CSS custom properties in `:root`
- Dark mode via `@media (prefers-color-scheme: dark)`

---

*Convention analysis: 2025-01-12*
*Update when patterns change*
