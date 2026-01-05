# Feature Specification: Command Palette Fixes

**Feature Branch**: `009-fix-command-palette`  
**Created**: 2026-01-05  
**Status**: Draft  
**Input**: User description: "cmd+b 에서

- 스크립트가 모두 나오지 않습니다.
- 리센트가 동작하지 않습니다.
- 검색이 정상적으로 동작하지 않습니다.
- 별아이콘과 recent가 세로로 되어있습니다. recent는 뺴주세요
- x 위치가 이상합니다. 세로 기준 중앙에 위치해야함.
- FAVORITES와 RECENT, ALL SCRIPTS의 리스트는 모두 같은 리스트로 표시됩니다. 만약 X가 없으면 X의 레이아웃의 넓이 높이는 유지하고 보이지만 않게 하면 모든 별 아이콘은 동일한 위치에 보일겁니다. "

---

## Clarifications

### Session 2026-01-05

- Q: 개별 항목의 "X" 버튼 기능 유지 여부 → A: RECENT 항목 전용 기능이므로 RECENT 리스트에서만 표시함. 단, 레이아웃 일관성을 위해 다른 리스트에서도 공간은 예약함.
- Q: RECENT 섹션 삭제 여부 → A: RECENT 섹션은 유지하고 동작을 수정함. 대신 FAVORITES 기능을 완전히 제거함.
- Q: 별 아이콘(즐겨찾기 표시)의 제거 여부 → A: FAVORITES 기능 삭제에 따라 모든 별 아이콘을 UI에서 제거함.

---

## User Scenarios & Testing

### User Story 1 - View RECENT and ALL SCRIPTS (Priority: P1)

As a user, I want to see a functional "RECENT" list and a full "ALL SCRIPTS" list so that I can quickly access both my latest work and the entire script library without duplication in inappropriate sections.

**Why this priority**: Core functionality of the palette. "FAVORITES" is removed to simplify the experience as requested.

**Independent Test**: Open palette, check "RECENT" section (should show recently used), check "ALL SCRIPTS" section (should show all 73 scripts).

**Acceptance Scenarios**:

1. **Given** several scripts have been executed, **When** the Command Palette is opened, **Then** the "RECENT" section displays those scripts in order.
2. **Given** the Command Palette is open, **When** viewing the "ALL SCRIPTS" section, **Then** it displays all 73 bundled scripts.
3. **Given** the update, **When** viewing any section, **Then** no "FAVORITES" section or star icons are displayed.

---

### User Story 2 - Search Across Active Sections (Priority: P1)

As a user, I want a functional search feature that filters both "RECENT" and "ALL SCRIPTS" so that I can find scripts instantly.

**Why this priority**: Primary navigation method.

**Independent Test**: Type a query and verify filtering in both sections.

**Acceptance Scenarios**:

1. **Given** the Command Palette is open, **When** a search query is entered, **Then** both RECENT and ALL SCRIPTS lists are filtered in real-time.

---

### User Story 3 - UI Alignment and Layout Consistency (Priority: P2)

As a user, I want the UI elements like the close button and list items to be perfectly aligned so that the interface feels professional.

**Why this priority**: Fixes specific layout bugs reported by the user.

**Independent Test**: Verify X button is centered vertically and script names are horizontally aligned regardless of the presence of an "X" button.

**Acceptance Scenarios**:

1. **Given** the Command Palette header, **When** viewed, **Then** the close (X) button is centered vertically.
2. **Given** "ALL SCRIPTS" items (which have no "X" button), **When** compared to "RECENT" items (which have an "X"), **Then** the script names/icons remain at the same horizontal position because the "X" button space is reserved.

---

### Edge Cases

- **First Run**: RECENT section should be hidden or show "No recent scripts" if none have been used.
- **RECENT limit**: 최근 사용 항목은 최대 **5개**까지 표시하며, 이를 초과할 경우 가장 오래된 항목부터 제거함.
- **Search Latency**: Ensure no lag when filtering 70+ items.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST display recently used scripts in the "RECENT" section.
- **FR-002**: System MUST display the full list of all 73 bundled scripts in the "ALL SCRIPTS" section.
- **FR-003**: System MUST completely remove the "FAVORITES" section and all related "star" icons/logic.
- **FR-004**: System MUST provide a search input that filters RECENT and ALL SCRIPTS in real-time.
- **FR-005**: System MUST vertically center the main close (X) button in the palette header.
- **FR-006**: System MUST show a removal "X" button ONLY on items in the RECENT list.
- **FR-007**: System MUST reserve the layout space for the per-item "X" button in ALL SCRIPTS to ensure horizontal alignment with RECENT items.

### Key Entities

- **CommandPalette**: UI container.
- **Script**: Script metadata (name, icon).
- **RecentStore**: Persistence for recently used script IDs.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: "FAVORITES" section and star icons are 100% removed.
- **SC-002**: RECENT 리스트가 최근 사용된 스크립트를 최대 5개까지 정확히 추적하고 표시함.
- **SC-003**: 100% horizontal alignment of script names across all sections (offset < 1px).
- **SC-004**: Search results update in < 50ms.

### Assumptions

- Recent scripts are stored in localStorage.
- The "X" button on RECENT items removes them from the recent list, not the system.
