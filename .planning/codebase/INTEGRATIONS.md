# External Integrations

**Analysis Date:** 2025-01-12

## APIs & External Services

**Payment Processing:**
- Not applicable (standalone app, no payments)

**Email/SMS:**
- Not applicable (no email/SMS functionality)

**External APIs:**
- Not detected - This is a fully offline-capable desktop application
- No network requests to external services required

## Data Storage

**Databases:**
- Not applicable (no database)
- All data stored in browser localStorage

**File Storage:**
- Local file system only
- Script directories:
  - macOS: `~/Library/Application Support/com.chans.boop2/scripts/`
  - Linux: `~/.config/com.chans.boop2/scripts/`
  - Windows: `%APPDATA%\com.chans.boop2\scripts\`

**Caching:**
- In-memory only (React state)
- localStorage for persistence

## Authentication & Identity

**Auth Provider:**
- Not applicable (no authentication required)

**OAuth Integrations:**
- Not applicable

## Monitoring & Observability

**Error Tracking:**
- Not detected (console logging only)

**Analytics:**
- Not detected

**Logs:**
- Console logging only
- No external log aggregation

## CI/CD & Deployment

**Hosting:**
- GitHub Releases - Binary distribution
- Auto-update via Tauri updater plugin (`src/lib/updater.ts`)

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`)
- Workflows:
  - `ci.yml` - Quality checks (lint, test, type-check)
  - `release.yml` - Build and publish binaries
  - `claude.yml` - Claude Code integration

**Build Targets:**
- macOS: .app bundle
- Windows: NSIS installer
- Linux: AppImage

## Environment Configuration

**Development:**
- Required env vars: None
- Optional: `TAURI_DEV_HOST` for remote dev server
- Secrets location: Not applicable (no secrets)

**Staging:**
- Not applicable (no staging environment)

**Production:**
- No secrets management needed
- App runs fully offline

## Webhooks & Callbacks

**Incoming:**
- Not applicable

**Outgoing:**
- Not applicable

## Tauri-Specific Integrations

**Tauri Updater:**
- Service: GitHub Releases
- Implementation: `src/lib/updater.ts`
- Features:
  - Check for updates on app launch
  - Download progress tracking
  - Auto-restart after update

**Tauri Plugins Used:**
- @tauri-apps/plugin-updater ^2.9.0 - Auto-update (`src/lib/updater.ts`)
- @tauri-apps/plugin-opener ^2 - Open external links/files
- @tauri-apps/plugin-process ^2.3.1 - Process management (restart)

**IPC Commands (Rust → Frontend):**
- `load_scripts` - Scan script directories and return metadata
  - Location: `src-tauri/src/lib.rs`
  - Returns: Array of ScriptMetadata objects

## Summary

This is a **fully offline-capable desktop application** with minimal external dependencies:

- **No database** - Uses localStorage only
- **No external APIs** - All functionality is local
- **No authentication** - No user accounts needed
- **No analytics** - Privacy-focused design
- **Auto-update only** - Checks GitHub Releases for updates

The only external integration is the **Tauri updater** which checks GitHub Releases for new versions.

---

*Integration audit: 2025-01-12*
*Update when adding/removing external services*
