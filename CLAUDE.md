# Boop2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-04

## Active Technologies
- TypeScript 5.8, React 19.1, Rust 1.75 + Tauri 2.0, Slate.js 0.120, Vite 7.0 (009-fix-command-palette)
- localStorage (`boop_recent_scripts`) (009-fix-command-palette)
- TypeScript 5.8, React 19.1 + Slate.js 0.120, slate-history 0.113.1, slate-react 0.120 (010-fix-tab-undo)
- N/A (in-memory state only) (010-fix-tab-undo)

- TypeScript 5.x (React 19) + Tauri 2.0, Slate.js (editor), CSS Custom Properties (004-theme-support)
- N/A (CSS-only, no persistence needed) (004-theme-support)
- TypeScript 5.x (React 19) + Tauri 2.0, React, CSS Custom Properties (005-opacity-setting)
- localStorage (via existing `useSettings` hook) (005-opacity-setting)
- TypeScript 5.8, React 19.1, Rust 1.75 + Slate.js 0.120, Tauri 2.0, Vite 7.0 (006-editor-find)
- N/A (local editor state only) (006-editor-find)

- TypeScript 5.x, JavaScript ES2022 + React 19, Slate.js (rich text editor), Fuse.js (fuzzy search in Command Palette) (003-script-favorites)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, JavaScript ES2022: Follow standard conventions

## Recent Changes
- 010-fix-tab-undo: Added TypeScript 5.8, React 19.1 + Slate.js 0.120, slate-history 0.113.1, slate-react 0.120
- 009-fix-command-palette: Added TypeScript 5.8, React 19.1, Rust 1.75 + Tauri 2.0, Slate.js 0.120, Vite 7.0

- 007-find-highlight-sync: Added Editor.addMark/removeMark for highlight synchronization

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
