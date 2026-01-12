# Testing Patterns

**Analysis Date:** 2025-01-12

## Test Framework

**Runner:**
- Vitest 4.0.16 for unit tests
- Playwright 1.57.0 for E2E tests

**Assertion Library:**
- Vitest built-in expect
- Playwright built-in expect

**Run Commands:**
```bash
npm test                              # Run unit tests (watch mode)
npm run test:ci                       # Run unit tests (CI mode)
npm run test:coverage                 # Coverage report
npm run test:e2e                      # Run E2E tests
```

## Test File Organization

**Location:**
- Unit tests: `src/**/*.test.ts` (co-located with source)
- Integration tests: `src/**/*.integration.test.ts`
- E2E tests: `e2e/**/*.spec.ts` (separate directory)

**Naming:**
- Unit tests: `ModuleName.test.ts`
- Integration tests: `feature.integration.test.ts`
- E2E tests: `feature-name.spec.ts`

**Structure:**
```
src/
  lib/
    ScriptExecution.ts
    ScriptExecution.test.ts       # Co-located unit test
    Integration.test.ts           # Integration test
    findUtils.ts
    findUtils.test.ts
    tabGroups.ts
    tabGroups.test.ts
e2e/
  editor-basic.spec.ts            # E2E tests
  editor-tabs.spec.ts
  helpers/
    editor.ts                     # Page Object
    tabbar.ts
```

## Test Structure

**Unit Test Pattern (Vitest):**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ScriptExecution, EditorAdapter } from './ScriptExecution';

// Mock implementation
class MockEditorAdapter implements EditorAdapter {
  private content: string;
  constructor(content: string) {
    this.content = content;
  }
  getText(): string { return this.content; }
  setText(text: string): void { this.content = text; }
}

describe('ScriptExecution Logic', () => {
  describe('text property', () => {
    it('returns full text when no selection', () => {
      const adapter = new MockEditorAdapter('Hello World');
      const exec = new ScriptExecution(adapter);
      expect(exec.text).toBe('Hello World');
    });
  });
});
```

**E2E Test Pattern (Playwright):**
```typescript
import { test, expect } from '@playwright/test';
import { EditorHelper } from './helpers/editor';

test.describe('Basic Input', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('E-001: English input', async () => {
    await editor.type('Hello World');
    const text = await editor.getText();
    expect(text).toBe('Hello World');
  });
});
```

**Patterns:**
- `describe` blocks for grouping
- `it` or `test` for individual cases
- beforeEach for per-test setup
- Mock classes defined in test file
- Page Object pattern for E2E

## Mocking

**Framework:**
- Vitest built-in mocking (vi)
- No external mocking library

**Patterns:**
```typescript
import { vi } from 'vitest';

// Mock implementation
class MockAdapter implements Interface {
  // Manual mock implementation
}

// Spy on function calls
const spy = vi.fn();
```

**What to Mock:**
- External dependencies (localStorage, Tauri IPC)
- Complex adapters (EditorAdapter)
- Timing functions (if needed)

**What NOT to Mock:**
- Pure utility functions
- Domain models
- Internal business logic

## Fixtures and Factories

**Test Data:**
```typescript
// Factory in test file
function createTestAdapter(content: string = ''): MockEditorAdapter {
  return new MockEditorAdapter(content);
}

// Inline test data
const testScript = {
  name: 'Test Script',
  icon: 'terminal',
  script: 'console.log("test")'
};
```

**Page Objects (E2E):**
```typescript
// e2e/helpers/editor.ts
export class EditorHelper {
  readonly page: Page;
  readonly editor: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editor = page.locator('[data-slate-editor="true"]');
  }

  async type(text: string) {
    await this.focus();
    await this.page.keyboard.type(text, { delay: 50 });
  }
}
```

## Coverage

**Requirements:**
- Threshold: 95% for all metrics (statements, branches, functions, lines)
- Configured in `vite.config.ts`

**Configuration:**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: ['node_modules/', 'src-tauri/', 'dist/', '**/*.config.*', '**/*.d.ts'],
  thresholds: {
    statements: 95,
    branches: 95,
    functions: 95,
    lines: 95,
  },
}
```

**View Coverage:**
```bash
npm run test:coverage
open coverage/index.html
```

## Test Types

**Unit Tests:**
- Location: `src/lib/*.test.ts`
- Scope: Single function or class
- Mocking: Mock all external dependencies
- Current files: 6 test files, 125 tests

**Integration Tests:**
- Location: `src/lib/*.integration.test.ts`
- Scope: Multiple modules together
- Mocking: Mock only external boundaries

**E2E Tests:**
- Location: `e2e/*.spec.ts`
- Framework: Playwright
- Scope: Full user flows
- Current files: 5 spec files
- Patterns: Page Object, test IDs (E-001, etc.)

## Common Patterns

**Async Testing:**
```typescript
it('handles async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

**Error Testing:**
```typescript
it('throws on invalid input', () => {
  expect(() => parse(null)).toThrow('error message');
});

// Async error
it('rejects on failure', async () => {
  await expect(asyncCall()).rejects.toThrow('error');
});
```

**Playwright Assertions:**
```typescript
// Wait for element
await expect(page.locator('.element')).toBeVisible();

// Text content
await expect(editor.getText()).toBe('expected');
```

## CI Integration

**GitHub Actions (`.github/workflows/ci.yml`):**
- TypeScript type check: `npx tsc --noEmit`
- ESLint: `npm run lint`
- Prettier: `npm run format:check`
- Unit tests: `npm run test`
- Security audit: `npm audit --omit=dev --audit-level=high`
- Rust checks: `cargo fmt --check`, `cargo clippy`

**Test Runs:**
- On every push to main/dev
- On every pull request
- Cross-platform build verification on PR only

---

*Testing analysis: 2025-01-12*
*Update when test patterns change*
