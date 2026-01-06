# Feature Specification: Fix Tab-Specific Undo History

**Feature Branch**: `010-fix-tab-undo`
**Created**: 2025-01-05
**Status**: Draft
**Input**: User description: "지금 cmd+z 하면 동작이 이상합니다. 1번탭에 잇다가 2번탭에서 cmd+z를 하면 1번탭의 cmd+z가 동작합니다."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tab-Independent Undo (Priority: P1)

사용자가 여러 탭에서 작업할 때, 각 탭의 Undo/Redo 히스토리가 독립적으로 동작해야 합니다. 현재는 탭 1에서 편집 후 탭 2로 이동하여 Cmd+Z를 누르면, 탭 1의 변경사항이 되돌려지는 버그가 있습니다.

**Why this priority**: 핵심 편집 기능의 버그로, 사용자 경험에 심각한 영향을 미침. 멀티탭 워크플로우의 기본 기대치를 위반함.

**Independent Test**: 두 개의 탭을 열고, 각 탭에서 독립적으로 텍스트를 입력한 후 Undo를 수행하여 해당 탭의 변경사항만 되돌려지는지 확인.

**Acceptance Scenarios**:

1. **Given** 탭 1에 "Hello"를 입력하고, 탭 2로 전환 후 "World"를 입력한 상태, **When** 탭 2에서 Cmd+Z를 누르면, **Then** 탭 2의 "World"만 되돌려지고 탭 1의 "Hello"는 유지됨
2. **Given** 탭 1에서 여러 번 편집 후 탭 2로 전환한 상태, **When** 탭 2에서 Cmd+Z를 누르면, **Then** 탭 2에 편집 히스토리가 없으므로 아무 변화 없음
3. **Given** 탭 2에서 편집 후 탭 1로 전환한 상태, **When** 탭 1에서 Cmd+Z를 누르면, **Then** 탭 1의 히스토리에 따라 탭 1만 되돌려짐

---

### User Story 2 - Tab-Independent Redo (Priority: P1)

Redo (Cmd+Shift+Z) 기능도 탭별로 독립적으로 동작해야 합니다.

**Why this priority**: Undo와 동일한 버그를 가질 수 있으며, Undo/Redo는 항상 쌍으로 동작해야 함.

**Independent Test**: 탭에서 Undo 후 Redo를 수행하여 해당 탭의 변경사항만 복원되는지 확인.

**Acceptance Scenarios**:

1. **Given** 탭 1에서 "Test" 입력 후 Undo한 상태, **When** 탭 2로 전환 후 다시 탭 1로 돌아와 Cmd+Shift+Z를 누르면, **Then** 탭 1에 "Test"가 다시 나타남
2. **Given** 탭 1에서 Undo한 후 탭 2로 전환한 상태, **When** 탭 2에서 Cmd+Shift+Z를 누르면, **Then** 탭 2의 Redo 히스토리에 따라 동작하며 탭 1에는 영향 없음

---

### User Story 3 - History Persistence Across Tab Switches (Priority: P2)

탭 전환 후 다시 돌아왔을 때 해당 탭의 Undo/Redo 히스토리가 보존되어야 합니다.

**Why this priority**: 사용자가 탭 간 전환하며 작업하는 것은 일반적인 워크플로우이며, 히스토리 손실은 불편함을 야기함.

**Independent Test**: 탭 1에서 여러 번 편집 후 탭 2로 전환했다가 다시 탭 1로 돌아와 Undo 동작 확인.

**Acceptance Scenarios**:

1. **Given** 탭 1에서 "A", "B", "C"를 순서대로 입력한 상태, **When** 탭 2로 전환 후 다시 탭 1로 돌아와 Cmd+Z를 세 번 누르면, **Then** "C", "B", "A" 순으로 되돌려짐
2. **Given** 탭에서 10회 이상 편집한 상태, **When** 다른 탭으로 전환 후 돌아오면, **Then** 모든 편집 히스토리가 보존되어 있음

---

### Edge Cases

- 새 탭 생성 시 빈 Undo 히스토리로 시작
- 탭 닫기 시 해당 탭의 히스토리 정리 (메모리 누수 방지)
- 스크립트 실행으로 텍스트가 변경된 경우에도 탭별 히스토리 유지
- 앱 재시작 시 히스토리는 초기화됨 (세션 간 히스토리 영속성은 범위 외)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 각 탭마다 독립적인 Undo/Redo 히스토리를 유지해야 함
- **FR-002**: 탭 전환 시 현재 탭의 히스토리가 보존되어야 함
- **FR-003**: Cmd+Z 실행 시 현재 활성 탭의 히스토리만 영향을 받아야 함
- **FR-004**: Cmd+Shift+Z 실행 시 현재 활성 탭의 히스토리만 영향을 받아야 함
- **FR-005**: 새 탭 생성 시 빈 히스토리로 초기화되어야 함
- **FR-006**: 탭 닫기 시 해당 탭의 히스토리가 정리되어야 함
- **FR-007**: 스크립트 실행 후에도 각 탭의 히스토리 독립성이 유지되어야 함

### Key Entities

- **Tab**: 개별 편집 세션을 나타내며, 고유 ID, 콘텐츠, 그리고 자체 편집 히스토리를 가짐
- **Edit History**: 특정 탭 내에서의 변경사항 스택으로, Undo/Redo 작업에 사용됨

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 탭 간 전환 후 Undo 실행 시 100% 정확하게 현재 탭의 변경사항만 되돌려짐
- **SC-002**: 5개 탭을 동시에 사용하는 시나리오에서 각 탭의 히스토리가 독립적으로 유지됨
- **SC-003**: 탭당 50회 이상의 편집 히스토리가 정상적으로 보존 및 동작함
- **SC-004**: 탭 닫기 후 메모리 사용량이 증가하지 않음 (히스토리 정리 확인)

## Non-Functional Requirements

- **NFR-001**: 탭당 최대 히스토리 깊이는 100으로 제한 (Slate.js 기본값)

## Assumptions

- Slate.js의 `withHistory` 플러그인이 에디터 인스턴스별로 독립적인 히스토리를 관리함
- 현재 단일 에디터 인스턴스가 모든 탭에서 공유되어 히스토리가 혼합되는 것으로 추정
- 세션 간 (앱 재시작) 히스토리 영속성은 이 기능의 범위에 포함되지 않음

## Clarifications

### Session 2025-01-05

- Q: 탭당 최대 히스토리 깊이 제한은? → A: 100 (Slate.js 기본값 유지)
