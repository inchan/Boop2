# Feature Specification: Find Highlight Synchronization

**Feature Branch**: `007-find-highlight-sync`  
**Created**: 2026-01-05  
**Status**: Draft  
**Input**: User description: "서치모드가 종료되면 하이라이트도 없어져야함. 검색텍스트가 변경되면 하이라이트도 업데이트 되어야함" (When search mode ends, highlights should also disappear. When search text changes, highlights should also be updated)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Clear highlights when search closes (Priority: P1)

사용자가 검색 모드를 종료하면 에디터의 하이라이트가 모두 제거됩니다.

**Why this priority**: This is the core behavior expected by users - leaving search mode should clean up any visual indicators.

**Independent Test**: Can be tested by opening search, typing a search term to see highlights, closing search, and verifying no highlights remain.

**Acceptance Scenarios**:

1. **Given** 검색바가 열려 있고 검색어가 입력되어 하이라이트가 표시됨, **When** 사용자가 Escape 키를 누르거나 닫기 버튼을 클릭하여 검색 모드를 종료함, **Then** 모든 텍스트 하이라이트가 제거됨
2. **Given** 검색바가 열려 있고 검색어가 입력되어 하이라이트가 표시됨, **When** Cmd+F를 다시 눌러 검색 모드를 토글하여 닫음, **Then** 모든 텍스트 하이라이트가 제거됨
3. **Given** 검색바가 열려 있음 (검색어는 비어있음), **When** 사용자가 검색 모드를 종료함, **Then** 에디터에 변경 없음 (하이라이트 없음)

---

### User Story 2 - Update highlights when search text changes (Priority: P1)

사용자가 검색어 텍스트를 수정하면 하이라이트가 실시간으로 업데이트됩니다.

**Why this priority**: This provides immediate visual feedback, essential for efficient search navigation.

**Independent Test**: Can be tested by opening search, typing "hello" to see matches, then modifying to "hell" and verifying highlights update.

**Acceptance Scenarios**:

1. **Given** 검색바가 열려 있고 "hello"가 입력되어 하이라이트가 표시됨, **When** 사용자가 검색어를 "hell"로 수정함, **Then** 하이라이트가 "hell" 매치에 맞게 업데이트됨
2. **Given** 검색바가 열려 있고 검색어가 입력되어 여러 매치가 하이라이트됨, **When** 사용자가 검색어를 완전히 새로운 단어로 변경함, **Then** 이전 하이라이트가 모두 제거되고 새 매치만 하이라이트됨
3. **Given** 검색바가 열려 있음, **When** 사용자가 검색어를 백스페이스로 모두 삭제함, **Then** 모든 하이라이트가 즉시 제거됨

---

### User Story 3 - Highlight sync during navigation (Priority: P2)

사용자가 매치를 탐색할 때 활성 매치의 하이라이트 스타일이 업데이트됩니다.

**Why this priority**: Visual differentiation of active match helps users track their position in search results.

**Independent Test**: Can be tested by searching for a term with multiple matches and pressing Enter to navigate.

**Acceptance Scenarios**:

1. **Given** 검색어가 입력되어 여러 매치가 하이라이트됨, **When** Enter 키로 다음 매치로 이동함, **Then** 활성 매치의 하이라이트 색상이 변경되어 구분됨
2. **Given** 검색어가 입력되어 여러 매치가 하이라이트됨, **When** Shift+Enter로 이전 매치로 이동함, **Then** 이전 매치가 활성 상태로 표시됨

---

### Edge Cases

- 검색 모드가 닫힌 후에도 에디터 내용이 변경되면 어떻게 되는가?
- 검색 중 에디터 내용이 수정되면 하이라이트는 어떻게 되는가?
- IME 조합 중에는 하이라이트가 어떻게 동작하는가?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 검색 모드가 종료되면 모든 검색 하이라이트가 제거되어야 함
- **FR-002**: 검색어 텍스트가 변경되면 하이라이트가 실시간으로 업데이트되어야 함
- **FR-003**: 활성 매치와 비활성 매치는 시각적으로 구분되어야 함
- **FR-004**: 검색어 입력이 취소되거나 삭제되면 모든 하이라이트가 제거되어야 함

### Key Entities

- **SearchState**: 검색 모드의 현재 상태 (열림/닫힘, 검색어, 매치 목록, 활성 인덱스)
- **TextHighlight**: 에디터 텍스트에 적용되는 하이라이트 표시 (스타일, 위치)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 사용자가 검색 모드를 종료하면 100%의 경우 하이라이트가 즉시 제거됨
- **SC-002**: 검색어 변경 시 하이라이트가 100ms 이내에 업데이트됨
- **SC-003**: 활성 매치와 비활성 매치가 시각적으로 명확히 구분됨 (사용자 테스트로 검증)

## Assumptions

- 기존 검색 기능 (Cmd+F, Enter 탐색, 교체)은 이미 구현되어 있음
- 하이라이트는 텍스트 레벨에서 적용됨 (줄 전체가 아닌 매치된 텍스트만)
- 검색 모드 상태 관리는 useFind 훅에서 처리됨
