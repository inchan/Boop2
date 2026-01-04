# Implementation Plan: 테마 지원 (Theme Support)

**Branch**: `004-theme-support` | **Date**: 2026-01-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-theme-support/spec.md`

## Summary

Implement automatic dark/light theme support based on macOS system preferences using CSS custom properties and `prefers-color-scheme` media queries. The feature will also fix the initial white flash issue by applying theme-appropriate background colors at HTML load time.

## Technical Context

**Language/Version**: TypeScript 5.x (React 19)  
**Primary Dependencies**: Tauri 2.0, Slate.js (editor), CSS Custom Properties  
**Storage**: N/A (CSS-only, no persistence needed)  
**Testing**: Playwright E2E tests, Vitest (if needed for CSS utilities)  
**Target Platform**: macOS (desktop Tauri app)  
**Project Type**: Desktop application (Tauri + React)  
**Performance Goals**: Theme switch renders within 300ms  
**Constraints**: No external theme library; must use native CSS  
**Scale/Scope**: Single application, ~10 CSS files to update

## Constitution Check (Post-Design)

_GATE: Re-check after Phase 1 design_

**Result**: PASSED - No constraints violated by the design

## Project Structure

### Documentation (this feature)

```text
specs/004-theme-support/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (theme configuration)
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (API patterns - N/A for CSS)
```

### Source Code (repository root)

```text
src/
├── App.css              # Main styles - define CSS variables here
├── App.tsx              # Root component
├── components/
│   ├── SlateEditor.tsx  # Editor component - uses theme variables
│   ├── TabBar.tsx       # Tab bar - uses theme variables
│   ├── CommandPalette.tsx
│   ├── ClipboardPopover.tsx
│   ├── SessionPopover.tsx
│   └── SettingsPopover.tsx
├── main.tsx             # Entry point
└── index.css            # (existing)

index.html               # Add inline theme background styles
```

**Structure Decision**: Single project structure. CSS variables defined in `App.css` and consumed by all components. No new files required.

## Phase 0: Research

This feature uses standard CSS features that are well-documented and widely supported:

- **CSS Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **prefers-color-scheme**: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- **prefers-reduced-motion**: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

**Decision**: No additional research needed - these are native CSS features with universal browser/Tauri support.

## Phase 1: Design & Contracts

### Data Model

Theme configuration is managed through CSS custom properties. No TypeScript interfaces required since this is purely CSS-based.

### Contracts

N/A - This feature does not involve API calls or external contracts. All theme handling is done via CSS.

## Complexity Tracking

N/A - No constitution violations

---

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.
