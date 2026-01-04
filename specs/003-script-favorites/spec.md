# Feature Specification: Script Favorites System with Keyboard Shortcuts

**Feature Branch**: `003-script-favorites`  
**Created**: 2026-01-04  
**Status**: Draft  
**Input**: User description: "Add script favorites system with keyboard shortcuts for quick access"

## User Scenarios & Testing

### User Story 1 - Quick Script Access with Number Shortcuts (Priority: P1)

As a developer who frequently uses JSON formatting, I want to press Cmd+1 to instantly format JSON without searching through the script list, so that I can process API responses in under 3 seconds.

**Why this priority**: This is the primary time-saving feature. Developers performing repetitive text transformations need sub-second access to their most-used scripts. The current workflow requires Cmd+B, typing "json", waiting for search, pressing Enter - which takes 5-10 seconds per operation.

**Independent Test**: Can be tested by pressing Cmd+1 and verifying that JSON formatting executes immediately without any additional steps. Delivers value: single-key access to user's #1 most-used script.

**Acceptance Scenarios**:

1. **Given** a user has set "JSON Format" as their favorite #1, **When** they press Cmd+1 in the Boop2 editor, **Then** JSON formatting should execute immediately on the current text.
2. **Given** a user has 5 favorites configured (Cmd+1 through Cmd+5), **When** they press any Cmd+number combination, **Then** the corresponding favorite script should execute within 200ms.
3. **Given** a user presses Cmd+6 when only 5 favorites are configured, **When** they press the shortcut, **Then** no action should occur (or a brief visual indicator showing "not configured").
4. **Given** the editor contains no text, **When** a user presses a favorite shortcut, **Then** the system should handle gracefully (no error, maybe a status message "No text to process").

---

### User Story 2 - Adding Scripts to Favorites (Priority: P1)

As a user who discovers a useful script, I want to add it to my favorites with a single click, so that I can build my personalized quick-access library without navigating through settings menus.

**Why this priority**: The favoriting mechanism must be frictionless. Users should be able to mark any script as favorite in 2 clicks or less from their natural workflow location (the Command Palette).

**Independent Test**: Can be tested by opening Command Palette, finding a script, clicking the star/favorite icon, and verifying the script appears in the Favorites section and responds to Cmd+number shortcuts.

**Acceptance Scenarios**:

1. **Given** a script is listed in the Command Palette (ALL SCRIPTS section), **When** the user clicks the star icon next to it, **Then** the script should be added to the FAVORITES section.
2. **Given** a script is already in FAVORITES, **When** the user clicks the star icon again, **Then** the script should be removed from FAVORITES.
3. **Given** a user has 5 favorites already, **When** they add a 6th favorite, **Then** the system should automatically remove the least recently used favorite to make room for the new one.
4. **Given** the Command Palette is open, **When** favorites change, **Then** the display should update immediately without reopening the palette.

---

### User Story 3 - Favorites Section in Command Palette (Priority: P1)

As a user who uses Boop2 daily, I want to see my favorites prominently displayed at the top of the Command Palette, so that I can quickly scan and access my most-used scripts without typing or searching.

**Why this priority**: This provides immediate visibility into personalized quick-access options, reducing cognitive load and search time. It creates a clear visual distinction between "my scripts" and "all scripts".

**Independent Test**: Can be tested by opening Command Palette and verifying the FAVORITES section appears at the top with up to 5 starred scripts.

**Acceptance Scenarios**:

1. **Given** the Command Palette is opened with no search query, **When** the user sees the palette, **Then** the FAVORITES section should appear first (before RECENT and ALL SCRIPTS).
2. **Given** no favorites are configured, **When** the Command Palette is opened, **Then** the FAVORITES section should not appear (or should show "No favorites - click the star icon to add").
3. **Given** a user has 3 favorites configured, **When** the Command Palette displays them, **Then** each favorite should show its assigned number (Cmd+1, Cmd+2, Cmd+3) accessible via tooltip on hover.
4. **Given** the Command Palette is in search mode (user typed a query), **When** results are shown, **Then** favorites should still be marked with a star icon but should not appear at the top (search results take precedence).

---

### User Story 4 - Removing Scripts from Favorites (Priority: P2)

As a user who changes their workflow, I want to remove scripts from my favorites easily, so that my quick-access list stays relevant to my current needs.

**Why this priority**: Users' most-used scripts change over time. Easy removal prevents favorites from becoming cluttered with obsolete shortcuts.

**Independent Test**: Can be tested by removing a favorite and verifying it no longer appears in FAVORITES section and its keyboard shortcut becomes available.

**Acceptance Scenarios**:

1. **Given** a script is in the FAVORITES section, **When** the user clicks the filled star icon, **Then** the script should be removed from FAVORITES.
2. **Given** a favorite with assigned number 3 is removed, **When** the user presses Cmd+3, **Then** the shortcut should become available for another script (reassignment or empty).
3. **Given** a user removes favorite #2 but keeps #1 and #3, **When** the favorites are displayed, **Then** the remaining favorites should keep their original number assignments (Cmd+1 and Cmd+3 remain, Cmd+2 is now empty).

---

### User Story 5 - Recent Scripts Independence (Priority: P2)

As a user who frequently uses both favorites and recent scripts, I want favorites and recent scripts to be managed separately, so that I can have quick access to important scripts without them being affected by recency-based ordering.

**Why this priority**: Favorites are for important scripts regardless of recency. Recent is for "what I just used". These are orthogonal concerns and should not interfere with each other.

**Independent Test**: Can be tested by using a script via favorite shortcut (Cmd+2) and verifying it does NOT appear in the RECENT section at the top of Command Palette.

**Acceptance Scenarios**:

1. **Given** a user executes a script via favorite shortcut (Cmd+2), **When** they open Command Palette, **Then** the script should NOT appear in the RECENT section (favorites are separate from recent history).
2. **Given** a user executes a script via Command Palette search or selection, **When** they open Command Palette, **Then** the script should appear in RECENT section as expected.
3. **Given** a script is in both FAVORITES and has been recently used, **When** the Command Palette is opened, **Then** the script should appear in FAVORITES section (not duplicated in RECENT at the top).

---

### Edge Cases

- **What happens when a user adds more than 5 favorites?**: The system automatically removes the least recently used favorite to maintain the 5-favorite limit.
- **What happens when a favorite script is deleted or moved by the user?**: The favorite should be removed gracefully with a one-time notification.
- **How does the system handle conflicting shortcuts?**: Cmd+1 through Cmd+5 are reserved for favorites; no other features should use these shortcuts.
- **What happens when Boop2 updates with a new bundled script with the same name?**: Script path-based matching ensures favorites reference the correct script.
- **How does favorites persistence work across restarts?**: Favorites are stored in localStorage and persist across app restarts.
- **What happens when a favorite script has an error during execution?**: Standard error handling applies; user sees error message, editor state remains unchanged.
- **What happens when LRU favorite is removed?**: User is not notified (silent automatic management to reduce friction).

## Requirements

### Functional Requirements

- **FR-001**: The system MUST allow users to add any script to a favorites collection via a visible star/favorite icon in the Command Palette.
- **FR-002**: The system MUST display a FAVORITES section at the top of the Command Palette when it is opened with no search query.
- **FR-003**: The system MUST support assigning keyboard shortcuts Cmd+1 through Cmd+5 to the first 5 favorites (in order of assignment).
- **FR-004**: When the user presses Cmd+number (1-5), the system MUST execute the corresponding favorite script immediately without opening the Command Palette.
- **FR-005**: The system MUST persist favorites data across app restarts using localStorage.
- **FR-006**: The system MUST allow users to remove scripts from favorites with a single click.
- **FR-007**: The system MUST show the assigned keyboard shortcut number as a tooltip when the user hovers over a favorite item in the Command Palette.
- **FR-008**: Executing a script via favorite shortcut MUST NOT affect the RECENT scripts list.
- **FR-009**: When the Command Palette is in search mode (user typed query), search results MUST take precedence over favorites display.
- **FR-010**: When a user adds a 6th favorite, the system MUST automatically remove the least recently used favorite without prompting the user.

### Key Entities

- **FavoriteScript**: Represents a user's saved favorite
  - `scriptPath`: string (reference to the script)
  - `assignedNumber`: number (1-5)
  - `createdAt`: timestamp (when favorited)
  - `lastUsedAt`: timestamp (when last executed via favorite)
  - `usageCount`: number (number of times executed via favorite shortcut)

- **FavoritesCollection**: Manages the user's favorite scripts
  - `favorites`: FavoriteScript[] (ordered list, max 5 items)
  - `maxSize`: number (fixed at 5 for numbered shortcuts)
  - `lastUpdated`: timestamp (when collection was last modified)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users MUST be able to access their #1 favorite script in under 200ms using Cmd+1 (single keypress from any editor state).
- **SC-002**: Users MUST be able to add or remove a script from favorites within 3 clicks from their natural workflow location (Command Palette).
- **SC-003**: 📅 **Roadmap Goal**: 95% of users SHOULD be able to configure their top 5 favorites and use Cmd+1 through Cmd+5 shortcuts without referring to documentation. _Note: Requires future analytics implementation to measure._
- **SC-004**: The favorites feature MUST NOT increase application startup time by more than 100ms.
- **SC-005**: 📅 **Roadmap Goal**: Users who set up favorites SHOULD use the Command Palette 30% less frequently for their top 5 scripts. _Note: Requires future usage analytics infrastructure to verify._

### Assumptions

- Maximum of 5 numbered shortcuts (Cmd+1 through Cmd+5) - standard macOS convention and prevents UI complexity.
- Favorites are ordered by "date added" for number assignment (first favorite = Cmd+1, second = Cmd+2, etc.).
- When removing a favorite, its number becomes available but existing favorites keep their numbers.
- The feature uses existing localStorage infrastructure for persistence (same as sessions and settings).
- Korean IME input is not required for the star icon interaction (button click only).
- LRU calculation is based on `lastUsedAt` timestamp (favorites used via shortcuts are considered "used").
- Keyboard shortcut indicators are shown as tooltips to keep the UI clean and uncluttered.

### Dependencies

- Existing Command Palette infrastructure (CommandPalette.tsx)
- localStorage for persistence (already implemented for sessions)
- Keyboard event handling (already implemented in App.tsx)
- SlateEditor ref exposure for text manipulation (already implemented)

## Clarifications Resolved

The following questions have been resolved based on user feedback:

| Question                        | Choice | Decision                                                                      |
| ------------------------------- | ------ | ----------------------------------------------------------------------------- |
| **Q1: Maximum Favorites Limit** | A      | 5 favorites max (Cmd+1~5 only) - simpler UX, standard macOS pattern           |
| **Q2: Overflow Behavior**       | A      | FIFO / LRU - new favorite automatically replaces least recently used favorite |
| **Q3: Visual Design**           | C      | Tooltip on hover - clean UI with "Press Cmd+X" hint on hover                  |

---

## Status: ✅ READY FOR PLANNING

All clarification questions resolved. Proceed to `/speckit.plan` to create implementation tasks.
