# Feature Specification: 에디터 탭 키 입력 지원

**Feature Branch**: `001-fix-editor-tab`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "editor에서 키보드 탭키가 작동을 안합니다."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 탭 키로 들여쓰기 (Priority: P1)

사용자가 에디터에서 코드나 텍스트를 작성할 때, Tab 키를 눌러 들여쓰기를 추가할 수 있다. 이는 개발자가 코드를 정리하거나 텍스트를 포맷팅할 때 가장 기본적인 기능이다.

**Why this priority**: 탭 키 들여쓰기는 텍스트 에디터의 핵심 기능으로, 이 기능 없이는 코드 편집이 매우 불편하다. Boop2의 주요 사용 사례인 코드 스니펫 변환에 필수적이다.

**Independent Test**: 에디터에 텍스트를 입력한 후 Tab 키를 눌렀을 때 커서 위치에 들여쓰기가 삽입되는지 확인

**Acceptance Scenarios**:

1. **Given** 에디터에 텍스트가 있고 커서가 줄 중간에 있을 때, **When** Tab 키를 누르면, **Then** 커서 위치에 들여쓰기가 삽입되고 커서는 삽입된 문자 뒤로 이동한다
2. **Given** 빈 에디터에서, **When** Tab 키를 누르면, **Then** 들여쓰기가 삽입된다
3. **Given** 줄의 시작 부분에 커서가 있을 때, **When** Tab 키를 누르면, **Then** 해당 줄 앞에 들여쓰기가 추가된다

---

### User Story 2 - Shift+Tab으로 내어쓰기 (Priority: P2)

사용자가 실수로 너무 많이 들여쓰기했거나 들여쓰기 수준을 줄이고 싶을 때, Shift+Tab을 눌러 들여쓰기를 제거할 수 있다.

**Why this priority**: 들여쓰기를 추가하는 것만큼 제거하는 것도 중요하다. 그러나 기본 들여쓰기 기능(US1) 없이는 내어쓰기도 의미가 없으므로 2순위이다.

**Independent Test**: 들여쓰기된 텍스트에서 Shift+Tab을 눌렀을 때 들여쓰기가 제거되는지 확인

**Acceptance Scenarios**:

1. **Given** 줄 시작에 들여쓰기가 있을 때, **When** Shift+Tab을 누르면, **Then** 하나의 들여쓰기 단위가 제거된다
2. **Given** 줄 시작에 들여쓰기가 없을 때, **When** Shift+Tab을 누르면, **Then** 아무 변화가 없다 (에러 발생 안 함)
3. **Given** 커서가 줄 중간에 있고 줄 시작에 들여쓰기가 있을 때, **When** Shift+Tab을 누르면, **Then** 줄 시작의 들여쓰기가 제거된다

---

### User Story 3 - 여러 줄 선택 후 들여쓰기/내어쓰기 (Priority: P3)

사용자가 여러 줄을 선택한 상태에서 Tab 또는 Shift+Tab을 눌러 선택된 모든 줄의 들여쓰기 수준을 한 번에 조정할 수 있다.

**Why this priority**: 코드 블록을 정리할 때 유용하지만, 단일 줄 들여쓰기(US1, US2)가 더 자주 사용된다. 고급 기능이므로 3순위이다.

**Independent Test**: 여러 줄을 선택한 후 Tab/Shift+Tab을 눌렀을 때 선택된 모든 줄이 동시에 변경되는지 확인

**Acceptance Scenarios**:

1. **Given** 3줄이 선택된 상태에서, **When** Tab 키를 누르면, **Then** 선택된 3줄 모두 앞에 들여쓰기가 추가된다
2. **Given** 3줄이 선택되고 각 줄에 들여쓰기가 있을 때, **When** Shift+Tab을 누르면, **Then** 선택된 3줄 모두에서 들여쓰기가 제거된다
3. **Given** 부분 선택(줄의 일부만 선택)된 상태에서, **When** Tab 키를 누르면, **Then** 선택 범위에 포함된 모든 줄 전체가 들여쓰기된다

---

### Edge Cases

- 탭 키 입력 시 에디터가 포커스를 잃지 않아야 한다 (브라우저 기본 동작 방지)
- 들여쓰기 제거 시 줄 시작의 공백이 들여쓰기 단위보다 적으면 있는 공백만 제거한다
- Undo(Cmd/Ctrl+Z)로 탭 입력을 되돌릴 수 있어야 한다
- IME 조합 중(한글 입력 중)에 Tab 키가 눌리면 조합을 완료한 후 들여쓰기를 삽입한다

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 에디터에서 Tab 키 입력 시 커서 위치에 들여쓰기가 삽입되어야 한다
- **FR-002**: 에디터에서 Shift+Tab 입력 시 현재 줄 시작의 들여쓰기가 제거되어야 한다
- **FR-003**: 여러 줄 선택 시 Tab/Shift+Tab이 선택된 모든 줄에 적용되어야 한다
- **FR-004**: Tab 키 입력으로 에디터가 포커스를 잃지 않아야 한다
- **FR-005**: Tab 입력/제거는 Undo/Redo 히스토리에 기록되어야 한다

### Assumptions

- **들여쓰기 단위**: 4개의 공백(스페이스) 사용 (대부분의 코드 에디터 기본값)
  - 탭 문자(`\t`) 대신 스페이스를 사용하여 일관된 렌더링 보장
- **기존 동작**: 현재 Tab 키가 브라우저 기본 포커스 이동으로 처리됨 (코드 분석으로 확인)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tab 키를 눌렀을 때 100% 에디터 내에서 들여쓰기가 삽입된다 (포커스 유지)
- **SC-002**: 사용자가 Tab/Shift+Tab으로 들여쓰기 작업을 1초 이내에 완료할 수 있다
- **SC-003**: 1000줄 이상의 텍스트에서도 Tab 키 응답이 100ms 이내이다
- **SC-004**: 기존 Boop 스크립트 호환성에 영향을 주지 않는다
