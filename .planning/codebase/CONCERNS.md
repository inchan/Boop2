# Codebase Concerns

**Analysis Date:** 2025-01-12

## Tech Debt

**App.tsx size and complexity:**
- Issue: Root component is 464 lines with multiple responsibilities
- Files: `src/App.tsx`
- Why: Rapid development, all features added to single component
- Impact: Harder to understand, test, and maintain
- Fix approach: Extract logical sections into sub-components or custom hooks

**Editor instance caching logic:**
- Issue: Complex editorsMapRef management for Slate editor caching
- Files: `src/App.tsx` (editorsMapRef)
- Why: Performance optimization to avoid recreating editors
- Impact: Complex state management, potential memory leaks
- Fix approach: Consider a dedicated EditorManager class or hook

**Legacy migration code:**
- Issue: V3 → V1 workspace migration code still present
- Files: `src/hooks/useWorkspace.ts`
- Why: Backward compatibility during transition
- Impact: Extra code complexity, unused after migration complete
- Fix approach: Remove migration code after sufficient time has passed

## Known Bugs

**No critical bugs detected at analysis time.**

The test suite passes with 125 tests across 6 test files.

## Security Considerations

**Script execution in Web Workers:**
- Risk: User scripts execute in Worker context
- Files: `src/lib/worker.ts`, `src/lib/RequireShim.ts`
- Current mitigation: Workers are sandboxed from main thread
- Recommendations: Document script security model for users

**localStorage data validation:**
- Risk: Corrupted or malformed data could crash the app
- Files: `src/hooks/useWorkspace.ts`, `src/hooks/useSettings.ts`
- Current mitigation: try/catch blocks with fallback to defaults
- Recommendations: Add schema validation (e.g., Zod) for stored data

## Performance Bottlenecks

**No significant performance concerns detected.**

- Web Workers prevent UI blocking during script execution
- WorkerPool (2 workers) provides concurrent execution
- Debounced localStorage writes prevent I/O thrashing
- 125 tests run in ~765ms

## Fragile Areas

**Slate.js editor integration:**
- Files: `src/components/SlateEditor.tsx`, `src/App.tsx`
- Why fragile: Complex library with frequent updates
- Common failures: Selection handling edge cases, IME input issues
- Safe modification: Test thoroughly with Korean IME and edge cases
- Test coverage: E2E tests cover basic scenarios

**Script metadata parsing:**
- Files: `src-tauri/src/lib.rs`
- Why fragile: Regex-based JSON extraction from script headers
- Common failures: Malformed metadata breaks script loading
- Safe modification: Add validation and error handling
- Test coverage: BulkScript.test.ts covers 73 scripts

## Scaling Limits

**localStorage size:**
- Current capacity: ~5MB per origin (browser limit)
- Limit: 50 session snapshots, unlimited tabs
- Symptoms at limit: localStorage.setItem fails silently or throws
- Scaling path: Implement data pruning or use IndexedDB

**Script loading:**
- Current capacity: 73 bundled scripts + user scripts
- Limit: Unknown (depends on file system)
- Symptoms at limit: Slow app startup
- Scaling path: Lazy loading, pagination in command palette

## Dependencies at Risk

**No high-risk dependencies detected.**

- React 19.1.0 - Current, stable
- Slate.js 0.120.0 - Active development
- Tauri 2.0 - Stable release
- Vitest 4.0.16 - Active development

## Missing Critical Features

**No blocking missing features for core functionality.**

The app is a complete text manipulation tool with:
- Multi-tab editing
- Script execution
- Session history
- Clipboard tracking
- Find/replace

## Test Coverage Gaps

**UI component unit tests:**
- What's not tested: React components (`src/components/*.tsx`)
- Risk: UI regressions may go unnoticed
- Priority: Medium
- Difficulty to test: Requires React Testing Library setup

**Tauri IPC commands:**
- What's not tested: `load_scripts` Rust command
- Risk: Script loading could break without detection
- Priority: Low (covered by integration/E2E tests)
- Difficulty to test: Requires Tauri test harness

**Error boundary behavior:**
- What's not tested: ErrorBoundary.tsx fallback UI
- Risk: User sees blank screen on error
- Priority: Medium
- Difficulty to test: Need to intentionally trigger errors

---

## Summary

**Overall Health: Good**

- Tests: 125 passing, 95% coverage target
- Lint: Clean (no errors)
- Security: No critical issues (offline app)
- Performance: No bottlenecks detected

**Priority Concerns:**

| Priority | Concern | Effort |
|----------|---------|--------|
| Medium | App.tsx refactoring | High |
| Low | Legacy migration code cleanup | Low |
| Low | UI component test coverage | Medium |

---

*Concerns audit: 2025-01-12*
*Update as issues are fixed or new ones discovered*
