# Implementation Plan: 투명도 설정 (Opacity Setting)

**Branch**: `005-opacity-setting` | **Date**: 2026-01-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-opacity-setting/spec.md`

## Summary

Implement an opacity setting feature that allows users to adjust background transparency (10%~100%) via a slider in the settings. The opacity value is persisted in localStorage and affects all background elements while keeping text and UI elements fully opaque.

## Technical Context

**Language/Version**: TypeScript 5.x (React 19)  
**Primary Dependencies**: Tauri 2.0, React, CSS Custom Properties  
**Storage**: localStorage (via existing `useSettings` hook)  
**Testing**: Playwright E2E tests  
**Target Platform**: macOS (desktop Tauri app)  
**Project Type**: Desktop application (Tauri + React)  
**Performance Goals**: Real-time opacity changes with no visible latency  
**Constraints**: Minimum opacity 10% (user-specified), no transparency on text/UI elements  
**Scale/Scope**: Single settings UI component update, 2-3 files to modify

## Constitution Check (Post-Design)

_GATE: Re-check after Phase 1 design_

**Result**: PASSED - No constraints violated by the design

## Project Structure

### Documentation (this feature)

```text
specs/005-opacity-setting/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (N/A - no API contracts)
```

### Source Code (repository root)

```text
src/
├── App.css              # Main styles - add opacity CSS variable here
├── App.tsx              # Root component
├── hooks/
│   └── useSettings.ts   # Existing settings hook (add opacity field)
├── components/
│   └── SettingsPopover.tsx  # Settings UI - add opacity slider
│   └── SettingsPopover.css  # Settings styles - add slider styles
└── main.tsx             # Entry point

index.html              # (no changes needed)
```

**Structure Decision**: Single project structure. Opacity is managed through CSS variables and persisted via existing settings system.

## Phase 0: Research

This feature uses standard CSS properties and existing settings infrastructure. No additional research needed.

- **CSS opacity**: Standard CSS property with universal support
- **localStorage**: Already used by existing settings system
- **React state**: Already used for settings management

**Decision**: Proceed to Phase 1 design

## Phase 1: Design & Contracts

### Data Model

The opacity setting extends the existing Settings interface:

```typescript
interface Settings {
  enableSessionRestore: boolean;
  autoRestoreLastSession: boolean;
  openNewTabOnRestore: boolean;
  enableClipboardHistory: boolean;
  enableAutoUpdate: boolean;
  // New field:
  opacity: number; // 10-100, default 100
}
```

### CSS Variables

Add opacity to the existing theme variables in App.css:

```css
:root {
  /* ... existing variables ... */
  --opacity: 1; /* 100% */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* ... existing dark theme ... */
  }
}

/* Apply opacity to background elements */
.slate-editor-container,
.tab-bar-container,
.status-bar {
  opacity: var(--opacity);
}
```

### Contracts

N/A - This feature does not involve API calls. All settings are local.

### Agent Context Update

```bash
. specify/scripts/bash/update-agent-context.sh claude
```

---

## Complexity Tracking

N/A - No constitution violations

---

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.
